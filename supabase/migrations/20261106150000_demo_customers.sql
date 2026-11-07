-- Fictional customers so the Studio directory has sample records in demo setups.
insert into public.customers (full_name, email, phone, notes)
values
  ('Ava Tan', 'ava.tan@example.test', '+65 0000 0101', 'Demo customer record.'),
  ('Noah Lim', 'noah.lim@example.test', '+65 0000 0102', 'Demo customer record.'),
  ('Mia Nguyen', 'mia.nguyen@example.test', '+65 0000 0103', 'Demo customer record.')
on conflict (lower(email)) where email is not null and email <> '' do nothing;
