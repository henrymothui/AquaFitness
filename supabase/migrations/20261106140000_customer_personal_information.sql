alter table public.customers
  add column title text check (title is null or title in ('Mr', 'Mrs')),
  add column date_of_birth date,
  add column address text;
