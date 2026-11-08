-- Coaches record attendance by username. Their id is not an admin account,
-- so status_set_by stays null while the username is still stored.
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
  if nullif(btrim(p_admin_username), '') is null then
    raise exception 'Sign-in required';
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

revoke all on function private.set_booking_status(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function private.set_booking_status(uuid, text, uuid, text) to service_role;
