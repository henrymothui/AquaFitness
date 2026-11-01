import { StudioNav } from "@/components/studio-nav";

export const metadata = { title: "Studio" };

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:flex">
      <StudioNav />
      <div className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}
