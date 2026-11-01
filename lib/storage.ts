import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function imageUrl(path: string | null) {
  if (!path) return null;
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/class-images/${path}`;
}

export async function saveImage(file: FormDataEntryValue | null, folder: string) {
  if (!(file instanceof File) || file.size === 0) return null;
  const extension = ALLOWED.get(file.type);
  if (!extension) throw new Error("Use a JPEG, PNG, WEBP, or GIF image");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller");

  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("class-images")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });

  if (error) throw new Error(error.message);
  return path;
}

export async function removeImage(path: string | null) {
  if (!path) return;
  const supabase = createAdminClient();
  await supabase.storage.from("class-images").remove([path]);
}
