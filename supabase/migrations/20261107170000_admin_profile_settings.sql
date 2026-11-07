-- Allow the admin login name to be changed and store a derived password hash.
alter table public.demo_accounts
  add column if not exists password_hash text,
  drop constraint if exists demo_accounts_username_check,
  drop constraint if exists demo_account_role_chk;

alter table public.demo_accounts
  add constraint demo_accounts_username_check
    check (
      (role = 'admin' and username ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}$')
      or (role = 'public' and (
        username ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
        or username in ('user', 'user1', 'user2', 'user3', 'user4')
      ))
    ),
  add constraint demo_account_role_chk
    check (
      (role = 'admin' and customer_id is null and auth_user_id is null)
      or (
        role = 'public' and customer_id is not null
        and (username !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or auth_user_id is not null)
      )
    );
