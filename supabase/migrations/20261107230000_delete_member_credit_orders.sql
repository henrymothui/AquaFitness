create or replace function private.delete_member_credit_order(p_order_id uuid, p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.credit_orders%rowtype;
begin
  if p_order_id is null or p_customer_id is null then
    raise exception 'This order could not be deleted.';
  end if;

  select * into v_order from public.credit_orders where id = p_order_id for update;
  if not found or v_order.customer_id <> p_customer_id then
    raise exception 'This order could not be deleted.';
  end if;
  if v_order.status not in ('pending_payment', 'rejected') then
    raise exception 'Only pending or rejected orders can be deleted.';
  end if;

  delete from public.credit_orders where id = v_order.id;
end;
$$;

revoke all on function private.delete_member_credit_order(uuid, uuid) from public, anon, authenticated;
grant execute on function private.delete_member_credit_order(uuid, uuid) to service_role;
