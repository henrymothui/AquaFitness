-- AquaFitness booking core. No auth in this version.
-- Credit changes, capacity, and session generation go through private functions.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table public.studio_settings (
  id smallint primary key check (id = 1),
  name text not null,
  timezone text not null,
  default_capacity integer not null default 10 check (default_capacity > 0)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  email text,
  phone text,
  notes text,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on column public.customers.auth_user_id is
  'Reserved so a later login can attach to this person. Unused in this version.';

create unique index customers_email_uidx
  on public.customers (lower(email))
  where email is not null and email <> '';

create table public.class_types (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  description text,
  duration_minutes integer not null check (duration_minutes between 15 and 240),
  image_path text,
  default_capacity integer not null default 10 check (default_capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  class_type_id uuid not null references public.class_types (id),
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  capacity integer check (capacity is null or capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint schedules_time_chk check (end_time > start_time)
);

create index schedules_class_type_id_idx on public.schedules (class_type_id);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_type_id uuid not null references public.class_types (id),
  schedule_id uuid references public.schedules (id),
  kind text not null check (kind in ('regular', 'event')),
  title text,
  description text,
  image_path text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  credits_required integer not null default 1 check (credits_required > 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  held boolean not null default false,
  created_at timestamptz not null default now(),
  constraint sessions_time_chk check (ends_at > starts_at),
  constraint sessions_schedule_kind_chk check (
    (kind = 'regular' and schedule_id is not null)
    or (kind = 'event' and schedule_id is null)
  )
);

create unique index sessions_schedule_start_uidx
  on public.sessions (schedule_id, starts_at);

create index sessions_class_type_id_idx on public.sessions (class_type_id);
create index sessions_schedule_id_idx on public.sessions (schedule_id);
create index sessions_starts_at_idx on public.sessions (status, starts_at);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  description text,
  credit_count integer not null check (credit_count > 0),
  price_cents integer not null check (price_cents >= 0),
  validity_days integer check (validity_days is null or validity_days > 0),
  applies_to_all boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.package_class_types (
  package_id uuid not null references public.packages (id) on delete cascade,
  class_type_id uuid not null references public.class_types (id),
  primary key (package_id, class_type_id)
);

create index package_class_types_class_type_id_idx
  on public.package_class_types (class_type_id);

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  code text,
  kind text not null check (kind in ('percent', 'fixed')),
  amount integer not null,
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  applies_to_all boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint discounts_amount_chk check (
    (kind = 'percent' and amount between 1 and 100)
    or (kind = 'fixed' and amount > 0)
  ),
  constraint discounts_window_chk check (
    starts_at is null or ends_at is null or ends_at > starts_at
  )
);

create unique index discounts_code_uidx
  on public.discounts (code)
  where code is not null;

create table public.discount_packages (
  discount_id uuid not null references public.discounts (id) on delete cascade,
  package_id uuid not null references public.packages (id),
  primary key (discount_id, package_id)
);

create index discount_packages_package_id_idx
  on public.discount_packages (package_id);

create table public.customer_packages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  package_id uuid not null references public.packages (id),
  credits_total integer not null check (credits_total > 0),
  credits_used integer not null default 0 check (credits_used >= 0),
  price_cents integer not null check (price_cents >= 0),
  discount_id uuid references public.discounts (id),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  final_price_cents integer not null check (final_price_cents >= 0),
  purchased_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null check (status in ('active', 'exhausted', 'expired', 'cancelled')),
  constraint customer_packages_credits_chk check (credits_used <= credits_total),
  constraint customer_packages_price_chk check (final_price_cents = price_cents - discount_cents)
);

create index customer_packages_customer_id_idx on public.customer_packages (customer_id);
create index customer_packages_package_id_idx on public.customer_packages (package_id);
create index customer_packages_discount_id_idx on public.customer_packages (discount_id);
create index customer_packages_status_idx on public.customer_packages (status);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id),
  customer_id uuid not null references public.customers (id),
  customer_package_id uuid not null references public.customer_packages (id),
  credits_used integer not null check (credits_used > 0),
  status text not null check (status in ('booked', 'cancelled', 'attended', 'no_show')),
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create unique index bookings_active_customer_session_uidx
  on public.bookings (session_id, customer_id)
  where status <> 'cancelled';

create index bookings_session_id_idx on public.bookings (session_id);
create index bookings_customer_id_idx on public.bookings (customer_id);
create index bookings_customer_package_id_idx on public.bookings (customer_package_id);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_package_id uuid not null references public.customer_packages (id),
  booking_id uuid references public.bookings (id),
  delta integer not null,
  reason text not null check (reason in ('purchase', 'booking', 'cancel')),
  created_at timestamptz not null default now()
);

