import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^(?:"([^"]*)"|'([^']*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
  }
}

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!serviceKey) {
  throw new Error("Set SUPABASE_SECRET_KEY before running the local user seed.");
}

const parsedUrl = new URL(supabaseUrl);
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsedUrl.hostname)) {
  throw new Error("The local user seed only runs against a localhost Supabase URL.");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = "AquaDemo2026!";
const packageId = "b2222222-2222-4222-8222-822222222225";
const members = [
  { name: "Avery Chen", email: "user1@hydrofit.demo", phone: "+65 8123 4001" },
  { name: "Jordan Lee", email: "user2@hydrofit.demo", phone: "+65 8123 4002" },
  { name: "Mia Tran", email: "user3@hydrofit.demo", phone: "+65 8123 4003" },
  { name: "Noah Nguyen", email: "user4@hydrofit.demo", phone: "+65 8123 4004" },
];

function assertOk(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function ensureAuthUser(member) {
  const users = assertOk(await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }));
  const existing = users.users.find((user) => user.email?.toLowerCase() === member.email);
  if (existing) {
    return assertOk(await supabase.auth.admin.updateUserById(existing.id, {
      email: member.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: member.name },
    })).user;
  }

  return assertOk(await supabase.auth.admin.createUser({
    email: member.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: member.name },
  })).user;
}

async function removeOldMaiDemoIdentity() {
  const users = assertOk(await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }));
  const oldDemoUser = users.users.find((user) => user.email?.toLowerCase() === "member@hydrofit.demo");
  if (oldDemoUser) assertOk(await supabase.auth.admin.deleteUser(oldDemoUser.id));
}

async function ensureCustomer(member, authUserId) {
  const existing = assertOk(await supabase
    .from("customers")
    .select("id")
    .eq("email", member.email)
    .maybeSingle());

  const record = {
    full_name: member.name,
    email: member.email,
    phone: member.phone,
    notes: "Local sample member.",
    auth_user_id: authUserId,
  };

  if (existing) {
    return assertOk(await supabase
      .from("customers")
      .update(record)
      .eq("id", existing.id)
      .select("id")
      .single()).id;
  }

  return assertOk(await supabase
    .from("customers")
    .insert(record)
    .select("id")
    .single()).id;
}

const classTypes = assertOk(await supabase
  .from("class_types")
  .select("id")
  .ilike("name", "Aqua Fit")
  .limit(1));
if (!classTypes[0]) throw new Error("The Aqua Fit class type is missing; run `supabase db reset` first.");

await removeOldMaiDemoIdentity();

const now = new Date();
const sampleSessions = assertOk(await supabase
  .from("sessions")
  .select("id")
  .eq("class_type_id", classTypes[0].id)
  .eq("status", "scheduled")
  .gt("starts_at", now.toISOString())
  .order("starts_at")
  .limit(3));
if (sampleSessions.length < 3) throw new Error("At least three upcoming Aqua Fit classes are needed to seed local member bookings.");

const purchasedAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
const expiresAt = new Date(now.getTime() + 88 * 24 * 60 * 60 * 1000).toISOString();
const packageRows = [];
const bookingRows = [];
const purchaseLedgerRows = [];
const bookingLedgerRows = [];
const orderRows = [];
const extraBookingRows = [];
const extraBookingLedgerRows = [];
const pendingOrderRows = [];

