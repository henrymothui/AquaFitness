import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { rpc } from "@/lib/rpc";

export type StudioSettings = {
  name: string;
  timezone: string;
  default_capacity: number;
};

export type ClassType = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  image_path: string | null;
  default_capacity: number;
  active: boolean;
};

export type ScheduleRow = {
  id: string;
  class_type_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  capacity: number | null;
  active: boolean;
  class_name: string;
};

export type SessionView = {
  id: string;
  classTypeId: string;
  classTypeName: string;
  scheduleId: string | null;
  kind: "regular" | "event";
  title: string;
  description: string | null;
  ownDescription: string | null;
  imagePath: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  creditsRequired: number;
  status: string;
  held: boolean;
  durationMinutes: number;
};

export type PackageView = {
  id: string;
  name: string;
  description: string | null;
  credit_count: number;
  price_cents: number;
  validity_days: number | null;
  applies_to_all: boolean;
  active: boolean;
  classTypeIds: string[];
  classNames: string[];
};

export type DiscountView = {
  id: string;
  name: string;
  code: string | null;
  kind: "percent" | "fixed";
  amount: number;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  applies_to_all: boolean;
  active: boolean;
  packageIds: string[];
};

export type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type SaleView = {
  id: string;
  packageName: string;
  creditsTotal: number;
  creditsUsed: number;
  priceCents: number;
  discountCents: number;
  finalPriceCents: number;
  expiresAt: string | null;
  status: string;
  purchasedAt: string;
};

export type FollowUpRow = {
  customer_package_id: string;
  customer_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  package_name: string;
  credits_total: number;
  credits_used: number;
  expires_at: string | null;
  status: string;
  last_class_at: string | null;
};

export type RosterEntry = {
  id: string;
  status: string;
  creditsUsed: number;
  customerName: string;
  customerEmail: string | null;
  packageName: string;
  creditsLeft: number;
};

export type EligiblePack = {
  id: string;
  customerName: string;
  packageName: string;
  creditsLeft: number;
  expiresAt: string | null;
};

type QueryError = { message: string };

async function rows<T>(
  query: PromiseLike<{ data: T[] | null; error: QueryError | null }>,
): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getSettings(): Promise<StudioSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("studio_settings")
    .select("name, timezone, default_capacity")
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function ensureUpcoming() {
  await rpc("extend_active_schedules");
}

export async function listClassTypes(includeInactive = false) {
  const supabase = createAdminClient();
  let query = supabase
    .from("class_types")
    .select("id, name, description, duration_minutes, image_path, default_capacity, active")
    .order("name");
  if (!includeInactive) query = query.eq("active", true);
  return rows<ClassType>(query);
}

