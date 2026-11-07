import { customerBillingHistory } from "@/lib/queries";
import { getDemoRole } from "@/lib/demo-auth";

function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET() {
  if ((await getDemoRole()) !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const billing = await customerBillingHistory();
  const rows = [
    [
      "Billing record ID",
      "Customer ID",
      "Customer name",
      "Customer email",
      "Package",
      "Purchased at",
      "Credits purchased",
      "Credits consumed",
      "Price (SGD)",
      "Discount (SGD)",
      "Amount paid (SGD)",
      "Package status",
    ],
    ...billing.map((sale) => [
      sale.id,
      sale.customerId,
      sale.customerName,
      sale.customerEmail ?? "",
      sale.packageName,
      sale.purchasedAt,
      sale.creditsTotal,
      sale.creditsUsed,
      (sale.priceCents / 100).toFixed(2),
      (sale.discountCents / 100).toFixed(2),
      (sale.finalPriceCents / 100).toFixed(2),
      sale.status,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hydrofit-customer-billing-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
