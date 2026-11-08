import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { rpc } from "@/lib/rpc";
import { STUDIO_CREDIT_PACKAGE_ID } from "@/lib/studio-credit";

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
  color: string;
  default_capacity: number;
  active: boolean;
};

export type SessionView = {
  id: string;
  classTypeId: string;
  classTypeName: string;
  title: string;
  description: string | null;
  ownDescription: string | null;
  imagePath: string | null;
  classTypeColor: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  creditsRequired: number;
  instructor: string | null;
  coachId: string | null;
  location: string | null;
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
  username?: string | null;
  title: "Mr" | "Mrs" | null;
  date_of_birth: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type CustomerAdminEvent = {
  id: string;
  action: string;
  summary: string;
  adminUsername: string;
  createdAt: string;
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

export type CreditOrderView = {
  id: string;
  packageName: string;
  creditsTotal: number;
  quantity: number;
  priceCents: number;
  status: string;
  createdAt: string;
};

export type CustomerBillingRow = SaleView & {
  customerId: string;
  customerName: string;
  customerEmail: string | null;
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

function isMissingCustomerProfileFields(message: string) {
  return /title|date_of_birth|address/.test(message) &&
    /does not exist|schema cache|could not find/i.test(message);
}

function withEmptyCustomerProfile<T extends Omit<Customer, "title" | "date_of_birth" | "address">>(customer: T): Customer {
  return { ...customer, title: null, date_of_birth: null, address: null };
}

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

const getCachedSettings = unstable_cache(async (): Promise<StudioSettings> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("studio_settings")
    .select("name, timezone, default_capacity")
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return data;
}, ["studio-settings"], { revalidate: 300, tags: ["studio:settings"] });

export function getSettings() {
  return getCachedSettings();
}

export async function listClassTypes(includeInactive = false) {
  const supabase = createAdminClient();
  let query = supabase
    .from("class_types")
    .select("id, name, description, duration_minutes, image_path, color, default_capacity, active")
    .order("name");
  if (!includeInactive) query = query.eq("active", true);
  return rows<ClassType>(query);
}

export async function getClassType(id: string) {
  const classes = await listClassTypes(true);
  return classes.find((classType) => classType.id === id) ?? null;
}

export type CoachAccount = {
  id: string;
  fullName: string;
  username: string;
  active: boolean;
  createdAt: string;
  assignedCourses: number;
};

export async function listCoaches() {
  const supabase = createAdminClient();
  const [coachResult, sessionResult] = await Promise.all([
    supabase.from("coaches").select("id, full_name, username, active, created_at").order("full_name"),
    supabase.from("sessions").select("coach_id").eq("status", "scheduled").not("coach_id", "is", null),
  ]);
  if (coachResult.error) throw new Error(coachResult.error.message);
  if (sessionResult.error) throw new Error(sessionResult.error.message);
  const counts = new Map<string, number>();
  for (const row of sessionResult.data ?? []) {
    if (!row.coach_id) continue;
    counts.set(row.coach_id, (counts.get(row.coach_id) ?? 0) + 1);
  }
  return (coachResult.data ?? []).map((coach) => ({
    id: coach.id,
    fullName: coach.full_name,
    username: coach.username,
    active: coach.active,
    createdAt: coach.created_at,
    assignedCourses: counts.get(coach.id) ?? 0,
  }));
}

const sessionSelectWithCoach = `
  id, class_type_id, title, description, image_path,
  starts_at, ends_at, capacity, credits_required, instructor, location, coach_id, status, held,
  class_types (name, description, image_path, duration_minutes, color),
  coaches (full_name)
`;

const sessionSelect = `
  id, class_type_id, title, description, image_path,
  starts_at, ends_at, capacity, credits_required, instructor, location, status, held,
  class_types (name, description, image_path, duration_minutes, color)
`;

const legacySessionSelect = `
  id, class_type_id, title, description, image_path,
  starts_at, ends_at, capacity, credits_required, status, held,
  class_types (name, description, image_path, duration_minutes, color)
`;

type SessionRow = {
  id: string;
  class_type_id: string;
  title: string | null;
  description: string | null;
  image_path: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  credits_required: number;
  instructor?: string | null;
  coach_id?: string | null;
  location?: string | null;
  status: string;
  held: boolean;
  coaches?: { full_name: string } | { full_name: string }[] | null;
  class_types:
    | {
        name: string;
        description: string | null;
        image_path: string | null;
        duration_minutes: number;
        color: string;
      }
    | {
        name: string;
        description: string | null;
        image_path: string | null;
        duration_minutes: number;
        color: string;
      }[]
    | null;
};

function mapSession(row: SessionRow): SessionView {
  const classType = one(row.class_types);
  return {
    id: row.id,
    classTypeId: row.class_type_id,
    classTypeName: classType?.name ?? "Class",
    title: row.title?.trim() || classType?.name || "Class",
    description: row.description ?? classType?.description ?? null,
    ownDescription: row.description,
    imagePath: row.image_path || classType?.image_path || null,
    classTypeColor: classType?.color ?? "#0f766e",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    creditsRequired: row.credits_required,
    coachId: row.coach_id ?? null,
    instructor: one(row.coaches)?.full_name ?? row.instructor ?? null,
    location: row.location ?? null,
    status: row.status,
    held: row.held,
    durationMinutes: classType?.duration_minutes ?? 0,
  };
}

async function sessionRows(
  buildQuery: (selection: string) => PromiseLike<{ data: unknown; error: QueryError | null }>,
) {
  let result = await buildQuery(sessionSelectWithCoach);
  if (result.error && /coach/i.test(result.error.message)) {
    result = await buildQuery(sessionSelect);
  }
  if (
    result.error &&
    (result.error.message.includes("sessions.instructor") || result.error.message.includes("sessions.location"))
  ) {
    result = await buildQuery(legacySessionSelect);
  }
  if (result.error) throw new Error(result.error.message);
  return ((result.data ?? []) as SessionRow[]).map(mapSession);
}

function typedSessionQuery(query: unknown) {
  return query as PromiseLike<{ data: SessionRow[] | null; error: QueryError | null }>;
}

export async function listSessionsBetween(from: string, to: string) {
  const supabase = createAdminClient();
  return sessionRows((selection) =>
    typedSessionQuery(supabase
      .from("sessions")
      .select(selection)
      .eq("status", "scheduled")
      .gte("starts_at", from)
      .lt("starts_at", to)
      .order("starts_at")),
  );
}

export async function listUpcoming(limit: number) {
  const supabase = createAdminClient();
  return sessionRows((selection) =>
    typedSessionQuery(supabase
      .from("sessions")
      .select(selection)
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(limit)),
  );
}

export async function listAllSessions() {
  const supabase = createAdminClient();
  const all: SessionView[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const page = await sessionRows((selection) =>
      typedSessionQuery(supabase
        .from("sessions")
        .select(selection)
        .order("starts_at")
        .range(offset, offset + pageSize - 1)),
    );
    all.push(...page);
    if (page.length < pageSize) return all;
  }
}

export async function getSession(id: string) {
  const supabase = createAdminClient();
  const result = await sessionRows((selection) =>
    typedSessionQuery(supabase.from("sessions").select(selection).eq("id", id)),
  );
  return result[0] ?? null;
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

const getCachedPackages = unstable_cache(async (includeInactive: boolean) => {
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

  return data.flatMap((row) => row.id === STUDIO_CREDIT_PACKAGE_ID ? [] : [{
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
  }]) satisfies PackageView[];
}, ["studio-packages"], { revalidate: 120, tags: ["studio:packages"] });

export function listPackages(includeInactive = false) {
  return getCachedPackages(includeInactive);
}

export async function getPackage(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("packages")
    .select(
      "id, name, description, credit_count, price_cents, validity_days, applies_to_all, active, package_class_types(class_type_id, class_types(name))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.id === STUDIO_CREDIT_PACKAGE_ID) return null;
  const row = data as {
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
  };
  return {
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
  } satisfies PackageView;
}

const getCachedDiscounts = unstable_cache(async (includeInactive: boolean) => {
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
}, ["studio-discounts"], { revalidate: 120, tags: ["studio:discounts"] });

export function listDiscounts(includeInactive = false) {
  return getCachedDiscounts(includeInactive);
}

export type DiscountPlan = {
  id: string;
  name: string;
  percent: number;
  active: boolean;
};

export type GrantedDiscount = DiscountPlan & {
  customerId: string;
};

function isMissingDiscountSchema(message: string) {
  return /discount_plans|customer_discounts/.test(message) &&
    /does not exist|schema cache|could not find/i.test(message);
}

const getCachedDiscountPlans = unstable_cache(async (includeInactive: boolean) => {
  const supabase = createAdminClient();
  let query = supabase.from("discount_plans").select("id, name, percent, active").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const result = await query;
  if (result.error) {
    if (isMissingDiscountSchema(result.error.message)) return [] satisfies DiscountPlan[];
    throw new Error(result.error.message);
  }
  return (result.data ?? []) satisfies DiscountPlan[];
}, ["studio-discount-plans"], { revalidate: 120, tags: ["studio:discount-plans"] });

export function listDiscountPlans(includeInactive = false) {
  return getCachedDiscountPlans(includeInactive);
}

export async function listGrantedDiscounts() {
  const supabase = createAdminClient();
  const result = await supabase
    .from("customer_discounts")
    .select("customer_id, discount_plans(id, name, percent, active)");
  if (result.error) {
    if (isMissingDiscountSchema(result.error.message)) return [] satisfies GrantedDiscount[];
    throw new Error(result.error.message);
  }
  return (result.data ?? []).flatMap((row) => {
    const plan = one(row.discount_plans as DiscountPlan | DiscountPlan[] | null);
    if (!plan) return [];
    return [{ customerId: row.customer_id as string, ...plan }];
  });
}

export async function getCustomerDiscount(customerId: string) {
  const grants = await listGrantedDiscounts();
  return grants.find((grant) => grant.customerId === customerId) ?? null;
}

export async function listCustomers(search = "") {
  const supabase = createAdminClient();
  const term = search.trim();
  const safe = term.replace(/[%_,]/g, "");
  const pageSize = 500;
  const customers: Customer[] = [];

  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from("customers")
      .select("id, full_name, title, date_of_birth, address, email, phone, notes, created_at")
      .order("full_name")
      .order("id")
      .range(offset, offset + pageSize - 1);
    if (safe) {
      query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
    }
    const result = await query;
    if (result.error) {
      if (!isMissingCustomerProfileFields(result.error.message)) throw new Error(result.error.message);
      return listCustomersWithoutProfileFields(supabase, safe, pageSize);
    }
    const page = (result.data ?? []) as Customer[];
    customers.push(...page);
    if (page.length < pageSize) break;
  }
  return withCustomerUsernames(customers);
}

function withCustomerUsernames(customers: Customer[]) {
  return customers.map((customer) => ({
    ...customer,
    username: customer.email?.split("@")[0] ?? null,
  }));
}

async function listCustomersWithoutProfileFields(
  supabase: ReturnType<typeof createAdminClient>,
  safe: string,
  pageSize: number,
) {
  const customers: Customer[] = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from("customers")
      .select("id, full_name, email, phone, notes, created_at")
      .order("full_name")
      .order("id")
      .range(offset, offset + pageSize - 1);
    if (safe) {
      query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
    }
    const page = await rows<Omit<Customer, "title" | "date_of_birth" | "address">>(query);
    customers.push(...page.map(withEmptyCustomerProfile));
    if (page.length < pageSize) break;
  }
  return withCustomerUsernames(customers);
}

export async function customerCreditBalances(customerIds: string[]) {
  if (customerIds.length === 0) return new Map<string, number>();

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  type CreditPackRow = {
    customer_id: string;
    credits_total: number;
    credits_used: number;
  };
  const balances = new Map<string, number>();
  for (let index = 0; index < customerIds.length; index += 100) {
    const ids = customerIds.slice(index, index + 100);
    for (let offset = 0; ; offset += 500) {
      const page = await rows<CreditPackRow>(
        supabase
          .from("customer_packages")
          .select("id, customer_id, credits_total, credits_used")
          .in("customer_id", ids)
          .eq("status", "active")
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order("id")
          .range(offset, offset + 499),
      );
      for (const pack of page) {
        balances.set(
          pack.customer_id,
          (balances.get(pack.customer_id) ?? 0) + Math.max(pack.credits_total - pack.credits_used, 0),
        );
      }
      if (page.length < 500) break;
    }
  }
  return balances;
}

export async function customerCreditTotals(customerIds: string[]) {
  const totals = new Map<string, { purchased: number; consumed: number }>();
  if (customerIds.length === 0) return totals;

  const supabase = createAdminClient();
  type CreditPackRow = {
    customer_id: string;
    credits_total: number;
    credits_used: number;
  };
  for (let index = 0; index < customerIds.length; index += 100) {
    const ids = customerIds.slice(index, index + 100);
    for (let offset = 0; ; offset += 500) {
      const page = await rows<CreditPackRow>(
        supabase
          .from("customer_packages")
          .select("id, customer_id, credits_total, credits_used")
          .in("customer_id", ids)
          .order("id")
          .range(offset, offset + 499),
      );
      for (const pack of page) {
        const total = totals.get(pack.customer_id) ?? { purchased: 0, consumed: 0 };
        total.purchased += pack.credits_total;
        total.consumed += pack.credits_used;
        totals.set(pack.customer_id, total);
      }
      if (page.length < 500) break;
    }
  }
  return totals;
}

export async function getCustomer(id: string) {
  const supabase = createAdminClient();
  const result = await supabase
    .from("customers")
    .select("id, full_name, title, date_of_birth, address, email, phone, notes, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!result.error) return result.data as Customer | null;
  if (!isMissingCustomerProfileFields(result.error.message)) throw new Error(result.error.message);

  const legacyResult = await supabase
    .from("customers")
    .select("id, full_name, email, phone, notes, created_at")
    .eq("id", id)
    .maybeSingle();
  if (legacyResult.error) throw new Error(legacyResult.error.message);
  return legacyResult.data ? withEmptyCustomerProfile(legacyResult.data) : null;
}

export async function customerAdminEvents(customerId: string) {
  const supabase = createAdminClient();
  const result = await supabase
    .from("customer_admin_events")
    .select("id, action, summary, admin_username, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (result.error) {
    if (/customer_admin_events/i.test(result.error.message) && /does not exist|schema cache|could not find/i.test(result.error.message)) {
      return [];
    }
    throw new Error(result.error.message);
  }
  return (result.data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    summary: row.summary,
    adminUsername: row.admin_username,
    createdAt: row.created_at,
  })) satisfies CustomerAdminEvent[];
}

export async function getCustomerByEmail(email: string) {
  const supabase = createAdminClient();
  const result = await supabase
    .from("customers")
    .select("id, full_name, title, date_of_birth, address, email, phone, notes, created_at")
    .ilike("email", email)
    .maybeSingle();
  if (!result.error) return result.data as Customer | null;

  if (!isMissingCustomerProfileFields(result.error.message)) throw new Error(result.error.message);

  const legacyResult = await supabase
    .from("customers")
    .select("id, full_name, email, phone, notes, created_at")
    .ilike("email", email)
    .maybeSingle();
  if (legacyResult.error) throw new Error(legacyResult.error.message);
  return legacyResult.data ? withEmptyCustomerProfile(legacyResult.data) : null;
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
      .neq("package_id", STUDIO_CREDIT_PACKAGE_ID)
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

export async function customerCreditOrders(customerId: string) {
  const supabase = createAdminClient();
  type CreditOrder = {
    id: string;
    package_name: string;
    credits_total: number;
    quantity: number;
    price_cents: number;
    status: string;
    created_at: string;
  };
  const data = await rows<CreditOrder>(
    supabase.from("credit_orders")
      .select("id, package_name, credits_total, quantity, price_cents, status, created_at")
      .eq("customer_id", customerId)
      .neq("status", "paid")
      .order("created_at", { ascending: false }),
  );
  return data.map((row) => ({
    id: row.id,
    packageName: row.package_name,
    creditsTotal: row.credits_total,
    quantity: row.quantity,
    priceCents: row.price_cents,
    status: row.status,
    createdAt: row.created_at,
  })) satisfies CreditOrderView[];
}

export async function pendingCreditOrders() {
  const supabase = createAdminClient();
  type CreditOrder = {
    id: string;
    customer_id: string;
    package_name: string;
    credits_total: number;
    quantity: number;
    price_cents: number;
    status: string;
    created_at: string;
    customers: { full_name: string; email: string | null } | { full_name: string; email: string | null }[] | null;
  };
  const data = await rows<CreditOrder>(
    supabase.from("credit_orders")
      .select("id, customer_id, package_name, credits_total, quantity, price_cents, status, created_at, customers(full_name, email)")
      .eq("status", "pending_payment")
      .order("created_at", { ascending: true }),
  );
  return data.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: one(row.customers)?.full_name ?? "Customer",
    customerEmail: one(row.customers)?.email ?? null,
    packageName: row.package_name,
    creditsTotal: row.credits_total,
    quantity: row.quantity,
    priceCents: row.price_cents,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function confirmedCreditOrders() {
  const supabase = createAdminClient();
  type CreditOrder = {
    id: string;
    customer_id: string;
    package_name: string;
    credits_total: number;
    quantity: number;
    price_cents: number;
    paid_at: string;
    customers: { full_name: string; email: string | null } | { full_name: string; email: string | null }[] | null;
  };
  const data = await rows<CreditOrder>(
    supabase.from("credit_orders")
      .select("id, customer_id, package_name, credits_total, quantity, price_cents, paid_at, customers(full_name, email)")
      .eq("status", "paid")
      .order("paid_at", { ascending: false }),
  );
  return data.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: one(row.customers)?.full_name ?? "Customer",
    customerEmail: one(row.customers)?.email ?? null,
    packageName: row.package_name,
    creditsTotal: row.credits_total,
    quantity: row.quantity,
    priceCents: row.price_cents,
    confirmedAt: row.paid_at,
  }));
}

