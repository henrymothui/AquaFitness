"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { zonedTimeToUtc } from "@/lib/dates";
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
import { customerAdminEvents, getSettings } from "@/lib/queries";
import { classColorField } from "@/lib/class-colors";
import { rpc } from "@/lib/rpc";
import { removeImage, saveImage } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAccount, getCurrentRole, type AppRole } from "@/lib/auth";

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
  return message.replace(/^(ERROR:\s*)+/i, "").replace(/^P\d+:\s*/, "").slice(0, 280);
}

function safeReturnPath(formData: FormData, fallback: string) {
  const requested = String(formData.get("return_to") ?? "");
  return /^\/studio\/check-in(?:\?course=[0-9a-f-]{36})?$/i.test(requested) || /^\/studio\/(?:courses\/schedule|directory)\/[0-9a-f-]{36}$/i.test(requested) || requested === "/studio/coach" || requested === "/studio/directory" || requested === "/studio/courses/course-type" || /^\/studio\/courses\/(?:schedule|calendar)(?:\?month=\d{4}-\d{2}(?:&course_type=[\da-f-]+)?)?$/.test(requested)
    || requested === "/studio/pricing/package"
    || requested === "/studio/pricing/discount"
    || /^\/studio\/pricing\/package\/[0-9a-f-]{36}$/i.test(requested)
    ? requested
    : fallback;
}

