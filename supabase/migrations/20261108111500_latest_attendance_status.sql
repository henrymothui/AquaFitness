-- Keep only the latest attendance decision on the booking. Drop the event history.
alter table public.bookings
  add column status_set_by uuid references public.admin_accounts (id) on delete set null,
  add column status_set_by_username text,
  add column status_set_at timestamptz;

update public.bookings as booking
set
  status_set_by = latest.admin_account_id,
  status_set_by_username = latest.admin_username,
  status_set_at = latest.created_at
from (
  select distinct on (booking_id)
    booking_id,
    status,
    admin_account_id,
    admin_username,
    created_at
  from public.attendance_events
  order by booking_id, created_at desc
) as latest
where booking.id = latest.booking_id
  and booking.status = latest.status
  and booking.status in ('attended', 'no_show');

drop table public.attendance_events;

create or replace function private.set_booking_status(
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
  v_status text;
begin
  if p_status not in ('booked', 'attended', 'no_show') then
    raise exception 'That status cannot be set here';
  end if;
  if p_admin_account_id is null or nullif(btrim(p_admin_username), '') is null then
    raise exception 'Admin sign-in required';
  end if;

  select status
  into v_status
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
  set
    status = p_status,
    status_set_by = case when p_status = 'booked' then null else p_admin_account_id end,
    status_set_by_username = case when p_status = 'booked' then null else btrim(p_admin_username) end,
    status_set_at = case when p_status = 'booked' then null else now() end
  where id = p_booking_id
    and status <> 'cancelled';
end;
$$;
