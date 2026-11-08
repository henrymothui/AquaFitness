-- Admins can grant or remove credits, and place a client on a course, without
-- that client registering. Each change is written to the credit ledger and an
-- activity log that records who did it.

alter table public.credit_ledger
  add column note text,
  add column admin_account_id uuid references public.admin_accounts (id) on delete set null,
  add column admin_username text;

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'credit_ledger'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%reason%';

  if constraint_name is not null then
    execute format('alter table public.credit_ledger drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.credit_ledger
  add constraint credit_ledger_reason_check
  check (reason in ('purchase', 'booking', 'cancel', 'adjustment'));

alter table public.credit_ledger
  add constraint credit_ledger_note_length_check
  check (note is null or length(note) <= 160);

insert into public.packages (
  id, name, description, credit_count, price_cents, validity_days, applies_to_all, active
) values (
  '00000000-0000-4000-8000-0000000000c1',
  'Studio credit',
  'Internal balance for credits added by an admin. Not sold to clients.',
  1,
  0,
  null,
  true,
  false
)
on conflict (id) do nothing;

create table public.customer_admin_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  action text not null check (action in ('created', 'updated', 'credit', 'enrolled', 'cancelled', 'sale')),
  summary text not null check (length(summary) between 1 and 300),
  admin_account_id uuid references public.admin_accounts (id) on delete set null,
  admin_username text not null check (length(btrim(admin_username)) > 0),
  created_at timestamptz not null default now()
);

create index customer_admin_events_customer_created_idx
  on public.customer_admin_events (customer_id, created_at desc);

alter table public.customer_admin_events enable row level security;
alter table public.customer_admin_events force row level security;
revoke all on table public.customer_admin_events from public, anon, authenticated;
grant all on table public.customer_admin_events to service_role;