export async function getClassType(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("class_types")
    .select("id, name, description, duration_minutes, image_path, default_capacity, active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ClassType | null;
}

const sessionSelect = `
  id, class_type_id, schedule_id, kind, title, description, image_path,
  starts_at, ends_at, capacity, credits_required, status, held,
  class_types (name, description, image_path, duration_minutes)
`;

type SessionRow = {
  id: string;
  class_type_id: string;
  schedule_id: string | null;
  kind: "regular" | "event";
  title: string | null;
  description: string | null;
  image_path: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  credits_required: number;
  status: string;
  held: boolean;
  class_types:
    | {
        name: string;
        description: string | null;
        image_path: string | null;
        duration_minutes: number;
      }
    | {
        name: string;
        description: string | null;
        image_path: string | null;
        duration_minutes: number;
      }[]
    | null;
};

function mapSession(row: SessionRow): SessionView {
  const classType = one(row.class_types);
  return {
    id: row.id,
    classTypeId: row.class_type_id,
    classTypeName: classType?.name ?? "Class",
    scheduleId: row.schedule_id,
    kind: row.kind,
    title: row.title?.trim() || classType?.name || "Class",
    description: row.description ?? classType?.description ?? null,
    ownDescription: row.description,
    imagePath: row.image_path || classType?.image_path || null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    creditsRequired: row.credits_required,
    status: row.status,
    held: row.held,
    durationMinutes: classType?.duration_minutes ?? 0,
  };
}

export async function listSessionsBetween(from: string, to: string) {
  await ensureUpcoming();
  const supabase = createAdminClient();
  const data = await rows<SessionRow>(
    supabase
      .from("sessions")
      .select(sessionSelect)
      .eq("status", "scheduled")
      .gte("starts_at", from)
      .lt("starts_at", to)
      .order("starts_at"),
  );
  return data.map(mapSession);
}

export async function listUpcoming(limit: number) {
  await ensureUpcoming();
  const supabase = createAdminClient();
  const data = await rows<SessionRow>(
    supabase
      .from("sessions")
      .select(sessionSelect)
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(limit),
  );
  return data.map(mapSession);
}

export async function listEvents() {
  const supabase = createAdminClient();
  const data = await rows<SessionRow>(
    supabase
      .from("sessions")
      .select(sessionSelect)
      .eq("kind", "event")
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at"),
  );
  return data.map(mapSession);
}

export async function getSession(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(sessionSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSession(data as SessionRow) : null;
}

export async function bookingCounts(sessionIds: string[]) {
  const counts = new Map<string, number>();
  if (sessionIds.length === 0) return counts;
  const data = await rpc<{ session_id: string; taken: number }[]>("session_booking_counts", {
    p_ids: sessionIds,
  });
  for (const row of data ?? []) counts.set(row.session_id, row.taken);
  return counts;
}

export async function listSchedules() {
  const supabase = createAdminClient();
  const data = await rows<{
    id: string;
    class_type_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    capacity: number | null;
    active: boolean;
    class_types: { name: string } | { name: string }[] | null;
  }>(
    supabase
      .from("schedules")
      .select("id, class_type_id, weekday, start_time, end_time, capacity, active, class_types(name)")
      .order("weekday")
      .order("start_time"),
  );
  return data.map((row) => ({
    id: row.id,
    class_type_id: row.class_type_id,
    weekday: row.weekday,
    start_time: row.start_time,
    end_time: row.end_time,
    capacity: row.capacity,
    active: row.active,
    class_name: one(row.class_types)?.name ?? "Class",
  })) satisfies ScheduleRow[];
}

export async function listPackages(includeInactive = false) {
  const supabase = createAdminClient();
  let query = supabase
    .from("packages")
    .select(
      "id, name, description, credit_count, price_cents, validity_days, applies_to_all, active, package_class_types(class_type_id, class_types(name))",
    )
    .order("credit_count");
  if (!includeInactive) query = query.eq("active", true);
  const data = await rows<{
    id: string;
    name: string;
    description: string | null;
    credit_count: number;
    price_cents: number;
    validity_days: number | null;
    applies_to_all: boolean;
    active: boolean;
    package_class_types: {
      class_type_id: string;
      class_types: { name: string } | { name: string }[] | null;
    }[];
  }>(query);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    credit_count: row.credit_count,
    price_cents: row.price_cents,
    validity_days: row.validity_days,
    applies_to_all: row.applies_to_all,
    active: row.active,
    classTypeIds: row.package_class_types.map((item) => item.class_type_id),
    classNames: row.package_class_types
      .map((item) => one(item.class_types)?.name)
      .filter((name): name is string => Boolean(name)),
  })) satisfies PackageView[];
}

export async function getPackage(id: string) {
  const packages = await listPackages(true);
  return packages.find((item) => item.id === id) ?? null;
}

export async function listDiscounts(includeInactive = false) {
  const supabase = createAdminClient();
  let query = supabase
    .from("discounts")
    .select(
      "id, name, code, kind, amount, starts_at, ends_at, max_redemptions, redemption_count, applies_to_all, active, discount_packages(package_id)",
    )
    .order("name");
  if (!includeInactive) query = query.eq("active", true);
  const data = await rows<{
    id: string;
    name: string;
    code: string | null;
    kind: "percent" | "fixed";
    amount: number;
    starts_at: string | null;
    ends_at: string | null;
    max_redemptions: number | null;
    redemption_count: number;
    applies_to_all: boolean;
    active: boolean;
    discount_packages: { package_id: string }[];
  }>(query);

  return data.map((row) => ({
    ...row,
    packageIds: row.discount_packages.map((item) => item.package_id),
  })) satisfies DiscountView[];
}

export async function getDiscount(id: string) {
  const discounts = await listDiscounts(true);
  return discounts.find((item) => item.id === id) ?? null;
}

export async function listCustomers(search = "") {
  const supabase = createAdminClient();
  let query = supabase
    .from("customers")
    .select("id, full_name, email, phone, notes")
    .order("full_name");
  const term = search.trim();
  if (term) {
    const safe = term.replace(/[%_,]/g, "");
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }
  return rows<Customer>(query);
}

export async function getCustomer(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, email, phone, notes")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Customer | null;
}

