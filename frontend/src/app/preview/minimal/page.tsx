"use client";

import { PLANS } from "@/lib/constants";
import Image from "next/image";

const features = [
  {
    name: "Product Listings",
    description:
      "AI-generated titles, descriptions, and keywords optimized for every marketplace.",
  },
  {
    name: "AI Photoshoots",
    description:
      "Professional product photography — studio, lifestyle, and model shots — without a camera.",
  },
  {
    name: "Ad Creatives",
    description:
      "160+ templates for Facebook, Instagram, and Google ads. Copy and visuals, together.",
  },
  {
    name: "Social Content",
    description:
      "Ready-to-post content for Instagram, Facebook, and Pinterest in seconds.",
  },
  {
    name: "Market Insights",
    description:
      "Competitor analysis, pricing intelligence, and trend data to inform every decision.",
  },
  {
    name: "Multi-Platform Export",
    description:
      "One product, every channel. Export to Amazon, Etsy, Shopify, and beyond.",
  },
];

const showcaseImages = [
  { src: "/showcase/studio.png", alt: "Studio product photography" },
  { src: "/showcase/outdoor.png", alt: "Outdoor lifestyle photography" },
  { src: "/showcase/model.png", alt: "Model product photography" },
  { src: "/showcase/context.png", alt: "Contextual product photography" },
];

const pricingPlans = [
  PLANS.free,
  PLANS.starter,
  PLANS.pro,
  PLANS.business,
];

const pricingRows = [
  {
    label: "Price",
    values: pricingPlans.map((p) =>
      p.priceMonthly === 0 ? "Free" : `$${p.priceMonthly}/mo`
    ),
  },
  {
    label: "Listings",
    values: [
      PLANS.free.maxListings.toString(),
      PLANS.starter.maxListings.toString(),
      PLANS.pro.maxListings.toString(),
      "Unlimited",
    ],
  },
  {
    label: "AI Images",
    values: pricingPlans.map((p) => (p.maxImages as number) === 0 ? "—" : p.maxImages.toString()),
  },
  {
    label: "Photoshoots",
    values: pricingPlans.map((p) =>
      p.maxPhotoshoots === 0 ? "—" : p.maxPhotoshoots.toString()
    ),
  },
  {
    label: "Ad Creatives",
    values: ["Basic", "160+ templates", "160+ templates", "160+ templates"],
  },
  {
    label: "Market Insights",
    values: pricingPlans.map((p) => (p.research ? "Yes" : "—")),
  },
  {
    label: "Support",
    values: ["Community", "Priority", "Priority", "Dedicated"],
  },
];

export default function MinimalLanding() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 selection:bg-neutral-200">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-8 md:px-16 lg:px-24">
        <span className="text-sm font-light tracking-[0.3em] uppercase">
          ShelfReady
        </span>
        <a
          href="/signup"
          className="text-sm font-light tracking-wide text-neutral-500 underline underline-offset-4 decoration-neutral-300 hover:text-neutral-900 transition-colors"
        >
          Sign in
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="px-8 md:px-16 lg:px-24 pt-24 pb-32 md:pt-40 md:pb-48">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extralight leading-[1.1] tracking-tight max-w-4xl">
          Every product
          <br />
          deserves to be{" "}
          <span className="italic font-light text-[#64748b]">seen.</span>
        </h1>
        <p className="mt-10 text-base font-light text-neutral-500 tracking-wide max-w-lg leading-relaxed">
          AI-powered listings, photoshoots, ad creatives, and market intelligence
          — everything an e-commerce seller needs, in one quiet workspace.
        </p>
        <a
          href="/signup"
          className="inline-block mt-10 text-sm font-light tracking-wide underline underline-offset-4 decoration-neutral-400 hover:decoration-neutral-900 transition-colors"
        >
          Start for free
        </a>
      </section>

      <hr className="border-neutral-200 mx-8 md:mx-16 lg:mx-24" />

      {/* ── What We Do ── */}
      <section className="px-8 md:px-16 lg:px-24 py-24 md:py-32">
        <p className="text-xs font-light tracking-[0.3em] uppercase text-neutral-400 mb-16">
          What we do
        </p>
        <div className="max-w-2xl space-y-10">
          {features.map((feature) => (
            <div key={feature.name}>
              <p className="text-base font-medium tracking-wide">
                {feature.name}
              </p>
              <p className="mt-1 text-sm font-light text-neutral-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-neutral-200 mx-8 md:mx-16 lg:mx-24" />

      {/* ── Photoshoot Showcase ── */}
      <section className="px-8 md:px-16 lg:px-24 py-24 md:py-32">
        <p className="text-xs font-light tracking-[0.3em] uppercase text-neutral-400 mb-16">
          AI Photoshoots
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {showcaseImages.map((img) => (
            <div key={img.src} className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      </section>

      <hr className="border-neutral-200 mx-8 md:mx-16 lg:mx-24" />

      {/* ── Pricing Table ── */}
      <section className="px-8 md:px-16 lg:px-24 py-24 md:py-32">
        <p className="text-xs font-light tracking-[0.3em] uppercase text-neutral-400 mb-16">
          Pricing
        </p>
        <div className="overflow-x-auto">
          <table className="w-full max-w-4xl text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-900">
                <th className="pb-4 pr-8 text-xs font-light tracking-[0.2em] uppercase text-neutral-400 w-1/5">
                  &nbsp;
                </th>
                {pricingPlans.map((plan) => (
                  <th
                    key={plan.name}
                    className="pb-4 pr-8 text-sm font-medium tracking-wide w-1/5"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricingRows.map((row) => (
                <tr key={row.label} className="border-b border-neutral-200">
                  <td className="py-4 pr-8 text-xs font-light tracking-[0.15em] uppercase text-neutral-400">
                    {row.label}
                  </td>
                  {row.values.map((value, i) => (
                    <td
                      key={i}
                      className="py-4 pr-8 text-sm font-light text-neutral-700"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="border-neutral-200 mx-8 md:mx-16 lg:mx-24" />

      {/* ── Final CTA ── */}
      <section className="px-8 md:px-16 lg:px-24 py-32 md:py-48 text-center">
        <p className="text-3xl md:text-4xl font-extralight tracking-tight">
          Start creating.{" "}
          <span className="text-neutral-400">It&rsquo;s free.</span>
        </p>
        <a
          href="/signup"
          className="inline-block mt-8 text-sm font-light tracking-wide underline underline-offset-4 decoration-neutral-400 hover:decoration-neutral-900 transition-colors"
        >
          Create your first listing
        </a>
      </section>

      {/* ── Footer ── */}
      <footer className="px-8 md:px-16 lg:px-24 py-8 border-t border-neutral-200 flex items-center justify-between">
        <span className="text-xs font-light tracking-[0.2em] uppercase text-neutral-400">
          ShelfReady
        </span>
        <span className="text-xs font-light text-neutral-400">
          &copy; {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
