"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { zonedTimeToUtc, addDays } from "@/lib/dates";
import {
  checked,
  dateField,
  dollarsToCents,
  idList,
  intField,
  optionalId,
  optionalInt,
  optionalText,
  requiredId,
  requiredText,
  timeField,
} from "@/lib/form";
import { getSettings } from "@/lib/queries";
import { rpc } from "@/lib/rpc";
import { removeImage, saveImage } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";

function redirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

function messageOf(error: unknown) {
  let message = "Something went wrong";
  if (error instanceof Error) message = error.message;
  else if (error && typeof error === "object" && "message" in error) {
    const value = (error as { message?: unknown }).message;
    if (typeof value === "string") message = value;
  }
  if (message.includes("customers_email_uidx")) return "A customer with that email already exists";
  if (message.includes("discounts_code_uidx")) return "That discount code is already in use";
  return message.replace(/^(ERROR:\s*)+/i, "").replace(/^P\d+:\s*/, "").slice(0, 280);
}

function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(messageOf(error))}`);
}

function done(path: string, notice: string): never {
  revalidatePath("/", "layout");
  redirect(`${path}?notice=${encodeURIComponent(notice)}`);
}

async function run(path: string, work: () => Promise<void>) {
  try {
    await work();
  } catch (error) {
    if (redirectError(error)) throw error;
    fail(path, error);
  }
}

async function syncClassSchedules(classTypeId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("schedules").select("id").eq("class_type_id", classTypeId);
  if (error) throw new Error(error.message);
  for (const schedule of data ?? []) {
    await rpc("sync_schedule", { p_schedule_id: schedule.id, p_extend_only: false });
  }
}

function emailOrNull(formData: FormData) {
  const email = optionalText(formData, "email");
  return email ? email.toLowerCase() : null;
}

async function applyPackageClasses(packageId: string, formData: FormData) {
  const classTypeIds = idList(formData, "class_type_ids");
  await rpc("save_package_classes", {
    p_package_id: packageId,
    p_class_type_ids: classTypeIds,
    p_applies_to_all: classTypeIds.length === 0,
  });
}

async function applyDiscountPackages(discountId: string, formData: FormData) {
  const packageIds = idList(formData, "package_ids");
  await rpc("save_discount_packages", {
    p_discount_id: discountId,
    p_package_ids: packageIds,
    p_applies_to_all: packageIds.length === 0,
  });
}

async function discountWindow(formData: FormData) {
  const settings = await getSettings();
  const start = optionalText(formData, "starts_on");
  const end = optionalText(formData, "ends_on");
  if (start && !/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error("Start date must be a valid date");
  if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) throw new Error("End date must be a valid date");
  if (start && end && end < start) throw new Error("End date must be on or after the start date");
  return {
    starts_at: start ? zonedTimeToUtc(start, "00:00", settings.timezone).toISOString() : null,
    ends_at: end ? zonedTimeToUtc(addDays(end, 1), "00:00", settings.timezone).toISOString() : null,
  };
}

function discountAmount(formData: FormData) {
  const kind = requiredText(formData, "kind", "Discount type");
  if (kind !== "percent" && kind !== "fixed") throw new Error("Discount type is not valid");
  if (kind === "percent") {
    return { kind, amount: intField(formData, "amount", "Amount", 1, 100) };
  }
  const cents = dollarsToCents(formData, "amount", "Amount");
  if (cents < 1) throw new Error("Amount must be at least $0.01");
  return { kind, amount: cents };
}

export async function createClass(formData: FormData) {
  const path = "/studio/classes";
  await run(path, async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("class_types")
      .insert({
        name: requiredText(formData, "name", "Name"),
        description: optionalText(formData, "description"),
        duration_minutes: intField(formData, "duration_minutes", "Duration", 15, 240),
        default_capacity: intField(formData, "default_capacity", "Capacity", 1, 100),
        active: checked(formData, "active"),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const image = await saveImage(formData.get("image"), data.id);
    if (image) {
      const updated = await supabase.from("class_types").update({ image_path: image }).eq("id", data.id);
      if (updated.error) throw new Error(updated.error.message);
    }
    done(path, "Class saved");
  });
}

export async function updateClass(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = `/studio/classes/${id}`;
  await run(path, async () => {
    const classId = requiredId(formData, "id", "Class");
    const supabase = createAdminClient();
    const existing = await supabase.from("class_types").select("image_path").eq("id", classId).single();
    if (existing.error) throw new Error(existing.error.message);
    const image = await saveImage(formData.get("image"), classId);
    const { error } = await supabase
      .from("class_types")
      .update({
        name: requiredText(formData, "name", "Name"),
        description: optionalText(formData, "description"),
        duration_minutes: intField(formData, "duration_minutes", "Duration", 15, 240),
        default_capacity: intField(formData, "default_capacity", "Capacity", 1, 100),
        active: checked(formData, "active"),
        ...(image ? { image_path: image } : {}),
      })
      .eq("id", classId);
    if (error) throw new Error(error.message);
    if (image) await removeImage(existing.data.image_path);
    await syncClassSchedules(classId);
    done(path, "Class updated");
  });
}

export async function createSchedule(formData: FormData) {
  const path = "/studio/schedules";
  await run(path, async () => {
    const start = timeField(formData, "start_time", "Start");
    const end = timeField(formData, "end_time", "End");
    if (end <= start) throw new Error("End time must be after the start time");
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("schedules")
      .insert({
        class_type_id: requiredId(formData, "class_type_id", "Class"),
        weekday: intField(formData, "weekday", "Day", 0, 6),
        start_time: start,
        end_time: end,
        capacity: optionalInt(formData, "capacity", "Capacity", 1, 100),
        active: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await rpc("sync_schedule", { p_schedule_id: data.id, p_extend_only: false });
    done(path, "Weekly time saved. Upcoming classes are on the schedule.");
  });
}

export async function updateSchedule(formData: FormData) {
  const path = "/studio/schedules";
  await run(path, async () => {
    const id = requiredId(formData, "id", "Weekly time");
    const start = timeField(formData, "start_time", "Start");
    const end = timeField(formData, "end_time", "End");
    if (end <= start) throw new Error("End time must be after the start time");
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("schedules")
      .update({
        weekday: intField(formData, "weekday", "Day", 0, 6),
        start_time: start,
        end_time: end,
        capacity: optionalInt(formData, "capacity", "Capacity", 1, 100),
        active: checked(formData, "active"),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await rpc("sync_schedule", { p_schedule_id: id, p_extend_only: false });
    done(path, "Weekly time updated");
  });
}

export async function createEvent(formData: FormData) {
  const path = "/studio/events";
  await run(path, async () => {
    const id = await rpc<string>("create_event", {
      p_class_type_id: requiredId(formData, "class_type_id", "Class"),
      p_title: requiredText(formData, "title", "Title"),
      p_description: optionalText(formData, "description") ?? "",
      p_date: dateField(formData, "date", "Date"),
      p_start: timeField(formData, "start_time", "Start"),
      p_end: timeField(formData, "end_time", "End"),
      p_capacity: intField(formData, "capacity", "Capacity", 1, 100),
      p_credits: intField(formData, "credits_required", "Credits", 1, 20),
    });
    const image = await saveImage(formData.get("image"), id);
    if (image) {
      const supabase = createAdminClient();
      const updated = await supabase.from("sessions").update({ image_path: image }).eq("id", id);
      if (updated.error) throw new Error(updated.error.message);
    }
    done(`/studio/sessions/${id}`, "Event saved");
  });
}

export async function updateEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = `/studio/sessions/${id}`;
  await run(path, async () => {
    const sessionId = requiredId(formData, "id", "Event");
    await rpc("update_event", {
      p_id: sessionId,
      p_class_type_id: requiredId(formData, "class_type_id", "Class"),
      p_title: requiredText(formData, "title", "Title"),
      p_description: optionalText(formData, "description") ?? "",
      p_date: dateField(formData, "date", "Date"),
      p_start: timeField(formData, "start_time", "Start"),
      p_end: timeField(formData, "end_time", "End"),
      p_capacity: intField(formData, "capacity", "Capacity", 1, 100),
      p_credits: intField(formData, "credits_required", "Credits", 1, 20),
    });
    const image = await saveImage(formData.get("image"), sessionId);
    if (image) {
      const supabase = createAdminClient();
      const existing = await supabase.from("sessions").select("image_path").eq("id", sessionId).single();
      if (existing.error) throw new Error(existing.error.message);
      const updated = await supabase.from("sessions").update({ image_path: image }).eq("id", sessionId);
      if (updated.error) throw new Error(updated.error.message);
      await removeImage(existing.data.image_path);
    }
    done(path, "Event updated");
  });
}

export async function setCapacity(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = `/studio/sessions/${id}`;
  await run(path, async () => {
    await rpc("set_session_capacity", {
      p_session_id: requiredId(formData, "id", "Session"),
      p_capacity: intField(formData, "capacity", "Capacity", 1, 100),
    });
    done(path, "Capacity updated for this date");
  });
}

export async function cancelSession(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = `/studio/sessions/${id}`;
  await run(path, async () => {
    await rpc("cancel_session", { p_session_id: requiredId(formData, "id", "Session") });
    done(path, "This date is cancelled and credits were returned");
  });
}

export async function createCustomer(formData: FormData) {
  const path = "/studio/customers";
  await run(path, async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        full_name: requiredText(formData, "full_name", "Name"),
        email: emailOrNull(formData),
        phone: optionalText(formData, "phone"),
        notes: optionalText(formData, "notes"),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    done(`/studio/customers/${data.id}`, "Customer added");
  });
}

export async function updateCustomer(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = `/studio/customers/${id}`;
  await run(path, async () => {
    const customerId = requiredId(formData, "id", "Customer");
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("customers")
      .update({
        full_name: requiredText(formData, "full_name", "Name"),
        email: emailOrNull(formData),
        phone: optionalText(formData, "phone"),
        notes: optionalText(formData, "notes"),
      })
      .eq("id", customerId);
    if (error) throw new Error(error.message);
    done(path, "Customer updated");
  });
}

export async function createPackage(formData: FormData) {
  const path = "/studio/packages";
  await run(path, async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("packages")
      .insert({
        name: requiredText(formData, "name", "Name"),
        description: optionalText(formData, "description"),
        credit_count: intField(formData, "credit_count", "Credits", 1, 200),
        price_cents: dollarsToCents(formData, "price", "Price"),
        validity_days: optionalInt(formData, "validity_days", "Validity", 1, 3650),
        active: checked(formData, "active"),
        applies_to_all: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await applyPackageClasses(data.id, formData);
    done(path, "Package saved");
  });
}

export async function updatePackage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = `/studio/packages/${id}`;
  await run(path, async () => {
    const packageId = requiredId(formData, "id", "Package");
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("packages")
      .update({
        name: requiredText(formData, "name", "Name"),
        description: optionalText(formData, "description"),
        credit_count: intField(formData, "credit_count", "Credits", 1, 200),
        price_cents: dollarsToCents(formData, "price", "Price"),
        validity_days: optionalInt(formData, "validity_days", "Validity", 1, 3650),
        active: checked(formData, "active"),
      })
      .eq("id", packageId);
    if (error) throw new Error(error.message);
    await applyPackageClasses(packageId, formData);
    done(path, "Package updated. Sales already recorded keep their original credits and price.");
  });
}

export async function createDiscount(formData: FormData) {
  const path = "/studio/discounts";
  await run(path, async () => {
    const window = await discountWindow(formData);
    const amount = discountAmount(formData);
    const code = optionalText(formData, "code")?.toUpperCase() ?? null;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("discounts")
      .insert({
        name: requiredText(formData, "name", "Name"),
        code,
        kind: amount.kind,
        amount: amount.amount,
        starts_at: window.starts_at,
        ends_at: window.ends_at,
        max_redemptions: optionalInt(formData, "max_redemptions", "Redemption cap", 1, 100000),
        active: checked(formData, "active"),
        applies_to_all: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await applyDiscountPackages(data.id, formData);
    done(path, "Discount saved");
  });
}

export async function updateDiscount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = `/studio/discounts/${id}`;
  await run(path, async () => {
    const discountId = requiredId(formData, "id", "Discount");
    const window = await discountWindow(formData);
    const amount = discountAmount(formData);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("discounts")
      .update({
        name: requiredText(formData, "name", "Name"),
        code: optionalText(formData, "code")?.toUpperCase() ?? null,
        kind: amount.kind,
        amount: amount.amount,
        starts_at: window.starts_at,
        ends_at: window.ends_at,
        max_redemptions: optionalInt(formData, "max_redemptions", "Redemption cap", 1, 100000),
        active: checked(formData, "active"),
      })
      .eq("id", discountId);
    if (error) throw new Error(error.message);
    await applyDiscountPackages(discountId, formData);
    done(path, "Discount updated");
  });
}

export async function recordSale(formData: FormData) {
  const customerId = String(formData.get("customer_id") ?? "");
  const path = `/studio/customers/${customerId}`;
  await run(path, async () => {
    const id = requiredId(formData, "customer_id", "Customer");
    const packageId = requiredId(formData, "package_id", "Package");
    let discountId = optionalId(formData, "discount_id");
    const code = optionalText(formData, "code");
    if (code) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("discounts")
        .select("id")
        .ilike("code", code)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Discount code is not valid");
      discountId = data.id;
    }
    await rpc("record_sale", {
      p_customer_id: id,
      p_package_id: packageId,
      p_discount_id: discountId,
    });
    done(path, "Sale recorded. Credits are ready to book.");
  });
}

export async function bookCustomer(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const path = `/studio/sessions/${sessionId}`;
  await run(path, async () => {
    const id = requiredId(formData, "session_id", "Session");
    const packageId = requiredId(formData, "customer_package_id", "Package");
    const supabase = createAdminClient();
    const pack = await supabase
      .from("customer_packages")
      .select("customer_id")
      .eq("id", packageId)
      .single();
    if (pack.error) throw new Error(pack.error.message);
    await rpc("book_session", {
      p_session_id: id,
      p_customer_id: pack.data.customer_id,
      p_customer_package_id: packageId,
    });
    done(path, "Booked. Credits were taken from the package.");
  });
}

export async function cancelBooking(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const path = `/studio/sessions/${sessionId}`;
  await run(path, async () => {
    await rpc("cancel_booking", { p_booking_id: requiredId(formData, "booking_id", "Booking") });
    done(path, "Booking cancelled and the credit was returned");
  });
}

export async function setBookingStatus(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const path = `/studio/sessions/${sessionId}`;
  await run(path, async () => {
    await rpc("set_booking_status", {
      p_booking_id: requiredId(formData, "booking_id", "Booking"),
      p_status: requiredText(formData, "status", "Status"),
    });
    done(path, "Attendance updated");
  });
}
