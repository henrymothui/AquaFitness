import OrdersPage from "@/components/studio-orders-page";

export const metadata = { title: "Confirmed Orders" };

export default async function ConfirmedOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  return <OrdersPage searchParams={searchParams.then((params) => ({ ...params, tab: "billing" }))} />;
}
