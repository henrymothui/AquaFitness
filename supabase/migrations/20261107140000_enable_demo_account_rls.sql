-- These tables contain demo identity/session data. The app accesses them through
-- the server-only service role client, which bypasses row-level security.
alter table public.demo_accounts enable row level security;
alter table public.demo_sessions enable row level security;
