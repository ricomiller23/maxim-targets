import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAXIM Targets — Conference Diligence & Forensic Capital Screener",
  description: "Institutional screening engine for presenting and screened growth companies at the Maxim Growth Conference 2026. Forensic liquidity, negative working capital, 2-year financing flows, S-3/ATM shelves, and C-suite CRM outreach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
