-- Coach accounts are created by an admin. A coach can sign in to check in
-- only the courses assigned to them.

create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.coaches is
  'Studio coach logins. Admins create the username and password; coaches do not register.';

alter table public.sessions
  add column coach_id uuid references public.coaches (id) on delete set null;

create index sessions_coach_id_idx on public.sessions (coach_id);

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'app_sessions'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%role%';

  if constraint_name is not null then
    execute format('alter table public.app_sessions drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.app_sessions
  add constraint app_sessions_role_check
  check (role in ('admin', 'public', 'coach'));

alter table public.coaches enable row level security;
alter table public.coaches force row level security;
revoke all on table public.coaches from public, anon, authenticated;
grant all on table public.coaches to service_role;
