import { customerCreditBalances, listCustomers } from "@/lib/queries";
import { getCurrentRole } from "@/lib/auth";

function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET() {
  if ((await getCurrentRole()) !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const customers = await listCustomers();
  const balances = await customerCreditBalances(customers.map((customer) => customer.id));
  const rows = [
    ["Customer ID", "Title", "Name", "Date of birth", "Address", "Email", "Phone", "Date joined", "Live credits", "Notes"],
    ...customers.map((customer) => [
      customer.id,
      customer.title ?? "",
      customer.full_name,
      customer.date_of_birth ?? "",
      customer.address ?? "",
      customer.email ?? "",
      customer.phone ?? "",
      customer.created_at,
      balances.get(customer.id) ?? 0,
      customer.notes ?? "",
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hydrofit-customers-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
