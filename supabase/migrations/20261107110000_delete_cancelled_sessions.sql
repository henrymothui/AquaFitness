-- Cancelled courses should not remain as visible historical sessions.
-- Preserve credit ledger entries while removing their session and booking rows.
do $$
declare
  v_session_id uuid;
begin
  for v_session_id in
    select id from public.sessions where status = 'cancelled'
  loop
    -- Repair any outstanding bookings before removing the session.
    perform private.release_bookings(v_session_id);

    -- Keep the ledger transaction history, but detach its optional booking FK.
    update public.credit_ledger ledger
    set booking_id = null
    from public.bookings booking
    where ledger.booking_id = booking.id
      and booking.session_id = v_session_id;

    delete from public.bookings where session_id = v_session_id;
    delete from public.sessions where id = v_session_id;
  end loop;
end;
$$;

create or replace function private.cancel_and_delete_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- This refunds active bookings and marks the session cancelled atomically.
  perform private.cancel_session(p_session_id);
  -- Also release any bookings if the session had already been marked cancelled.
  perform private.release_bookings(p_session_id);

  update public.credit_ledger ledger
  set booking_id = null
  from public.bookings booking
  where ledger.booking_id = booking.id
    and booking.session_id = p_session_id;

  delete from public.bookings where session_id = p_session_id;
  delete from public.sessions where id = p_session_id and status = 'cancelled';

  if not found then
    raise exception 'Cancelled session not found';
  end if;
end;
$$;

revoke all on function private.cancel_and_delete_session(uuid) from public, anon, authenticated;
grant execute on function private.cancel_and_delete_session(uuid) to service_role;
