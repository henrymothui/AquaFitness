-- Sample class week, a 10-class pack, and one upcoming workshop.

do $$
declare
  v_class uuid := 'a1111111-1111-4111-8111-111111111111';
  v_pack uuid := 'b2222222-2222-4222-8222-222222222222';
  v_schedule uuid;
  v_tz text;
  v_event_date date;
begin
  insert into public.class_types (
    id, name, description, duration_minutes, default_capacity, active
  ) values (
    v_class,
    'Aqua Fit',
    'A pool workout for strength, cardio, and mobility.',
    45,
    10,
    true
  )
  on conflict (id) do nothing;

  insert into public.schedules (
    id, class_type_id, weekday, start_time, end_time, capacity, active
  ) values
    ('c3333333-3333-4333-8333-333333333301', v_class, 1, '09:00', '09:45', 10, true),
    ('c3333333-3333-4333-8333-333333333302', v_class, 2, '18:30', '19:15', 10, true),
    ('c3333333-3333-4333-8333-333333333303', v_class, 3, '09:00', '09:45', 10, true),
    ('c3333333-3333-4333-8333-333333333304', v_class, 4, '18:30', '19:15', 10, true),
    ('c3333333-3333-4333-8333-333333333305', v_class, 5, '09:00', '09:45', 10, true),
    ('c3333333-3333-4333-8333-333333333306', v_class, 6, '08:30', '09:15', 10, true)
  on conflict (id) do nothing;

  for v_schedule in
    select id
    from public.schedules
    where id in (
      'c3333333-3333-4333-8333-333333333301',
      'c3333333-3333-4333-8333-333333333302',
      'c3333333-3333-4333-8333-333333333303',
      'c3333333-3333-4333-8333-333333333304',
      'c3333333-3333-4333-8333-333333333305',
      'c3333333-3333-4333-8333-333333333306'
    )
  loop
    perform private.sync_schedule(v_schedule, false);
  end loop;

  insert into public.packages (
    id, name, description, credit_count, price_cents, validity_days, applies_to_all, active
  ) values (
    v_pack,
    '10 Class Pack',
    'Ten Aqua Fit classes. Each class uses one credit.',
    10,
    18000,
    90,
    true,
    true
  )
  on conflict (id) do nothing;

  select timezone into v_tz from public.studio_settings where id = 1;
  if v_tz is null then
    v_tz := 'Asia/Singapore';
  end if;

  v_event_date := (timezone(v_tz, now()))::date + 3;
  if (v_event_date + time '10:00') at time zone v_tz <= now() then
    v_event_date := v_event_date + 1;
  end if;

  if not exists (
    select 1
    from public.sessions
    where kind = 'event'
      and title = 'Aqua Fit Workshop'
      and status = 'scheduled'
      and starts_at > now()
  ) then
    perform private.create_event(
      v_class,
      'Aqua Fit Workshop',
      'A longer session for technique and endurance. Uses 2 credits.',
      v_event_date,
      '10:00',
      '11:00',
      10,
      2
    );
  end if;
end $$;
