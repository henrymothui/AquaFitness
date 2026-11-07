-- Mai Nguyen was a legacy demo customer, not a Supabase Auth fixture.
do $$
declare
  v_customer_id uuid;
begin
  select id into v_customer_id
  from public.customers
  where lower(email) = 'member@hydrofit.demo';

  if v_customer_id is null then
    return;
  end if;

  delete from public.credit_orders where customer_id = v_customer_id;
  delete from public.credit_ledger
  where customer_package_id in (
    select id from public.customer_packages where customer_id = v_customer_id
  )
  or booking_id in (
    select id from public.bookings where customer_id = v_customer_id
  );
  delete from public.bookings where customer_id = v_customer_id;
  delete from public.customer_packages where customer_id = v_customer_id;
  delete from public.customers where id = v_customer_id;
end;
$$;
