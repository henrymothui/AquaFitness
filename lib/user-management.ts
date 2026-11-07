import "server-only";

import { startMemberSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type MemberRegistration = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

/** Create a Supabase Auth identity and link it to the booking customer record. */
export async function registerMember(input: MemberRegistration) {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() ?? "";

  if (fullName.length < 1 || fullName.length > 120) throw new Error("Enter a name up to 120 characters.");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (input.password.length < 12 || input.password.length > 128) throw new Error("Password must be between 12 and 128 characters.");
  if (phone.length > 40) throw new Error("Phone number must be 40 characters or fewer.");

  const supabase = createAdminClient();
  const { data: created, error: authError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { full_name: fullName } },
  });
  if (authError) throw new Error(authError.message);
  if (!created.user) throw new Error("Supabase did not create a user identity.");

  try {
    const { error: customerError } = await supabase
      .from("customers")
      .insert({ full_name: fullName, email, phone: phone || null, auth_user_id: created.user.id });
    if (customerError) throw new Error(customerError.message);
  } catch (error) {
    // Avoid leaving a login identity behind if its booking profile could not be created.
    await supabase.auth.admin.deleteUser(created.user.id);
    throw error;
  }

  return { id: created.user.id, email };
}

/** Validate member credentials against Supabase Auth and return the linked app account. */
export async function authenticateMember(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const authClient = createAdminClient();
  const { data, error } = await authClient.auth.signInWithPassword({ email: normalizedEmail, password });
  if (error || !data.user) return null;

  // signInWithPassword replaces the client's service-role authorization with the
  // member session. Use a fresh admin client for this server-side account lookup.
  const { data: customer, error: accountError } = await createAdminClient()
    .from("customers")
    .select("id, email")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (accountError) throw new Error(accountError.message);
  if (!customer) return null;
  return startMemberSession(customer, data.user.id);
}
