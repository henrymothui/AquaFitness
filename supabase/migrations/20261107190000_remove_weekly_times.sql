-- Remove recurring weekly time rules while preserving already-created dated classes.
drop function if exists private.extend_active_schedules();
drop function if exists private.sync_schedule(uuid, boolean);

drop index if exists public.sessions_schedule_start_uidx;
drop index if exists public.sessions_schedule_id_idx;

alter table public.sessions
  drop constraint if exists sessions_schedule_kind_chk,
  drop column if exists schedule_id;

drop table if exists public.schedules;
