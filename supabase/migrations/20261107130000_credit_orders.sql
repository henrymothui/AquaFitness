create table public.credit_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  package_id uuid not null references public.packages (id),
  package_name text not null,
  quantity integer not null check (quantity between 1 and 10),
  credits_total integer not null check (credits_total > 0),
  price_cents integer not null check (price_cents >= 0),
  validity_days integer check (validity_days is null or validity_days > 0),
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'rejected')),
  customer_package_id uuid unique references public.customer_packages (id),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  rejected_at timestamptz,
  constraint credit_orders_resolution_chk check (
    (status = 'pending_payment' and customer_package_id is null and paid_at is null and rejected_at is null)
    or (status = 'paid' and customer_package_id is not null and paid_at is not null and rejected_at is null)
    or (status = 'rejected' and customer_package_id is null and paid_at is null and rejected_at is not null)
  )
);

create index credit_orders_customer_created_idx on public.credit_orders (customer_id, created_at desc);
create index credit_orders_status_created_idx on public.credit_orders (status, created_at desc);
alter table public.credit_orders enable row level security;
alter table public.credit_orders force row level security;
revoke all on table public.credit_orders from public, anon, authenticated;

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

  for v_index in 1..array_length(p_package_ids, 1) loop
    if p_quantities[v_index] is null or p_quantities[v_index] < 1 or p_quantities[v_index] > 10 then
      raise exception 'Order quantities must be between 1 and 10.';
    end if;
    select * into v_package from public.packages
    where id = p_package_ids[v_index] and active = true;
    if not found then raise exception 'A selected credit pack is no longer available.'; end if;

    insert into public.credit_orders (
      customer_id, package_id, package_name, quantity, credits_total, price_cents, validity_days
    ) values (
      p_customer_id, v_package.id, v_package.name, p_quantities[v_index],
      v_package.credit_count * p_quantities[v_index], v_package.price_cents * p_quantities[v_index],
      v_package.validity_days
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
begin
  if p_status not in ('paid', 'rejected') then raise exception 'Order status is not valid.'; end if;
  select * into v_order from public.credit_orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'This order has already been reviewed.'; end if;

  if p_status = 'paid' then
    if v_order.validity_days is not null then
      v_expires := now() + make_interval(days => v_order.validity_days);
    end if;
    insert into public.customer_packages (
      customer_id, package_id, credits_total, credits_used, price_cents, discount_id,
      discount_cents, final_price_cents, expires_at, status
    ) values (
      v_order.customer_id, v_order.package_id, v_order.credits_total, 0, v_order.price_cents,
      null, 0, v_order.price_cents, v_expires, 'active'
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

revoke all on function private.place_credit_orders(uuid, uuid[], integer[]) from public, anon, authenticated;
revoke all on function private.resolve_credit_order(uuid, text) from public, anon, authenticated;
grant execute on function private.place_credit_orders(uuid, uuid[], integer[]) to service_role;
grant execute on function private.resolve_credit_order(uuid, text) to service_role;