create index credit_ledger_customer_package_id_idx
  on public.credit_ledger (customer_package_id);
create index credit_ledger_booking_id_idx on public.credit_ledger (booking_id);

insert into public.studio_settings (id, name, timezone, default_capacity)
values (1, 'Hydrofit', 'Asia/Singapore', 10);

alter table public.studio_settings enable row level security;
alter table public.customers enable row level security;
alter table public.class_types enable row level security;
alter table public.schedules enable row level security;
alter table public.sessions enable row level security;
alter table public.packages enable row level security;
alter table public.package_class_types enable row level security;
alter table public.discounts enable row level security;
alter table public.discount_packages enable row level security;
alter table public.customer_packages enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.bookings enable row level security;

alter table public.studio_settings force row level security;
alter table public.customers force row level security;
alter table public.class_types force row level security;
alter table public.schedules force row level security;
alter table public.sessions force row level security;
alter table public.packages force row level security;
alter table public.package_class_types force row level security;
alter table public.discounts force row level security;
alter table public.discount_packages force row level security;
alter table public.customer_packages force row level security;
alter table public.credit_ledger force row level security;
alter table public.bookings force row level security;

-- Public site can read the catalog. Customer, sale, and booking rows stay server-only.
revoke all on table public.studio_settings from public, anon, authenticated;
revoke all on table public.class_types from public, anon, authenticated;
revoke all on table public.sessions from public, anon, authenticated;
revoke all on table public.packages from public, anon, authenticated;
revoke all on table public.package_class_types from public, anon, authenticated;

grant select on table public.studio_settings to anon, authenticated;
grant select on table public.class_types to anon, authenticated;
grant select on table public.sessions to anon, authenticated;
grant select on table public.packages to anon, authenticated;
grant select on table public.package_class_types to anon, authenticated;

revoke all on table public.customers from public, anon, authenticated;
revoke all on table public.schedules from public, anon, authenticated;
revoke all on table public.discounts from public, anon, authenticated;
revoke all on table public.discount_packages from public, anon, authenticated;
revoke all on table public.customer_packages from public, anon, authenticated;
revoke all on table public.credit_ledger from public, anon, authenticated;
revoke all on table public.bookings from public, anon, authenticated;

create policy studio_settings_read on public.studio_settings
  for select to anon, authenticated using (true);

create policy class_types_read on public.class_types
  for select to anon, authenticated using (active);

create policy sessions_read on public.sessions
  for select to anon, authenticated using (status = 'scheduled');

create policy packages_read on public.packages
  for select to anon, authenticated using (active);

create policy package_class_types_read on public.package_class_types
  for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'class-images',
  'class-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

create policy class_images_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'class-images');

-- Functions -----------------------------------------------------------------

create or replace function private.expire_packages()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.customer_packages
  set status = 'expired'
  where status = 'active'
    and expires_at is not null
    and expires_at <= now();
$$;

create or replace function private.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_pack public.customer_packages%rowtype;
begin
  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'cancelled' then
    return;
  end if;

  perform 1
  from public.sessions
  where id = v_booking.session_id
  for update;

  select * into v_pack
  from public.customer_packages
  where id = v_booking.customer_package_id
  for update;

  update public.bookings
  set status = 'cancelled', cancelled_at = now()
  where id = v_booking.id;

  update public.customer_packages
  set credits_used = credits_used - v_booking.credits_used,
      status = case
        when status = 'cancelled' then status
        when expires_at is not null and expires_at <= now() then 'expired'
        when credits_used - v_booking.credits_used >= credits_total then 'exhausted'
        else 'active'
      end
  where id = v_pack.id;

  insert into public.credit_ledger (customer_package_id, booking_id, delta, reason)
  values (v_pack.id, v_booking.id, v_booking.credits_used, 'cancel');
end;
$$;