for (const [index, member] of members.entries()) {
  const authUser = await ensureAuthUser(member);
  const customerId = await ensureCustomer(member, authUser.id);
  const customerPackageId = `f6666666-6666-4666-8666-66666666660${index + 1}`;
  const sessionId = sampleSessions[0].id;
  const bookingId = `a8888888-8888-4888-8888-88888888880${index + 1}`;
  const orderId = `c7777777-7777-4777-8777-77777777770${index + 1}`;
  const purchasedLedgerId = `b9999999-9999-4999-8999-99999999990${index + 1}`;
  const bookingLedgerId = `b9999999-9999-4999-8999-99999999991${index + 1}`;

  packageRows.push({
    id: customerPackageId,
    customer_id: customerId,
    package_id: packageId,
    credits_total: 5,
    credits_used: 3,
    price_cents: 10000,
    discount_cents: 0,
    final_price_cents: 10000,
    purchased_at: purchasedAt,
    expires_at: expiresAt,
    status: "active",
  });
  bookingRows.push({
    id: bookingId,
    session_id: sessionId,
    customer_id: customerId,
    customer_package_id: customerPackageId,
    credits_used: 1,
    status: "booked",
    booked_at: purchasedAt,
  });
  purchaseLedgerRows.push({
    id: purchasedLedgerId,
    customer_package_id: customerPackageId,
    delta: 5,
    reason: "purchase",
    created_at: purchasedAt,
  });
  bookingLedgerRows.push({
    id: bookingLedgerId,
    customer_package_id: customerPackageId,
    booking_id: bookingId,
    delta: -1,
    reason: "booking",
    created_at: purchasedAt,
  });
  orderRows.push({
    id: orderId,
    customer_id: customerId,
    package_id: packageId,
    package_name: "5 class pack",
    quantity: 1,
    credits_total: 5,
    price_cents: 10000,
    validity_days: 90,
    status: "paid",
    customer_package_id: customerPackageId,
    created_at: purchasedAt,
    paid_at: purchasedAt,
  });

  pendingOrderRows.push({
    id: `c7777777-7777-4777-8777-77777777${String(7100 + index + 1).padStart(4, "0")}`,
    customer_id: customerId,
    package_id: packageId,
    package_name: "5 class pack",
    quantity: 1,
    credits_total: 5,
    price_cents: 10000,
    validity_days: 90,
    status: "pending_payment",
    created_at: now.toISOString(),
  });

  for (let classIndex = 0; classIndex < 2; classIndex += 1) {
    const sequence = index * 2 + classIndex + 1;
    const extraSessionId = sampleSessions[classIndex + 1].id;
    const extraBookingId = `a8888888-8888-4888-8888-88888888${String(8200 + sequence).padStart(4, "0")}`;
    const extraLedgerId = `b9999999-9999-4999-8999-99999999${String(9200 + sequence).padStart(4, "0")}`;
    extraBookingRows.push({
      id: extraBookingId,
      session_id: extraSessionId,
      customer_id: customerId,
      customer_package_id: customerPackageId,
      credits_used: 1,
      status: "booked",
      booked_at: now.toISOString(),
    });
    extraBookingLedgerRows.push({
      id: extraLedgerId,
      customer_package_id: customerPackageId,
      booking_id: extraBookingId,
      delta: -1,
      reason: "booking",
      created_at: now.toISOString(),
    });
  }

  console.log(`Prepared ${member.email}.`);
}

assertOk(await supabase.from("customer_packages").upsert(packageRows, { onConflict: "id" }));
assertOk(await supabase.from("bookings").upsert(bookingRows, { onConflict: "id" }));
assertOk(await supabase.from("bookings").upsert(extraBookingRows, { onConflict: "id" }));
assertOk(await supabase.from("credit_ledger").upsert(purchaseLedgerRows, { onConflict: "id" }));
assertOk(await supabase.from("credit_ledger").upsert(bookingLedgerRows, { onConflict: "id" }));
assertOk(await supabase.from("credit_ledger").upsert(extraBookingLedgerRows, { onConflict: "id" }));
assertOk(await supabase.from("credit_orders").upsert(orderRows, { onConflict: "id" }));
assertOk(await supabase.from("credit_orders").upsert(pendingOrderRows, { onConflict: "id" }));

console.log(`Seeded ${members.length} local Supabase Auth users, ${pendingOrderRows.length} pending orders, and ${extraBookingRows.length} extra bookings. Shared password: ${password}`);
