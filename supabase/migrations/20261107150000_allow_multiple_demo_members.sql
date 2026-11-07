-- Allow separate demo logins for local member test accounts.
alter table public.demo_accounts
  drop constraint if exists demo_accounts_username_check,
  drop constraint if exists demo_account_role_chk;

alter table public.demo_accounts
  add constraint demo_accounts_username_check
    check (username in ('user', 'admin', 'user1', 'user2', 'user3', 'user4')),
  add constraint demo_account_role_chk
    check (
      (username = 'admin' and role = 'admin' and customer_id is null)
      or (username in ('user', 'user1', 'user2', 'user3', 'user4')
        and role = 'public' and customer_id is not null)
    );
