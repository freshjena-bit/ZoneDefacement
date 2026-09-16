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
  title: "TimeVault — Web Mirror Archive",
  description:
    "Archive any webpage as a time-stamped snapshot. Browse historical captures, compare changes over time, and keep the web's memory alive.",
  keywords: [
    "TimeVault",
    "web archive",
    "wayback machine",
    "snapshot",
    "web preservation",
  ],
  authors: [{ name: "TimeVault" }],
  openGraph: {
    title: "TimeVault — Web Mirror Archive",
    description:
      "Capture the web. Preserve it forever. Archive any webpage as a time-stamped snapshot.",
    siteName: "TimeVault",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TimeVault — Web Mirror Archive",
    description:
      "Capture the web. Preserve it forever. Archive any webpage as a time-stamped snapshot.",
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
