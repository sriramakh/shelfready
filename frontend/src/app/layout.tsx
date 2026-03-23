import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ShelfReady - AI Product Listings for E-commerce",
  description:
    "Generate optimized product listings, lifestyle images, ad copy, and social media content powered by AI",
  keywords: [
    "e-commerce",
    "product listings",
    "AI",
    "Amazon",
    "Etsy",
    "Shopify",
    "product images",
    "ad copy",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
