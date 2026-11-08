-- Sample timetable is Saturday only: four dates in November 2026 and four in December 2026.

do $$
declare
  v_session_id uuid;
  v_class uuid;
  v_day date;
  v_tz text := 'Asia/Singapore';
  v_keep date[] := array[
    date '2026-11-07',
    date '2026-11-14',
    date '2026-11-21',
    date '2026-11-28',
    date '2026-12-05',
    date '2026-12-12',
    date '2026-12-19',
    date '2026-12-26'
  ];
begin
  for v_session_id in
    select id
    from public.sessions
    where (starts_at at time zone v_tz)::date <> all (v_keep)
  loop
    perform private.cancel_and_delete_session(v_session_id);
  end loop;

  select id into v_class
  from public.class_types
  where lower(trim(name)) = 'aqua fit'
  order by id
  limit 1;

  if v_class is null then
    raise exception 'Aqua Fit class type is missing';
  end if;

  foreach v_day in array v_keep loop
    if not exists (
      select 1
      from public.sessions
      where (starts_at at time zone v_tz)::date = v_day
    ) then
      insert into public.sessions (
        class_type_id, starts_at, ends_at, capacity, credits_required, status, held
      ) values (
        v_class,
        (v_day + time '08:30') at time zone v_tz,
        (v_day + time '09:15') at time zone v_tz,
        10,
        1,
        'scheduled',
        false
      );
    end if;
  end loop;
end $$;
