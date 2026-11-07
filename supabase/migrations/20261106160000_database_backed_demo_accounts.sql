-- Persist the demo identities and their member link in Supabase.
create table public.demo_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username in ('user', 'admin')),
  role text not null check (role in ('public', 'admin')),
  customer_id uuid unique references public.customers (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint demo_account_role_chk check (
    (username = 'user' and role = 'public' and customer_id is not null)
    or (username = 'admin' and role = 'admin' and customer_id is null)
  )
);

create table public.demo_sessions (
  token_hash text primary key,
  account_id uuid not null references public.demo_accounts (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index demo_sessions_expires_at_idx on public.demo_sessions (expires_at);

revoke all on table public.demo_accounts, public.demo_sessions from public, anon, authenticated;
grant all on table public.demo_accounts, public.demo_sessions to service_role;

insert into public.customers (full_name, email, phone, notes)
values ('Mai Nguyen', 'member@hydrofit.demo', '+84 90 123 4567', 'Demo member account.')
on conflict (lower(email)) where email is not null and email <> '' do nothing;

insert into public.demo_accounts (username, role, customer_id)
select 'user', 'public', customer.id
from public.customers as customer
where lower(customer.email) = lower('member@hydrofit.demo')
on conflict (username) do update
set role = excluded.role,
    customer_id = coalesce(public.demo_accounts.customer_id, excluded.customer_id);

insert into public.demo_accounts (username, role, customer_id)
values ('admin', 'admin', null)
on conflict (username) do update
set role = excluded.role,
    customer_id = null;
