import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanban Workflows",
  description:
    "A simple way to visualize and manage your Planning Center workflows in the form of a kanban board.",
  openGraph: {
    title: "Kanban Workflows",
    description:
      "A simple way to visualize and manage your Planning Center workflows in the form of a kanban board.",
    url: "https://workflows.thomasharmond.com",
    siteName: "Kanban Workflows",
    images: [
      {
        url: "https://workflows.thomasharmond.com/og-image.png", // Must be an absolute URL
        width: 800,
        height: 600,
      },
    ],

    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
      <Analytics />
    </html>
  );
}
