insert into public.packages (
  id, name, description, credit_count, price_cents, validity_days,
  applies_to_all, active
) values
  (
    'b2222222-2222-4222-8222-822222222221',
    'Single class',
    'A good way to try a new class.',
    1,
    2200,
    90,
    true,
    true
  ),
  (
    'b2222222-2222-4222-8222-822222222225',
    '5 class pack',
    'More room in your week to move.',
    5,
    10000,
    90,
    true,
    true
  ),
  (
    'b2222222-2222-4222-8222-222222222222',
    '10 class pack',
    'Best value · save SGD 40 versus singles.',
    10,
    18000,
    90,
    true,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  credit_count = excluded.credit_count,
  price_cents = excluded.price_cents,
  validity_days = excluded.validity_days,
  applies_to_all = excluded.applies_to_all,
  active = excluded.active;
