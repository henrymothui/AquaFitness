import { getCurrentRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminStudioLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole();
  if (role === "coach") redirect("/studio/check-in");
  if (role !== "admin") redirect("/");
  return children;
}
