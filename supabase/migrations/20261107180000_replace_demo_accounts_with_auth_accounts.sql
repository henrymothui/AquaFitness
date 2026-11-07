-- Store administrator credentials separately. Member identities live in Supabase Auth
-- and link directly to customers.auth_user_id.
create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}$'),
  password_hash text,
  created_at timestamptz not null default now()
);

insert into public.admin_accounts (id, username, password_hash)
select id, username, password_hash
from public.demo_accounts
where role = 'admin'
on conflict (id) do update
set username = excluded.username,
    password_hash = coalesce(excluded.password_hash, public.admin_accounts.password_hash);

create table if not exists public.app_sessions (
  token_hash text primary key,
  subject_id uuid not null,
  role text not null check (role in ('admin', 'public')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists app_sessions_expires_at_idx on public.app_sessions (expires_at);

alter table public.admin_accounts enable row level security;
alter table public.admin_accounts force row level security;
alter table public.app_sessions enable row level security;
alter table public.app_sessions force row level security;
revoke all on table public.admin_accounts, public.app_sessions from public, anon, authenticated;
grant all on table public.admin_accounts, public.app_sessions to service_role;

drop table if exists public.demo_sessions;
drop table if exists public.demo_accounts;
