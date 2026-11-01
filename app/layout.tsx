import type { Metadata } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: {
    default: "Hydrofit",
    template: "%s · Hydrofit",
  },
  description: "Weekly pool classes, class packs, and the studio desk for Hydrofit Aquafitness.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${barlow.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
