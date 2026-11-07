-- Real member identities are owned by Supabase Auth. The application keeps
-- customer records for bookings and links each member identity to one record.
alter table public.demo_accounts
  drop constraint if exists demo_accounts_username_check,
  drop constraint if exists demo_account_role_chk,
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete cascade;

alter table public.demo_accounts
  add constraint demo_accounts_username_check
    check (username = 'admin' or username ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or username in ('user', 'user1', 'user2', 'user3', 'user4')),
  add constraint demo_account_role_chk
    check (
      (username = 'admin' and role = 'admin' and customer_id is null and auth_user_id is null)
      or (
        role = 'public' and customer_id is not null
        and (username !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or auth_user_id is not null)
      )
    );

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  phone text check (phone is null or length(phone) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_profiles force row level security;
revoke all on table public.user_profiles from public, anon;
grant select, update on table public.user_profiles to authenticated;
revoke update on table public.user_profiles from authenticated;
grant update (full_name, phone) on table public.user_profiles to authenticated;

create policy user_profiles_read_self on public.user_profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy user_profiles_update_self on public.user_profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), nullif(split_part(new.email, '@', 1), ''), 'Member')
  );
  return new;
end;
$$;

revoke all on function public.create_user_profile() from public, anon, authenticated;
drop trigger if exists create_user_profile_after_signup on auth.users;
create trigger create_user_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_user_profile();

create or replace function public.sync_customer_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.auth_user_id is not null and tg_op = 'INSERT' then
    update public.user_profiles
    set full_name = new.full_name,
        phone = new.phone,
        updated_at = now()
    where id = new.auth_user_id;
  elsif new.auth_user_id is not null and (
    new.full_name is distinct from old.full_name or new.phone is distinct from old.phone
  ) then
    update public.user_profiles
    set full_name = new.full_name,
        phone = new.phone,
        updated_at = now()
    where id = new.auth_user_id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_customer_user_profile() from public, anon, authenticated;
drop trigger if exists sync_customer_user_profile_after_update on public.customers;
create trigger sync_customer_user_profile_after_update
  after update of full_name, phone on public.customers
  for each row execute function public.sync_customer_user_profile();
drop trigger if exists sync_customer_user_profile_after_insert on public.customers;
create trigger sync_customer_user_profile_after_insert
  after insert on public.customers
  for each row execute function public.sync_customer_user_profile();

comment on table public.user_profiles is
  'Member profile data for Supabase Auth identities. Row-level security limits access to the owning user.';
