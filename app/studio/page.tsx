import { accountHome, getCurrentRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudioHomePage() {
  const role = await getCurrentRole();
  redirect(role === "admin" ? "/studio/courses/schedule" : accountHome(role));
}
