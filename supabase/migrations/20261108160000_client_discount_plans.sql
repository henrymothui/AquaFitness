create table public.discount_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  percent integer not null check (percent between 1 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customer_discounts (
  customer_id uuid primary key references public.customers (id) on delete cascade,
  discount_plan_id uuid not null references public.discount_plans (id),
  granted_at timestamptz not null default now()
);

create index customer_discounts_plan_id_idx
  on public.customer_discounts (discount_plan_id);

alter table public.customer_packages
  add column discount_plan_id uuid references public.discount_plans (id);

alter table public.credit_orders
  add column discount_cents integer not null default 0 check (discount_cents >= 0),
  add column discount_plan_id uuid references public.discount_plans (id);

alter table public.discount_plans enable row level security;
alter table public.discount_plans force row level security;
alter table public.customer_discounts enable row level security;
alter table public.customer_discounts force row level security;
revoke all on table public.discount_plans from public, anon, authenticated;
revoke all on table public.customer_discounts from public, anon, authenticated;
grant all on table public.discount_plans to service_role;
grant all on table public.customer_discounts to service_role;

create or replace function private.active_customer_discount(p_customer_id uuid)
returns table (plan_id uuid, percent integer)
language sql
stable
security definer
set search_path = ''
as $$
  select dp.id, dp.percent
  from public.customer_discounts as cd
  join public.discount_plans as dp on dp.id = cd.discount_plan_id
  where cd.customer_id = p_customer_id
    and dp.active;
$$;

revoke all on function private.active_customer_discount(uuid) from public, anon, authenticated;

create or replace function private.record_sale(
  p_customer_id uuid,
  p_package_id uuid,
  p_discount_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_package public.packages%rowtype;
  v_discount public.discounts%rowtype;
  v_plan_id uuid;
  v_percent integer;
  v_discount_cents integer := 0;
  v_final integer;
  v_expires timestamptz;
  v_id uuid;
  v_applies boolean;
begin
  perform private.expire_packages();

  if not exists (select 1 from public.customers where id = p_customer_id) then
    raise exception 'Customer not found';
  end if;

  select * into v_package
  from public.packages
  where id = p_package_id
  for update;

  if not found or not v_package.active then
    raise exception 'Package is not available';
  end if;

  if p_discount_id is not null then
    select * into v_discount
    from public.discounts
    where id = p_discount_id
    for update;

    if not found or not v_discount.active then
      raise exception 'Discount is not available';
    end if;

    if v_discount.starts_at is not null and v_discount.starts_at > now() then
      raise exception 'Discount is not available yet';
    end if;

    if v_discount.ends_at is not null and v_discount.ends_at < now() then
      raise exception 'Discount has expired';
    end if;

    if v_discount.max_redemptions is not null
      and v_discount.redemption_count >= v_discount.max_redemptions then
      raise exception 'Discount has been fully used';
    end if;

    if v_discount.applies_to_all then
      v_applies := true;
    else
      select exists (
        select 1
        from public.discount_packages
        where discount_id = v_discount.id
          and package_id = v_package.id
      ) into v_applies;
    end if;

    if not v_applies then
      raise exception 'Discount does not apply to this package';
    end if;

    if v_discount.kind = 'percent' then
      v_discount_cents := round(v_package.price_cents * v_discount.amount / 100.0)::integer;
    else
      v_discount_cents := least(v_discount.amount, v_package.price_cents);
    end if;

    update public.discounts
    set redemption_count = redemption_count + 1
    where id = v_discount.id;
  else
    select plan_id, percent
    into v_plan_id, v_percent
    from private.active_customer_discount(p_customer_id);

    if v_plan_id is not null then
      v_discount_cents := least(
        v_package.price_cents,
        round(v_package.price_cents * v_percent / 100.0)::integer
      );
    end if;
  end if;

  v_final := v_package.price_cents - v_discount_cents;

  if v_package.validity_days is not null then
    v_expires := now() + make_interval(days => v_package.validity_days);
  end if;

  insert into public.customer_packages (
    customer_id, package_id, credits_total, credits_used,
    price_cents, discount_id, discount_plan_id, discount_cents, final_price_cents,
    expires_at, status
  ) values (
    p_customer_id, v_package.id, v_package.credit_count, 0,
    v_package.price_cents, p_discount_id, v_plan_id, v_discount_cents, v_final,
    v_expires, 'active'
  )
  returning id into v_id;

  insert into public.credit_ledger (customer_package_id, delta, reason)
  values (v_id, v_package.credit_count, 'purchase');

  return v_id;
end;
$$;

create or replace function private.place_credit_orders(
  p_customer_id uuid,
  p_package_ids uuid[],
  p_quantities integer[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_index integer;
  v_package public.packages%rowtype;
  v_plan_id uuid;
  v_percent integer;
  v_list integer;
  v_discount_cents integer;
  v_count integer := 0;
begin
  if p_customer_id is null or coalesce(array_length(p_package_ids, 1), 0) < 1
    or array_length(p_package_ids, 1) > 12
    or array_length(p_package_ids, 1) <> array_length(p_quantities, 1) then
    raise exception 'Your order could not be checked. Please refresh and try again.';
  end if;

  if not exists (select 1 from public.customers where id = p_customer_id) then
    raise exception 'Your member profile could not be found.';
  end if;

  select plan_id, percent
  into v_plan_id, v_percent
  from private.active_customer_discount(p_customer_id);

  for v_index in 1..array_length(p_package_ids, 1) loop
    if p_quantities[v_index] is null or p_quantities[v_index] < 1 or p_quantities[v_index] > 10 then
      raise exception 'Order quantities must be between 1 and 10.';
    end if;
    select * into v_package from public.packages
    where id = p_package_ids[v_index] and active = true;
    if not found then raise exception 'A selected credit pack is no longer available.'; end if;

    v_list := v_package.price_cents * p_quantities[v_index];
    v_discount_cents := 0;
    if v_plan_id is not null then
      v_discount_cents := least(v_list, round(v_list * v_percent / 100.0)::integer);
    end if;

    insert into public.credit_orders (
      customer_id, package_id, package_name, quantity, credits_total, price_cents,
      discount_cents, discount_plan_id, validity_days
    ) values (
      p_customer_id, v_package.id, v_package.name, p_quantities[v_index],
      v_package.credit_count * p_quantities[v_index], v_list - v_discount_cents,
      v_discount_cents, v_plan_id, v_package.validity_days
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function private.resolve_credit_order(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.credit_orders%rowtype;
  v_package_id uuid;
  v_expires timestamptz;
  v_list integer;
begin
  if p_status not in ('paid', 'rejected') then raise exception 'Order status is not valid.'; end if;
  select * into v_order from public.credit_orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'This order has already been reviewed.'; end if;

  if p_status = 'paid' then
    if v_order.validity_days is not null then
      v_expires := now() + make_interval(days => v_order.validity_days);
    end if;
    v_list := v_order.price_cents + v_order.discount_cents;
    insert into public.customer_packages (
      customer_id, package_id, credits_total, credits_used, price_cents, discount_id,
      discount_plan_id, discount_cents, final_price_cents, expires_at, status
    ) values (
      v_order.customer_id, v_order.package_id, v_order.credits_total, 0, v_list,
      null, v_order.discount_plan_id, v_order.discount_cents, v_order.price_cents, v_expires, 'active'
    ) returning id into v_package_id;

    insert into public.credit_ledger (customer_package_id, delta, reason)
    values (v_package_id, v_order.credits_total, 'purchase');

    update public.credit_orders set status = 'paid', paid_at = now(), customer_package_id = v_package_id
    where id = v_order.id;
  else
    update public.credit_orders set status = 'rejected', rejected_at = now()
    where id = v_order.id;
  end if;
end;
$$;