export async function customerBillingHistory() {
  const supabase = createAdminClient();
  type BillingRecord = {
    id: string;
    customer_id: string;
    credits_total: number;
    credits_used: number;
    price_cents: number;
    discount_cents: number;
    final_price_cents: number;
    expires_at: string | null;
    status: string;
    purchased_at: string;
    packages: { name: string } | { name: string }[] | null;
    customers: { full_name: string; email: string | null } | { full_name: string; email: string | null }[] | null;
  };
  const records: BillingRecord[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await rows<BillingRecord>(
      supabase
        .from("customer_packages")
        .select("id, customer_id, credits_total, credits_used, price_cents, discount_cents, final_price_cents, expires_at, status, purchased_at, packages(name), customers(full_name, email)")
        .neq("package_id", STUDIO_CREDIT_PACKAGE_ID)
        .order("purchased_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + 499),
    );
    records.push(...page);
    if (page.length < 500) break;
  }
  return records.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: one(row.customers)?.full_name ?? "Customer",
    customerEmail: one(row.customers)?.email ?? null,
    packageName: one(row.packages)?.name ?? "Package",
    creditsTotal: row.credits_total,
    creditsUsed: row.credits_used,
    priceCents: row.price_cents,
    discountCents: row.discount_cents,
    finalPriceCents: row.final_price_cents,
    expiresAt: row.expires_at,
    status: row.status,
    purchasedAt: row.purchased_at,
  })) satisfies CustomerBillingRow[];
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
      canCancel: Boolean(
        row.status === "booked" &&
        session?.status === "scheduled" &&
        session.starts_at &&
        new Date(session.starts_at).getTime() > Date.now(),
      ),
    };
  });
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

