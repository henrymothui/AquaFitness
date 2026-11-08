-- Record which admin set each attendance status, and when.
create table public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  status text not null check (status in ('booked', 'attended', 'no_show')),
  admin_account_id uuid references public.admin_accounts (id) on delete set null,
  admin_username text not null,
  created_at timestamptz not null default now()
);

create index attendance_events_session_created_idx
  on public.attendance_events (session_id, created_at desc);
create index attendance_events_booking_created_idx
  on public.attendance_events (booking_id, created_at desc);

alter table public.attendance_events enable row level security;
alter table public.attendance_events force row level security;
revoke all on table public.attendance_events from public, anon, authenticated;
grant all on table public.attendance_events to service_role;

drop function private.set_booking_status(uuid, text);

create function private.set_booking_status(
  p_booking_id uuid,
  p_status text,
  p_admin_account_id uuid,
  p_admin_username text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_status text;
begin
  if p_status not in ('booked', 'attended', 'no_show') then
    raise exception 'That status cannot be set here';
  end if;
  if p_admin_account_id is null or nullif(btrim(p_admin_username), '') is null then
    raise exception 'Admin sign-in required';
  end if;

  select session_id, status
  into v_session_id, v_status
  from public.bookings
  where id = p_booking_id
    and status <> 'cancelled';

  if not found then
    raise exception 'Booking cannot be updated';
  end if;

  if v_status = p_status then
    return;
  end if;

  update public.bookings
  set status = p_status
  where id = p_booking_id
    and status <> 'cancelled';

  insert into public.attendance_events (
    booking_id,
    session_id,
    status,
    admin_account_id,
    admin_username
  )
  values (
    p_booking_id,
    v_session_id,
    p_status,
    p_admin_account_id,
    btrim(p_admin_username)
  );
end;
$$;

revoke all on function private.set_booking_status(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function private.set_booking_status(uuid, text, uuid, text) to service_role;
