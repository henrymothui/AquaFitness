-- Remove one-off event sessions and the event-only fields and RPCs.
do $$
declare
  v_session_id uuid;
begin
  for v_session_id in
    select id from public.sessions where kind = 'event'
  loop
    -- Refund active bookings and preserve the credit ledger before deleting the sessions.
    perform private.cancel_and_delete_session(v_session_id);
  end loop;
end;
$$;

drop function if exists private.create_event(uuid, text, text, date, time, time, integer, integer);
drop function if exists private.update_event(uuid, uuid, text, text, date, time, time, integer, integer);

alter table public.sessions
  drop constraint if exists sessions_schedule_kind_chk,
  drop constraint if exists sessions_kind_check,
  drop column if exists kind;