export async function rostersForSessions(sessionIds: string[]) {
  if (sessionIds.length === 0) return [];
  const supabase = createAdminClient();
  type ParticipantRow = {
    id: string;
    session_id: string;
    status: string;
    status_set_by_username: string | null;
    status_set_at: string | null;
    customers: { full_name: string; email: string | null } | { full_name: string; email: string | null }[] | null;
  };
  const data: ParticipantRow[] = [];
  for (let start = 0; start < sessionIds.length; start += 200) {
    const batch = sessionIds.slice(start, start + 200);
    for (let offset = 0; ; offset += 500) {
      const page = await rows<ParticipantRow>(
        supabase
          .from("bookings")
          .select("id, session_id, status, status_set_by_username, status_set_at, customers(full_name, email)")
          .in("session_id", batch)
          .neq("status", "cancelled")
          .order("booked_at")
          .range(offset, offset + 499),
      );
      data.push(...page);
      if (page.length < 500) break;
    }
  }
  return data.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    status: row.status,
    customerName: one(row.customers)?.full_name ?? "Customer",
    customerEmail: one(row.customers)?.email ?? "",
    statusSetBy: row.status === "booked" ? null : row.status_set_by_username,
    statusSetAt: row.status === "booked" ? null : row.status_set_at,
  }));
}

export async function eligiblePacks(classTypeId: string, creditsRequired = 1) {
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
