import OrdersPage from "@/components/studio-orders-page";

export const metadata = { title: "Pending Orders" };

export default async function PendingOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  return <OrdersPage searchParams={searchParams.then((params) => ({ ...params, tab: "pending" }))} />;
}
