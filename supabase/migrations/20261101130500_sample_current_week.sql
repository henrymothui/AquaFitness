-- The generator only creates classes that have not started yet.
-- Fill the week already on the calendar so the Class page is not empty.

insert into public.sessions (
  class_type_id, schedule_id, kind, starts_at, ends_at,
  capacity, credits_required, status, held
)
select
  s.class_type_id,
  s.id,
  'regular',
  (d.day + s.start_time) at time zone 'Asia/Singapore',
  (d.day + s.end_time) at time zone 'Asia/Singapore',
  coalesce(s.capacity, 10),
  1,
  'scheduled',
  false
from public.schedules s
join (
  values
    ('c3333333-3333-4333-8333-333333333301'::uuid, date '2026-10-26'),
    ('c3333333-3333-4333-8333-333333333302'::uuid, date '2026-10-27'),
    ('c3333333-3333-4333-8333-333333333303'::uuid, date '2026-10-28'),
    ('c3333333-3333-4333-8333-333333333304'::uuid, date '2026-10-29'),
    ('c3333333-3333-4333-8333-333333333305'::uuid, date '2026-10-30'),
    ('c3333333-3333-4333-8333-333333333306'::uuid, date '2026-10-31')
) as d(id, day) on d.id = s.id
on conflict (schedule_id, starts_at) do nothing;
