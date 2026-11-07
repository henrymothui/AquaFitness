import type { Metadata } from "next";
import { Oswald, Outfit } from "next/font/google";
import "./globals.css";
import { getI18n, getLocale } from "@/lib/i18n";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
});

const display = Oswald({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: "Hydrofit", template: "%s · Hydrofit" },
    description: t.home.metaDescription,
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${outfit.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-black">{children}</body>
    </html>
  );
}
