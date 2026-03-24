import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "ShelfReady — AI Product Listings, Photoshoots & Ad Creatives for E-commerce",
    template: "%s — ShelfReady",
  },
  description: "Generate optimized product listings, professional AI photoshoots, ad creatives with 160+ templates, social content, and competitive intelligence for Amazon, Etsy, and Shopify sellers.",
  keywords: [
    "AI product listings", "Amazon listing optimization", "Etsy SEO", "Shopify product descriptions",
    "AI product photography", "e-commerce photoshoots", "ad creative generator", "Facebook ad templates",
    "social media content generator", "multi-platform e-commerce", "product marketing AI",
    "Amazon A9 optimization", "Etsy tags strategy", "e-commerce tools",
  ],
  metadataBase: new URL("https://shelfready.app"),
  openGraph: {
    type: "website",
    siteName: "ShelfReady",
    title: "ShelfReady — AI-Powered E-commerce Content Platform",
    description: "Listings, photoshoots, ad creatives, social content — generated in seconds from a product description or photo.",
    url: "https://shelfready.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShelfReady — AI-Powered E-commerce Content Platform",
    description: "Listings, photoshoots, ad creatives, social content — generated in seconds.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://shelfready.app",
  },
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