create function private.adjust_customer_credits(
  p_customer_id uuid,
  p_delta integer,
  p_note text,
  p_admin_account_id uuid,
  p_admin_username text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pack_id uuid;
  v_pack record;
  v_remaining integer;
  v_take integer;
  v_note text;
  v_summary text;
begin
  if p_delta = 0 or p_delta < -500 or p_delta > 500 then
    raise exception 'Credit change must be a whole number from -500 to 500, other than zero';
  end if;
  if p_admin_account_id is null or nullif(btrim(p_admin_username), '') is null then
    raise exception 'Admin sign-in required';
  end if;
  if not exists (select 1 from public.admin_accounts where id = p_admin_account_id) then
    raise exception 'Admin sign-in required';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and length(v_note) > 160 then
    raise exception 'Note must be 160 characters or fewer';
  end if;

  perform 1 from public.customers where id = p_customer_id for update;
  if not found then
    raise exception 'Customer not found';
  end if;

  if p_delta > 0 then
    select id into v_pack_id
    from public.customer_packages
    where customer_id = p_customer_id
      and package_id = '00000000-0000-4000-8000-0000000000c1'
      and status in ('active', 'exhausted')
      and expires_at is null
    order by purchased_at
    limit 1
    for update;

    if v_pack_id is null then
      insert into public.customer_packages (
        customer_id, package_id, credits_total, credits_used,
        price_cents, discount_cents, final_price_cents, status
      ) values (
        p_customer_id, '00000000-0000-4000-8000-0000000000c1', p_delta, 0,
        0, 0, 0, 'active'
      )
      returning id into v_pack_id;
    else
      update public.customer_packages
      set credits_total = credits_total + p_delta,
          status = 'active'
      where id = v_pack_id;
    end if;

    insert into public.credit_ledger (
      customer_package_id, delta, reason, note, admin_account_id, admin_username
    ) values (
      v_pack_id, p_delta, 'adjustment', v_note, p_admin_account_id, btrim(p_admin_username)
    );
  else
    v_remaining := -p_delta;
    for v_pack in
      select id, credits_total, credits_used
      from public.customer_packages
      where customer_id = p_customer_id
        and status = 'active'
        and credits_used < credits_total
        and (expires_at is null or expires_at > now())
      order by expires_at nulls last, purchased_at
      for update
    loop
      v_take := least(v_pack.credits_total - v_pack.credits_used, v_remaining);
      update public.customer_packages
      set credits_used = credits_used + v_take,
          status = case
            when credits_used + v_take >= credits_total then 'exhausted'
            else status
          end
      where id = v_pack.id;

      insert into public.credit_ledger (
        customer_package_id, delta, reason, note, admin_account_id, admin_username
      ) values (
        v_pack.id, -v_take, 'adjustment', v_note, p_admin_account_id, btrim(p_admin_username)
      );

      v_remaining := v_remaining - v_take;
      exit when v_remaining = 0;
    end loop;

    if v_remaining > 0 then
      raise exception 'This client does not have enough live credits to remove';
    end if;
  end if;

  v_summary := 'Credits ' || case when p_delta > 0 then '+' else '' end || p_delta::text;
  if v_note is not null then
    v_summary := v_summary || '. ' || v_note;
  end if;

  insert into public.customer_admin_events (
    customer_id, action, summary, admin_account_id, admin_username
  ) values (
    p_customer_id, 'credit', left(v_summary, 300), p_admin_account_id, btrim(p_admin_username)
  );
end;
$$;

create function private.enroll_customer(
  p_session_id uuid,
  p_customer_id uuid,
  p_note text,
  p_admin_account_id uuid,
  p_admin_username text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_pack_id uuid;
  v_booking_id uuid;
  v_note text;
  v_title text;
  v_starts timestamptz;
  v_timezone text;
  v_summary text;
begin
  if p_admin_account_id is null or nullif(btrim(p_admin_username), '') is null then
    raise exception 'Admin sign-in required';
  end if;
  if not exists (select 1 from public.admin_accounts where id = p_admin_account_id) then
    raise exception 'Admin sign-in required';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and length(v_note) > 160 then
    raise exception 'Note must be 160 characters or fewer';
  end if;

  perform 1 from public.customers where id = p_customer_id for update;
  if not found then
    raise exception 'Customer not found';
  end if;

  select * into v_session
  from public.sessions
  where id = p_session_id;

  if not found then
    raise exception 'Session not found';
  end if;

  select cp.id into v_pack_id
  from public.customer_packages cp
  join public.packages p on p.id = cp.package_id
  where cp.customer_id = p_customer_id
    and cp.status = 'active'
    and cp.credits_total - cp.credits_used >= v_session.credits_required
    and (cp.expires_at is null or cp.expires_at > now())
    and (
      p.applies_to_all
      or exists (
        select 1
        from public.package_class_types pct
        where pct.package_id = p.id
          and pct.class_type_id = v_session.class_type_id
      )
    )
  order by cp.expires_at nulls last, cp.purchased_at
  limit 1;

  if v_pack_id is null then
    raise exception 'This client does not have enough credits for this course';
  end if;

  v_booking_id := private.book_session(p_session_id, p_customer_id, v_pack_id);

  update public.credit_ledger
  set
    note = coalesce(v_note, 'Added to the course by the studio'),
    admin_account_id = p_admin_account_id,
    admin_username = btrim(p_admin_username)
  where booking_id = v_booking_id
    and reason = 'booking';

  select coalesce(nullif(btrim(s.title), ''), ct.name, 'Course'), s.starts_at
  into v_title, v_starts
  from public.sessions s
  join public.class_types ct on ct.id = s.class_type_id
  where s.id = p_session_id;

  select timezone into v_timezone from public.studio_settings where id = 1;

  v_summary := 'Added to ' || coalesce(v_title, 'course') || ' · ' ||
    to_char(v_starts at time zone coalesce(v_timezone, 'UTC'), 'DD Mon YYYY, HH12:MI am');
  if v_note is not null then
    v_summary := v_summary || '. ' || v_note;
  end if;

  insert into public.customer_admin_events (
    customer_id, action, summary, admin_account_id, admin_username
  ) values (
    p_customer_id, 'enrolled', left(v_summary, 300), p_admin_account_id, btrim(p_admin_username)
  );

  return v_booking_id;
end;
$$;

revoke all on function private.adjust_customer_credits(uuid, integer, text, uuid, text) from public, anon, authenticated;
grant execute on function private.adjust_customer_credits(uuid, integer, text, uuid, text) to service_role;

revoke all on function private.enroll_customer(uuid, uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function private.enroll_customer(uuid, uuid, text, uuid, text) to service_role;