create or replace function private.release_bookings(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking_id uuid;
begin
  for v_booking_id in
    select id
    from public.bookings
    where session_id = p_session_id
      and status <> 'cancelled'
  loop
    perform private.cancel_booking(v_booking_id);
  end loop;
end;
$$;

create or replace function private.cancel_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
begin
  select * into v_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Session not found';
  end if;

  if v_session.status = 'cancelled' then
    return;
  end if;

  perform private.release_bookings(p_session_id);

  update public.sessions
  set status = 'cancelled', held = true
  where id = p_session_id;
end;
$$;

create or replace function private.book_session(
  p_session_id uuid,
  p_customer_id uuid,
  p_customer_package_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_pack public.customer_packages%rowtype;
  v_package public.packages%rowtype;
  v_taken integer;
  v_booking_id uuid;
  v_covers boolean;
begin
  perform private.expire_packages();

  select * into v_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Session not found';
  end if;

  if v_session.status <> 'scheduled' then
    raise exception 'This session is cancelled';
  end if;

  select * into v_pack
  from public.customer_packages
  where id = p_customer_package_id
  for update;

  if not found then
    raise exception 'Package not found';
  end if;

  if v_pack.customer_id <> p_customer_id then
    raise exception 'Package does not belong to this customer';
  end if;

  if v_pack.status = 'exhausted' or v_pack.credits_total - v_pack.credits_used < v_session.credits_required then
    raise exception 'No credits left on this package';
  end if;

  if v_pack.status = 'expired' then
    raise exception 'Package has expired';
  end if;

  if v_pack.status <> 'active' then
    raise exception 'Package is not active';
  end if;

  if v_pack.expires_at is not null and v_pack.expires_at <= now() then
    update public.customer_packages set status = 'expired' where id = v_pack.id;
    raise exception 'Package has expired';
  end if;

  if v_pack.credits_total - v_pack.credits_used < v_session.credits_required then
    raise exception 'No credits left on this package';
  end if;

  select * into v_package from public.packages where id = v_pack.package_id;

  if v_package.applies_to_all then
    v_covers := true;
  else
    select exists (
      select 1
      from public.package_class_types
      where package_id = v_package.id
        and class_type_id = v_session.class_type_id
    ) into v_covers;
  end if;

  if not v_covers then
    raise exception 'This package does not cover this class';
  end if;

  if exists (
    select 1
    from public.bookings
    where session_id = p_session_id
      and customer_id = p_customer_id
      and status <> 'cancelled'
  ) then
    raise exception 'This customer is already booked on this session';
  end if;

  select count(*)::integer into v_taken
  from public.bookings
  where session_id = p_session_id
    and status <> 'cancelled';

  if v_taken >= v_session.capacity then
    raise exception 'This class is full';
  end if;

  insert into public.bookings (
    session_id, customer_id, customer_package_id, credits_used, status
  ) values (
    p_session_id, p_customer_id, p_customer_package_id, v_session.credits_required, 'booked'
  )
  returning id into v_booking_id;

  update public.customer_packages
  set credits_used = credits_used + v_session.credits_required,
      status = case
        when credits_used + v_session.credits_required >= credits_total then 'exhausted'
        else status
      end
  where id = v_pack.id;

  insert into public.credit_ledger (customer_package_id, booking_id, delta, reason)
  values (v_pack.id, v_booking_id, -v_session.credits_required, 'booking');

  return v_booking_id;
end;
$$;

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
  end if;

  v_final := v_package.price_cents - v_discount_cents;

  if v_package.validity_days is not null then
    v_expires := now() + make_interval(days => v_package.validity_days);
  end if;

  insert into public.customer_packages (
    customer_id, package_id, credits_total, credits_used,
    price_cents, discount_id, discount_cents, final_price_cents,
    expires_at, status
  ) values (
    p_customer_id, v_package.id, v_package.credit_count, 0,
    v_package.price_cents, p_discount_id, v_discount_cents, v_final,
    v_expires, 'active'
  )
  returning id into v_id;

  insert into public.credit_ledger (customer_package_id, delta, reason)
  values (v_id, v_package.credit_count, 'purchase');

  return v_id;
end;
$$;

create or replace function private.set_session_capacity(p_session_id uuid, p_capacity integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_taken integer;
begin
  if p_capacity < 1 then
    raise exception 'Capacity must be at least 1';
  end if;

  perform 1 from public.sessions where id = p_session_id for update;
  if not found then
    raise exception 'Session not found';
  end if;

  select count(*)::integer into v_taken
  from public.bookings
  where session_id = p_session_id
    and status <> 'cancelled';

  if p_capacity < v_taken then
    raise exception 'Capacity is below the number already booked';
  end if;

  update public.sessions
  set capacity = p_capacity, held = true
  where id = p_session_id;
end;
$$;

create or replace function private.create_event(
  p_class_type_id uuid,
  p_title text,
  p_description text,
  p_date date,
  p_start time,
  p_end time,
  p_capacity integer,
  p_credits integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_start timestamptz;
  v_end timestamptz;
  v_id uuid;
begin
  if p_capacity < 1 then
    raise exception 'Capacity must be at least 1';
  end if;
  if p_credits < 1 then
    raise exception 'Credits must be at least 1';
  end if;
  if p_end <= p_start then
    raise exception 'End time must be after the start time';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Title is required';
  end if;
  if not exists (
    select 1 from public.class_types where id = p_class_type_id and active
  ) then
    raise exception 'Choose an active class';
  end if;

  select timezone into v_tz from public.studio_settings where id = 1;
  v_start := (p_date + p_start) at time zone v_tz;
  v_end := (p_date + p_end) at time zone v_tz;

  insert into public.sessions (
    class_type_id, schedule_id, kind, title, description,
    starts_at, ends_at, capacity, credits_required, status, held
  ) values (
    p_class_type_id, null, 'event', trim(p_title), nullif(trim(coalesce(p_description, '')), ''),
    v_start, v_end, p_capacity, p_credits, 'scheduled', true
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function private.update_event(
  p_id uuid,
  p_class_type_id uuid,
  p_title text,
  p_description text,
  p_date date,
  p_start time,
  p_end time,
  p_capacity integer,
  p_credits integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_tz text;
  v_start timestamptz;
  v_end timestamptz;
  v_taken integer;
begin
  if p_capacity < 1 then
    raise exception 'Capacity must be at least 1';
  end if;
  if p_credits < 1 then
    raise exception 'Credits must be at least 1';
  end if;
  if p_end <= p_start then
    raise exception 'End time must be after the start time';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Title is required';
  end if;

  select * into v_session from public.sessions where id = p_id for update;
  if not found then
    raise exception 'Session not found';
  end if;
  if v_session.kind <> 'event' then
    raise exception 'This session is not an event';
  end if;
  if not exists (
    select 1 from public.class_types where id = p_class_type_id and active
  ) then
    raise exception 'Choose an active class';
  end if;

  select count(*)::integer into v_taken
  from public.bookings
  where session_id = p_id and status <> 'cancelled';

  if p_capacity < v_taken then
    raise exception 'Capacity is below the number already booked';
  end if;

  select timezone into v_tz from public.studio_settings where id = 1;
  v_start := (p_date + p_start) at time zone v_tz;
  v_end := (p_date + p_end) at time zone v_tz;

  update public.sessions
  set class_type_id = p_class_type_id,
      title = trim(p_title),
      description = nullif(trim(coalesce(p_description, '')), ''),
      starts_at = v_start,
      ends_at = v_end,
      capacity = p_capacity,
      credits_required = p_credits,
      held = true
  where id = p_id;
end;
$$;

create or replace function private.save_package_classes(
  p_package_id uuid,
  p_class_type_ids uuid[],
  p_applies_to_all boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.packages
  set applies_to_all = p_applies_to_all
  where id = p_package_id;

  if not found then
    raise exception 'Package not found';
  end if;

  delete from public.package_class_types where package_id = p_package_id;

  if not p_applies_to_all then
    insert into public.package_class_types (package_id, class_type_id)
    select distinct p_package_id, class_type_id
    from unnest(coalesce(p_class_type_ids, array[]::uuid[])) as class_type_id
    where class_type_id is not null;
  end if;
end;
$$;

create or replace function private.save_discount_packages(
  p_discount_id uuid,
  p_package_ids uuid[],
  p_applies_to_all boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.discounts
  set applies_to_all = p_applies_to_all
  where id = p_discount_id;

  if not found then
    raise exception 'Discount not found';
  end if;

  delete from public.discount_packages where discount_id = p_discount_id;

  if not p_applies_to_all then
    insert into public.discount_packages (discount_id, package_id)
    select distinct p_discount_id, package_id
    from unnest(coalesce(p_package_ids, array[]::uuid[])) as package_id
    where package_id is not null;
  end if;
end;
$$;

create or replace function private.set_booking_status(p_booking_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('booked', 'attended', 'no_show') then
    raise exception 'That status cannot be set here';
  end if;

  update public.bookings
  set status = p_status
  where id = p_booking_id
    and status <> 'cancelled';

  if not found then
    raise exception 'Booking cannot be updated';
  end if;
end;
$$;

create or replace function private.sync_schedule(p_schedule_id uuid, p_extend_only boolean default false)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_schedule public.schedules%rowtype;
  v_class public.class_types%rowtype;
  v_tz text;
  v_today date;
  v_day date;
  v_start timestamptz;
  v_end timestamptz;
  v_capacity integer;
  v_taken integer;
  v_existing public.sessions%rowtype;
  v_session_id uuid;
  v_created integer := 0;
  i integer;
begin
  select * into v_schedule from public.schedules where id = p_schedule_id;
  if not found then
    raise exception 'Schedule not found';
  end if;

  select * into v_class from public.class_types where id = v_schedule.class_type_id;
  select timezone into v_tz from public.studio_settings where id = 1;
  if v_tz is null then
    v_tz := 'Asia/Singapore';
  end if;

  if not p_extend_only and (not v_schedule.active or not coalesce(v_class.active, false)) then
    for v_session_id in
      select s.id
      from public.sessions s
      where s.schedule_id = p_schedule_id
        and s.status = 'scheduled'
        and s.starts_at >= now()
    loop
      perform private.release_bookings(v_session_id);
      update public.sessions set status = 'cancelled' where id = v_session_id;
    end loop;
    return 0;
  end if;

  if not v_schedule.active or not coalesce(v_class.active, false) then
    return 0;
  end if;

  if not p_extend_only then
    for v_session_id in
      select s.id
      from public.sessions s
      where s.schedule_id = p_schedule_id
        and s.held = false
        and s.status = 'scheduled'
        and s.starts_at >= now()
        and (
          extract(dow from (timezone(v_tz, s.starts_at)))::integer <> v_schedule.weekday
          or (timezone(v_tz, s.starts_at))::time <> v_schedule.start_time
        )
    loop
      perform private.release_bookings(v_session_id);
      update public.sessions set status = 'cancelled' where id = v_session_id;
    end loop;
  end if;

  v_today := (timezone(v_tz, now()))::date;
  v_capacity := coalesce(v_schedule.capacity, v_class.default_capacity, 10);

  for i in 0..83 loop
    v_day := v_today + i;
    if extract(dow from v_day)::integer <> v_schedule.weekday then
      continue;
    end if;

    v_start := (v_day + v_schedule.start_time) at time zone v_tz;
    v_end := (v_day + v_schedule.end_time) at time zone v_tz;

    if v_start < now() then
      continue;
    end if;

    select * into v_existing
    from public.sessions
    where schedule_id = p_schedule_id
      and starts_at = v_start;

    if found then
      if p_extend_only or v_existing.held then
        continue;
      end if;

      select count(*)::integer into v_taken
      from public.bookings
      where session_id = v_existing.id
        and status <> 'cancelled';

      update public.sessions
      set ends_at = v_end,
          capacity = greatest(v_capacity, v_taken),
          class_type_id = v_schedule.class_type_id,
          status = 'scheduled',
          kind = 'regular'
      where id = v_existing.id;
    else
      begin
        insert into public.sessions (
          class_type_id, schedule_id, kind, starts_at, ends_at,
          capacity, credits_required, status, held
        ) values (
          v_schedule.class_type_id, v_schedule.id, 'regular', v_start, v_end,
          v_capacity, 1, 'scheduled', false
        );
        v_created := v_created + 1;
      exception
        when unique_violation then
          null;
      end;
    end if;
  end loop;

  return v_created;
end;
$$;

create or replace function private.extend_active_schedules()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  for v_id in
    select s.id
    from public.schedules s
    join public.class_types c on c.id = s.class_type_id
    where s.active
      and c.active
  loop
    perform private.sync_schedule(v_id, true);
  end loop;
end;
$$;

create or replace function private.session_booking_counts(p_ids uuid[])
returns table (session_id uuid, taken integer)
language sql
stable
security definer
set search_path = ''
as $$
  select b.session_id, count(*)::integer as taken
  from public.bookings b
  where b.session_id = any(coalesce(p_ids, array[]::uuid[]))
    and b.status <> 'cancelled'
  group by b.session_id;
$$;

create or replace function private.follow_up()
returns table (
  customer_package_id uuid,
  customer_id uuid,
  full_name text,
  email text,
  phone text,
  package_name text,
  credits_total integer,
  credits_used integer,
  expires_at timestamptz,
  status text,
  last_class_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    cp.id,
    c.id,
    c.full_name,
    c.email,
    c.phone,
    p.name,
    cp.credits_total,
    cp.credits_used,
    cp.expires_at,
    cp.status,
    (
      select max(s.starts_at)
      from public.bookings b
      join public.sessions s on s.id = b.session_id
      where b.customer_package_id = cp.id
        and b.status <> 'cancelled'
    ) as last_class_at
  from public.customer_packages cp
  join public.customers c on c.id = cp.customer_id
  join public.packages p on p.id = cp.package_id
  where cp.status in ('active', 'exhausted', 'expired')
    and (
      cp.status in ('exhausted', 'expired')
      or cp.credits_total - cp.credits_used <= 2
      or (cp.expires_at is not null and cp.expires_at <= now() + interval '14 days')
    )
  order by (cp.credits_total - cp.credits_used), cp.expires_at nulls last;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on all functions in schema private to service_role;
