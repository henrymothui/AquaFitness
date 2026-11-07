-- Remove prior sample customers other than the old Mai demo record. The local
-- Auth-backed sample members are created by scripts/seed-local-users.mjs.
do $$
declare
  v_seed_emails text[] := array[
    'ava.tan@example.test',
    'noah.lim@example.test',
    'mia.nguyen@example.test',
    'user1@hydrofit.demo',
    'user2@hydrofit.demo',
    'user3@hydrofit.demo',
    'user4@hydrofit.demo'
  ];
begin
  delete from public.credit_orders
  where customer_id in (
    select id from public.customers where lower(email) = any(v_seed_emails)
  );

  delete from public.credit_ledger
  where customer_package_id in (
    select package.id
    from public.customer_packages as package
    join public.customers as customer on customer.id = package.customer_id
    where lower(customer.email) = any(v_seed_emails)
  )
  or booking_id in (
    select booking.id
    from public.bookings as booking
    join public.customers as customer on customer.id = booking.customer_id
    where lower(customer.email) = any(v_seed_emails)
  );

  delete from public.bookings
  where customer_id in (
    select id from public.customers where lower(email) = any(v_seed_emails)
  );

  delete from public.customer_packages
  where customer_id in (
    select id from public.customers where lower(email) = any(v_seed_emails)
  );

  delete from public.customers
  where lower(email) = any(v_seed_emails);
end;
$$;
