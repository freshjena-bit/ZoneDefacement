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
  title: "SAM1337 — Defacement Mirror & Cyber Vandalism Database",
  description:
    "A Zone-H-style defacement mirror archive. Browse mirrored website defacements with attacker attribution, rankings, and historical captures for security research.",
  keywords: [
    "SAM1337",
    "defacement mirror",
    "zone-h",
    "cyber vandalism",
    "web defacement archive",
    "security research",
  ],
  authors: [{ name: "SAM1337" }],
  openGraph: {
    title: "SAM1337 — Defacement Mirror & Cyber Vandalism Database",
    description:
      "A Zone-H-style defacement mirror archive for security research & historical preservation.",
    siteName: "SAM1337",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SAM1337 — Defacement Mirror Archive",
    description:
      "A Zone-H-style defacement mirror archive for security research & historical preservation.",
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