export async function customerSales(customerId: string) {
  const supabase = createAdminClient();
  const data = await rows<{
    id: string;
    credits_total: number;
    credits_used: number;
    price_cents: number;
    discount_cents: number;
    final_price_cents: number;
    expires_at: string | null;
    status: string;
    purchased_at: string;
    packages: { name: string } | { name: string }[] | null;
  }>(
    supabase
      .from("customer_packages")
      .select(
        "id, credits_total, credits_used, price_cents, discount_cents, final_price_cents, expires_at, status, purchased_at, packages(name)",
      )
      .eq("customer_id", customerId)
      .order("purchased_at", { ascending: false }),
  );
  return data.map((row) => ({
    id: row.id,
    packageName: one(row.packages)?.name ?? "Package",
    creditsTotal: row.credits_total,
    creditsUsed: row.credits_used,
    priceCents: row.price_cents,
    discountCents: row.discount_cents,
    finalPriceCents: row.final_price_cents,
    expiresAt: row.expires_at,
    status: row.status,
    purchasedAt: row.purchased_at,
  })) satisfies SaleView[];
}

export async function customerBookings(customerId: string) {
  const supabase = createAdminClient();
  const data = await rows<{
    id: string;
    status: string;
    credits_used: number;
    sessions: SessionRow["class_types"] extends never ? never : {
      starts_at: string;
      title: string | null;
      status: string;
      class_types: { name: string } | { name: string }[] | null;
    } | {
      starts_at: string;
      title: string | null;
      status: string;
      class_types: { name: string } | { name: string }[] | null;
    }[] | null;
  }>(
    supabase
      .from("bookings")
      .select("id, status, credits_used, sessions(starts_at, title, status, class_types(name))")
      .eq("customer_id", customerId)
      .order("booked_at", { ascending: false })
      .limit(20),
  );
  return data.map((row) => {
    const session = one(row.sessions);
    const classType = session ? one(session.class_types) : null;
    return {
      id: row.id,
      status: row.status,
      creditsUsed: row.credits_used,
      startsAt: session?.starts_at ?? null,
      title: session?.title?.trim() || classType?.name || "Class",
    };
  });
}

export async function followUp() {
  await rpc("expire_packages");
  return (await rpc<FollowUpRow[]>("follow_up")) ?? [];
}

export async function roster(sessionId: string) {
  const supabase = createAdminClient();
  const data = await rows<{
    id: string;
    status: string;
    credits_used: number;
    customers: { full_name: string; email: string | null } | { full_name: string; email: string | null }[] | null;
    customer_packages: {
      credits_total: number;
      credits_used: number;
      packages: { name: string } | { name: string }[] | null;
    } | {
      credits_total: number;
      credits_used: number;
      packages: { name: string } | { name: string }[] | null;
    }[] | null;
  }>(
    supabase
      .from("bookings")
      .select(
        "id, status, credits_used, customers(full_name, email), customer_packages(credits_total, credits_used, packages(name))",
      )
      .eq("session_id", sessionId)
      .order("booked_at"),
  );
  return data.map((row) => {
    const customer = one(row.customers);
    const pack = one(row.customer_packages);
    const packageName = pack ? one(pack.packages)?.name ?? "Package" : "Package";
    return {
      id: row.id,
      status: row.status,
      creditsUsed: row.credits_used,
      customerName: customer?.full_name ?? "Customer",
      customerEmail: customer?.email ?? null,
      packageName,
      creditsLeft: pack ? Math.max(pack.credits_total - pack.credits_used, 0) : 0,
    } satisfies RosterEntry;
  });
}

export async function eligiblePacks(classTypeId: string, creditsRequired = 1) {
  await rpc("expire_packages");
  const supabase = createAdminClient();
  const data = await rows<{
    id: string;
    credits_total: number;
    credits_used: number;
    expires_at: string | null;
    customers: { full_name: string } | { full_name: string }[] | null;
    packages: {
      name: string;
      applies_to_all: boolean;
      package_class_types: { class_type_id: string }[];
    } | {
      name: string;
      applies_to_all: boolean;
      package_class_types: { class_type_id: string }[];
    }[] | null;
  }>(
    supabase
      .from("customer_packages")
      .select(
        "id, credits_total, credits_used, expires_at, customers!inner(full_name), packages!inner(name, applies_to_all, package_class_types(class_type_id))",
      )
      .eq("status", "active"),
  );

  const packs: EligiblePack[] = [];
  for (const row of data) {
    const left = row.credits_total - row.credits_used;
    if (left < creditsRequired) continue;
    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) continue;
    const pack = one(row.packages);
    if (!pack) continue;
    const covers =
      pack.applies_to_all ||
      pack.package_class_types.some((item) => item.class_type_id === classTypeId);
    if (!covers) continue;
    packs.push({
      id: row.id,
      customerName: one(row.customers)?.full_name ?? "Customer",
      packageName: pack.name,
      creditsLeft: left,
      expiresAt: row.expires_at,
    });
  }
  packs.sort((a, b) => a.customerName.localeCompare(b.customerName));
  return packs;
}
