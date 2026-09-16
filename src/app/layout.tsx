import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZoneDefacement — Global Defacement Mirror Archive",
  description:
    "ZoneDefacement is a global defacement mirror database tracking verified web defacements, attacker rankings, and incident evidence.",
  keywords: [
    "ZoneDefacement",
    "defacement mirror",
    "zonedefacement",
    "web defacement",
    "defacement archive",
    "mirror database",
  ],
  authors: [{ name: "ZoneDefacement" }],
  openGraph: {
    title: "ZoneDefacement — Global Defacement Mirror Archive",
    description:
      "A global defacement mirror database tracking verified web defacements, attacker rankings, and incident evidence.",
    siteName: "ZoneDefacement",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZoneDefacement — Global Defacement Mirror Archive",
    description:
      "A global defacement mirror database tracking verified web defacements, attacker rankings, and incident evidence.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
