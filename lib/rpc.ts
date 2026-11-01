import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function rpc<T>(fn: string, args: Record<string, unknown> = {}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.schema("private").rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}
