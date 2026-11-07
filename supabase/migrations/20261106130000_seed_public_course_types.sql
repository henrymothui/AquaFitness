-- Ensure the four course types used for class bookings and schedules exist.
-- Public Classes page content remains in the localized site copy.
update public.class_types
set description = 'Cardio and strength, one visit. The everyday class: warm up, work, cool down, then come back next week.'
where lower(trim(name)) = 'aqua fit'
  and description = 'A pool workout for strength, cardio, and mobility.';

insert into public.class_types (
  name,
  description,
  duration_minutes,
  default_capacity,
  image_path,
  active
)
select
  seed.name,
  seed.description,
  45,
  10,
  seed.image_path,
  true
from (
  values
    (
      'Aqua Fit',
      'Cardio and strength, one visit. The everyday class: warm up, work, cool down, then come back next week.',
      '/brand/class-fit.jpg'
    ),
    (
      'Aqua Strength',
      'Resistance first. Impact last. Slower sets with foam dumbbells and drag, so the work stays in the muscle.',
      '/brand/class-strength.jpg'
    ),
    (
      'Aqua Restore',
      'Move well and leave lighter. A quieter class for range, balance, and the days you want to recover.',
      '/brand/class-restore.jpg'
    ),
    (
      'Saturday Wave',
      'The weekend class in the same pool. Saturday morning for anyone who misses the weekday slots: a full workout in a small group.',
      '/brand/class-saturday.jpg'
    )
) as seed(name, description, image_path)
where not exists (
  select 1
  from public.class_types existing
  where lower(trim(existing.name)) = lower(seed.name)
);

-- Existing seeded types get the Classes page image unless a studio image was uploaded.
update public.class_types as course
set image_path = seed.image_path
from (
  values
    ('aqua fit', '/brand/class-fit.jpg'),
    ('aqua strength', '/brand/class-strength.jpg'),
    ('aqua restore', '/brand/class-restore.jpg'),
    ('saturday wave', '/brand/class-saturday.jpg')
) as seed(name, image_path)
where lower(trim(course.name)) = seed.name
  and course.image_path is null;