function withMessage(path: string, key: string, message: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(message)}`;
}

function fail(path: string, error: unknown): never {
  redirect(withMessage(path, "error", messageOf(error)));
}

function done(path: string, notice: string): never {
  const route = path.split("?", 1)[0];
  if (route.startsWith("/studio/courses/course-type")) {
    revalidateTag("studio:class-types", { expire: 0 });
    revalidateTag("studio:packages", { expire: 0 });
  }
  if (path.startsWith("/studio/pricing/package")) revalidateTag("studio:packages", { expire: 0 });
  if (path.startsWith("/studio/pricing/discount")) revalidateTag("studio:discount-plans", { expire: 0 });
  revalidatePath(route);
  redirect(withMessage(path, "notice", notice));
}

async function run(path: string, work: () => Promise<void>, roles: AppRole[] = ["admin"]) {
  const role = await getCurrentRole();
  if (!role || !roles.includes(role)) redirect(role === "coach" ? "/studio/check-in" : "/");
  try {
    await work();
  } catch (error) {
    if (redirectError(error)) throw error;
    fail(path, error);
  }
}

async function assertCheckInAccess(sessionId: string) {
  const account = await getCurrentAccount();
  if (!account || (account.role !== "admin" && account.role !== "coach")) {
    throw new Error("Sign-in required");
  }
  if (account.role === "coach") {
    const session = await createAdminClient().from("sessions").select("coach_id").eq("id", sessionId).maybeSingle();
    if (session.error) throw new Error(session.error.message);
    if (session.data?.coach_id !== account.id) throw new Error("This course is not assigned to you.");
  }
  return account;
}

async function coachAssignment(formData: FormData, sessionId: string) {
  const coachId = optionalId(formData, "coach_id");
  if (!coachId) return { coach_id: null, instructor: null as string | null };
  const supabase = createAdminClient();
  const coach = await supabase.from("coaches").select("id, full_name, active").eq("id", coachId).maybeSingle();
  if (coach.error) throw new Error(coach.error.message);
  if (!coach.data) throw new Error("Choose a coach");
  if (!coach.data.active) {
    const current = await supabase.from("sessions").select("coach_id").eq("id", sessionId).maybeSingle();
    if (current.error) throw new Error(current.error.message);
    if (current.data?.coach_id !== coachId) throw new Error("Choose an active coach");
  }
  return { coach_id: coachId, instructor: coach.data.full_name };
}

function emailOrNull(formData: FormData) {
  const email = optionalText(formData, "email");
  return email ? email.toLowerCase() : null;
}

function noteField(formData: FormData) {
  const note = optionalText(formData, "note");
  if (note && note.length > 160) throw new Error("Note must be 160 characters or fewer.");
  return note;
}

async function adminAccount() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") throw new Error("Admin sign-in required");
  return account;
}

async function logCustomerChange(customerId: string, action: "created" | "updated" | "cancelled" | "sale", summary: string) {
  const account = await getCurrentAccount();
  if (!account || (account.role !== "admin" && account.role !== "coach")) return;
  const { error } = await createAdminClient().from("customer_admin_events").insert({
    customer_id: customerId,
    action,
    summary: summary.slice(0, 300),
    admin_account_id: account.role === "admin" ? account.id : null,
    admin_username: account.username,
  });
  if (error && /customer_admin_events/i.test(error.message) && /does not exist|schema cache|could not find/i.test(error.message)) return;
  if (error) throw new Error(error.message);
}

function isMissingCustomerProfileFields(message: string) {
  return /title|date_of_birth|address/.test(message) &&
    /does not exist|schema cache|could not find/i.test(message);
}

async function applyPackageClasses(packageId: string, formData: FormData) {
  const classTypeIds = idList(formData, "class_type_ids");
  await rpc("save_package_classes", {
    p_package_id: packageId,
    p_class_type_ids: classTypeIds,
    p_applies_to_all: classTypeIds.length === 0,
  });
}

export async function createClass(formData: FormData) {
  const path = safeReturnPath(formData, "/studio/courses/course-type");
  await run(path, async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("class_types")
      .insert({
        name: requiredText(formData, "name", "Name"),
        description: optionalText(formData, "description"),
        color: classColorField(formData),
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
    done(path, "Course type saved");
  });
}

export async function updateClass(formData: FormData) {
  const path = safeReturnPath(formData, "/studio/courses/course-type");
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
        color: classColorField(formData),
        duration_minutes: intField(formData, "duration_minutes", "Duration", 15, 240),
        default_capacity: intField(formData, "default_capacity", "Capacity", 1, 100),
        active: checked(formData, "active"),
        ...(image ? { image_path: image } : {}),
      })
      .eq("id", classId);
    if (error) throw new Error(error.message);
    if (image) await removeImage(existing.data.image_path);
    done(path, "Course type updated");
  });
}

export async function deleteClassType(formData: FormData) {
  const path = safeReturnPath(formData, "/studio/courses/course-type");
  await run(path, async () => {
    if (String(formData.get("admin_code") ?? "") !== "1234") {
      throw new Error("The admin code is incorrect.");
    }

    const classId = requiredId(formData, "id", "Course type");
    const supabase = createAdminClient();
    const existing = await supabase
      .from("class_types")
      .select("image_path")
      .eq("id", classId)
      .single();
    if (existing.error) throw new Error(existing.error.message);

    const [sessions, packages] = await Promise.all([
      supabase.from("sessions").select("id", { count: "exact", head: true }).eq("class_type_id", classId),
      supabase.from("package_class_types").select("package_id", { count: "exact", head: true }).eq("class_type_id", classId),
    ]);
    const referenceError = sessions.error ?? packages.error;
    if (referenceError) throw new Error(referenceError.message);
    if ((sessions.count ?? 0) + (packages.count ?? 0) > 0) {
      throw new Error("This course type is in use. Remove its classes and package links before deleting it.");
    }

    const { error } = await supabase.from("class_types").delete().eq("id", classId);
    if (error) throw new Error(error.message);
    try {
      await removeImage(existing.data.image_path);
    } catch {
      // Keep the successful deletion successful if storage cleanup is unavailable.
    }
    done(path, "Course type deleted");
  });
}

export async function updateSession(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = safeReturnPath(formData, `/studio/courses/schedule/${id}`);
  await run(path, async () => {
    const sessionId = requiredId(formData, "id", "Session");
    const supabase = createAdminClient();
    const session = await supabase.from("sessions").select("status").eq("id", sessionId).single();
    if (session.error) throw new Error(session.error.message);
    if (session.data.status !== "scheduled") throw new Error("Only scheduled courses can be edited.");

    const classTypeId = requiredId(formData, "class_type_id", "Class");
    const title = requiredText(formData, "title", "Title");
    const date = dateField(formData, "date", "Date");
    const start = timeField(formData, "start_time", "Start");
    const end = timeField(formData, "end_time", "End");
    if (end <= start) throw new Error("End time must be after the start time");
    const capacity = intField(formData, "capacity", "Capacity", 1, 100);
    const credits = intField(formData, "credits_required", "Credits", 1, 20);
    const [type, bookings, settings] = await Promise.all([
      supabase.from("class_types").select("id").eq("id", classTypeId).eq("active", true).single(),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("session_id", sessionId).neq("status", "cancelled"),
      getSettings(),
    ]);
    if (type.error) throw new Error(type.error.message || "Choose an active course type.");
    if (bookings.error) throw new Error(bookings.error.message);
    if (capacity < (bookings.count ?? 0)) throw new Error("Capacity is below the number already booked");
    const coach = await coachAssignment(formData, sessionId);
    const updated = await supabase.from("sessions").update({
      class_type_id: classTypeId,
      title,
      description: optionalText(formData, "description"),
      starts_at: zonedTimeToUtc(date, start, settings.timezone).toISOString(),
      ends_at: zonedTimeToUtc(date, end, settings.timezone).toISOString(),
      capacity,
      credits_required: credits,
      coach_id: coach.coach_id,
      instructor: coach.instructor,
      location: optionalText(formData, "location"),
      held: true,
    }).eq("id", sessionId);
    if (updated.error) throw new Error(updated.error.message);
    done(path, "Course updated for this date");
  });
}

export async function setCapacity(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const path = safeReturnPath(formData, `/studio/courses/schedule/${id}`);
  await run(path, async () => {
    await rpc("set_session_capacity", {
      p_session_id: requiredId(formData, "id", "Session"),
      p_capacity: intField(formData, "capacity", "Capacity", 1, 100),
    });
    done(path, "Capacity updated for this date");
  });
}

export async function cancelSession(formData: FormData) {
  const path = "/studio/courses/schedule";
  await run(path, async () => {
    await rpc("cancel_and_delete_session", { p_session_id: requiredId(formData, "id", "Session") });
    done(path, "Course removed and credits were returned");
  });
}

export async function createCustomer(formData: FormData) {
  const path = "/studio/directory";
  await run(path, async () => {
    const openingCredits = optionalInt(formData, "opening_credits", "Starting credits", 0, 500) ?? 0;
    const openingNote = noteField(formData);
    const supabase = createAdminClient();
    const customer = {
      full_name: requiredText(formData, "full_name", "Name"),
      title: optionalText(formData, "title"),
      date_of_birth: optionalText(formData, "date_of_birth"),
      address: optionalText(formData, "address"),
      email: emailOrNull(formData),
      phone: optionalText(formData, "phone"),
      notes: optionalText(formData, "notes"),
    };
    let { data, error } = await supabase
      .from("customers")
      .insert(customer)
      .select("id")
      .single();
    if (error && isMissingCustomerProfileFields(error.message)) {
      if (customer.title || customer.date_of_birth || customer.address) {
        throw new Error("Apply the customer personal information migration before saving a title, date of birth, or address.");
      }
      ({ data, error } = await supabase
        .from("customers")
        .insert({
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          notes: customer.notes,
        })
        .select("id")
        .single());
    }
    if (error) throw new Error(error.message);
    if (!data) throw new Error("The customer could not be created");
    await logCustomerChange(data.id, "created", "Added a client without registration");
    if (openingCredits > 0) {
      const account = await adminAccount();
      await rpc("adjust_customer_credits", {
        p_customer_id: data.id,
        p_delta: openingCredits,
        p_note: openingNote ?? "Starting credits",
        p_admin_account_id: account.id,
        p_admin_username: account.username,
      });
    }
    revalidatePath("/studio/directory");
    done(`/studio/directory/${data.id}`, "Customer added");
  });
}

export async function updateCustomer(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const detailPath = `/studio/directory/${id}`;
  const path = safeReturnPath(formData, detailPath);
  await run(path, async () => {
    const customerId = requiredId(formData, "id", "Customer");
    const supabase = createAdminClient();
    const customer = {
      full_name: requiredText(formData, "full_name", "Name"),
      title: optionalText(formData, "title"),
      date_of_birth: optionalText(formData, "date_of_birth"),
      address: optionalText(formData, "address"),
      email: emailOrNull(formData),
      phone: optionalText(formData, "phone"),
      notes: optionalText(formData, "notes"),
    };
    let { error } = await supabase
      .from("customers")
      .update(customer)
      .eq("id", customerId);
    if (error && isMissingCustomerProfileFields(error.message)) {
      if (customer.title || customer.date_of_birth || customer.address) {
        throw new Error("Apply the customer personal information migration before saving a title, date of birth, or address.");
      }
      ({ error } = await supabase
        .from("customers")
        .update({
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          notes: customer.notes,
        })
        .eq("id", customerId));
    }
    if (error) throw new Error(error.message);
    await logCustomerChange(customerId, "updated", "Updated client information");
    revalidatePath("/my-account");
    revalidatePath(detailPath);
    done(path, "Customer updated");
  });
}

export async function createPackage(formData: FormData) {
  const path = safeReturnPath(formData, "/studio/pricing/package");
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
  const path = safeReturnPath(formData, `/studio/pricing/package/${id}`);
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

function missingDiscountSchema(message: string) {
  return /discount_plans|customer_discounts/.test(message) &&
    /does not exist|schema cache|could not find/i.test(message);
}

export async function createDiscountPlan(formData: FormData) {
  const path = safeReturnPath(formData, "/studio/pricing/discount");
  await run(path, async () => {
    const supabase = createAdminClient();
    const { error } = await supabase.from("discount_plans").insert({
      name: requiredText(formData, "name", "Name"),
      percent: intField(formData, "percent", "Discount", 1, 100),
      active: checked(formData, "active"),
    });
    if (error) {
      throw new Error(missingDiscountSchema(error.message)
        ? "Apply the client discount migration before saving a discount package."
        : error.message);
    }
    done(path, "Discount package saved");
  });
}

export async function updateDiscountPlan(formData: FormData) {
  const path = safeReturnPath(formData, "/studio/pricing/discount");
  await run(path, async () => {
    const id = requiredId(formData, "id", "Discount");
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("discount_plans")
      .update({
        name: requiredText(formData, "name", "Name"),
        percent: intField(formData, "percent", "Discount", 1, 100),
        active: checked(formData, "active"),
      })
      .eq("id", id);
    if (error) {
      throw new Error(missingDiscountSchema(error.message)
        ? "Apply the client discount migration before saving a discount package."
        : error.message);
    }
    revalidatePath("/book-now/credits");
    done(path, "Discount package updated. New sales use the current percentage.");
  });
}

export async function grantCustomerDiscount(formData: FormData) {
  const customerId = String(formData.get("customer_id") ?? "");
  const path = safeReturnPath(formData, `/studio/directory/${customerId}`);
  await run(path, async () => {
    const id = requiredId(formData, "customer_id", "Customer");
    const planId = optionalId(formData, "discount_plan_id");
    const supabase = createAdminClient();
    let notice = "This client has no discount package";

    if (!planId) {
      const removed = await supabase.from("customer_discounts").delete().eq("customer_id", id).select("customer_id");
      if (removed.error) {
        throw new Error(missingDiscountSchema(removed.error.message)
          ? "Apply the client discount migration before granting a discount."
          : removed.error.message);
      }
      if ((removed.data ?? []).length > 0) {
        await logCustomerChange(id, "updated", "Removed the client's discount package");
        notice = "Discount removed. New package sales use the full price.";
      }
    } else {
      const plan = await supabase
        .from("discount_plans")
        .select("id, name, percent, active")
        .eq("id", planId)
        .maybeSingle();
      if (plan.error) {
        throw new Error(missingDiscountSchema(plan.error.message)
          ? "Apply the client discount migration before granting a discount."
          : plan.error.message);
      }
      if (!plan.data || !plan.data.active) throw new Error("Choose an active discount package");
      const { error } = await supabase.from("customer_discounts").upsert({
        customer_id: id,
        discount_plan_id: plan.data.id,
        granted_at: new Date().toISOString(),
      }, { onConflict: "customer_id" });
      if (error) throw new Error(error.message);
      await logCustomerChange(id, "updated", `Granted ${plan.data.name} (${plan.data.percent}% off)`);
      notice = "Discount granted. This client's package prices are reduced.";
    }

    revalidatePath("/studio/directory");
    revalidatePath(`/studio/directory/${id}`);
    revalidatePath("/book-now/credits");
    done(path, notice);
  });
}

export async function recordSale(formData: FormData) {
  const customerId = String(formData.get("customer_id") ?? "");
  const path = `/studio/directory/${customerId}`;
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
    await logCustomerChange(id, "sale", "Recorded a package sale");
    done(path, "Sale recorded. Credits are ready to book.");
  });
}

export async function adjustCustomerCredits(formData: FormData) {
  const customerId = String(formData.get("customer_id") ?? "");
  const path = safeReturnPath(formData, `/studio/directory/${customerId}`);
  await run(path, async () => {
    const id = requiredId(formData, "customer_id", "Customer");
    const delta = intField(formData, "delta", "Credit change", -500, 500);
    if (delta === 0) throw new Error("Enter a credit change other than zero.");
    const account = await adminAccount();
    await rpc("adjust_customer_credits", {
      p_customer_id: id,
      p_delta: delta,
      p_note: noteField(formData),
      p_admin_account_id: account.id,
      p_admin_username: account.username,
    });
    revalidatePath("/studio/directory");
    revalidatePath(`/studio/directory/${id}`);
    revalidatePath("/my-account");
    done(path, delta > 0 ? "Credits added and logged" : "Credits removed and logged");
  });
}

export async function enrollCustomer(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const customerId = String(formData.get("customer_id") ?? "");
  const fallback = /^[0-9a-f-]{36}$/i.test(sessionId) ? `/studio/courses/schedule/${sessionId}` : `/studio/directory/${customerId}`;
  const path = safeReturnPath(formData, fallback);
  await run(path, async () => {
    const id = requiredId(formData, "customer_id", "Customer");
    const account = await adminAccount();
    await rpc("enroll_customer", {
      p_session_id: requiredId(formData, "session_id", "Course"),
      p_customer_id: id,
      p_note: noteField(formData),
      p_admin_account_id: account.id,
      p_admin_username: account.username,
    });
    revalidatePath("/studio/directory");
    revalidatePath(`/studio/directory/${id}`);
    revalidatePath("/studio/check-in");
    revalidatePath("/studio/courses/schedule");
    revalidatePath("/my-account");
    done(path, "Client added to the course. The credit was logged.");
  });
}

export async function loadCustomerAdminEvents(customerId: string) {
  const role = await getCurrentRole();
  if (role !== "admin") return [];
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId)) return [];
  return customerAdminEvents(customerId);
}

export async function bookCustomer(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const path = `/studio/courses/schedule/${sessionId}`;
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
  const path = safeReturnPath(formData, `/studio/courses/schedule/${sessionId}`);
  await run(path, async () => {
    const bookingId = requiredId(formData, "booking_id", "Booking");
    const booking = await createAdminClient().from("bookings").select("session_id, customer_id").eq("id", bookingId).maybeSingle();
    if (booking.error) throw new Error(booking.error.message);
    if (!booking.data) throw new Error("Booking cannot be updated");
    await assertCheckInAccess(booking.data.session_id);
    await rpc("cancel_booking", { p_booking_id: bookingId });
    await logCustomerChange(booking.data.customer_id, "cancelled", "Booking cancelled and the credit was returned");
    revalidatePath("/studio/directory");
    revalidatePath(`/studio/directory/${booking.data.customer_id}`);
    done(path, "Booking cancelled and the credit was returned");
  }, ["admin", "coach"]);
}

export async function setBookingStatus(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const path = safeReturnPath(formData, `/studio/courses/schedule/${sessionId}`);
  await run(path, async () => {
    const bookingId = requiredId(formData, "booking_id", "Booking");
    const booking = await createAdminClient().from("bookings").select("session_id").eq("id", bookingId).maybeSingle();
    if (booking.error) throw new Error(booking.error.message);
    if (!booking.data) throw new Error("Booking cannot be updated");
    const account = await assertCheckInAccess(booking.data.session_id);
    await rpc("set_booking_status", {
      p_booking_id: bookingId,
      p_status: requiredText(formData, "status", "Status"),
      p_admin_account_id: account.role === "admin" ? account.id : null,
      p_admin_username: account.username,
    });
    done(path, "Attendance updated");
  }, ["admin", "coach"]);
}
