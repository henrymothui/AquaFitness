create or replace function private.checkout_sessions(
  p_session_ids uuid[],
  p_customer_id uuid
)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_session public.sessions%rowtype;
  v_package_id uuid;
  v_booking_id uuid;
  v_bookings uuid[] := array[]::uuid[];
begin
  if coalesce(cardinality(p_session_ids), 0) = 0 then
    raise exception 'Add a class to your booking before checkout';
  end if;

  if cardinality(p_session_ids) > 12 then
    raise exception 'A booking can contain at most 12 classes';
  end if;

  for v_session_id in
    select selected.id
    from unnest(p_session_ids) as selected(id)
    join public.sessions s on s.id = selected.id
    group by selected.id, s.starts_at
    order by s.starts_at, selected.id
  loop
    select * into v_session
    from public.sessions
    where id = v_session_id
    for update;

    if v_session.status <> 'scheduled' or v_session.starts_at <= now() then
      raise exception 'One of the classes in your booking is no longer available';
    end if;

    select cp.id into v_package_id
    from public.customer_packages cp
    join public.packages p on p.id = cp.package_id
    left join public.package_class_types pct on pct.package_id = p.id
      and pct.class_type_id = v_session.class_type_id
    where cp.customer_id = p_customer_id
      and cp.status = 'active'
      and cp.credits_total - cp.credits_used >= v_session.credits_required
      and (cp.expires_at is null or cp.expires_at > now())
      and (p.applies_to_all or pct.class_type_id is not null)
    order by cp.expires_at asc nulls last, cp.purchased_at asc
    limit 1
    for update of cp skip locked;

    if v_package_id is null then
      raise exception 'You do not have enough eligible credits for %', coalesce(v_session.title, 'this class');
    end if;

    v_booking_id := private.book_session(v_session.id, p_customer_id, v_package_id);
    v_bookings := array_append(v_bookings, v_booking_id);
    v_package_id := null;
  end loop;

  if cardinality(v_bookings) <> cardinality(array(select distinct unnest(p_session_ids))) then
    raise exception 'One of the classes in your booking could not be found';
  end if;

  return v_bookings;
end;
$$;

revoke all on function private.checkout_sessions(uuid[], uuid) from public, anon, authenticated;
grant execute on function private.checkout_sessions(uuid[], uuid) to service_role;
