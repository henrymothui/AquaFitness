import type { SaleView } from "@/lib/queries";

export const demoSales: SaleView[] = [{
  id: "demo-order-1",
  packageName: "10 Class Pack",
  creditsTotal: 10,
  creditsUsed: 4,
  priceCents: 18000,
  discountCents: 0,
  finalPriceCents: 18000,
  expiresAt: null,
  status: "active",
  purchasedAt: "2026-10-18T08:00:00+08:00",
}];

export function availableCredits(sales: SaleView[]) {
  return sales.reduce((sum, sale) => sale.status === "active"
    ? sum + Math.max(sale.creditsTotal - sale.creditsUsed, 0)
    : sum, 0);
}
