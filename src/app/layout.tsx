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
  title: "DefacerID — Global Defacement Mirror Archive",
  description:
    "DefacerID is a global defacement mirror database tracking verified web defacements, attacker rankings, and incident evidence.",
  keywords: [
    "DefacerID",
    "defacement mirror",
    "defacerid",
    "web defacement",
    "defacement archive",
    "mirror database",
  ],
  authors: [{ name: "DefacerID" }],
  openGraph: {
    title: "DefacerID — Global Defacement Mirror Archive",
    description:
      "A global defacement mirror database tracking verified web defacements, attacker rankings, and incident evidence.",
    siteName: "DefacerID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DefacerID — Global Defacement Mirror Archive",
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
