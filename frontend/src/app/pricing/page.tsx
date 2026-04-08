"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Star,
  Camera,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const planKeys = ["free", "starter", "pro", "business"] as const;
type PlanKey = (typeof planKeys)[number];

const planMeta: Record<
  PlanKey,
  {
    tagline: string;
    badge: string;
    badgeColor: string;
    features: string[];
    photoshootLine: string | null;
    cta: string;
  }
> = {
  free: {
    tagline: "Perfect for trying things out",
    badge: "Free",
    badgeColor: "bg-purple-50 text-slate-600",
    features: [
      "5 product listings/month",
      "5 AI images (lifetime)",
      "5 social media posts/month",
      "5 ad copies/month",
      "Community support",
    ],
    photoshootLine: null,
    cta: "Get Started Free",
  },
  starter: {
    tagline: "Great for small sellers getting started",
    badge: "Starter",
    badgeColor: "bg-blue-50 text-blue-600",
    features: [
      "50 product listings/month",
      "100 AI images/month",
      "50 social media posts/month",
      "50 ad creatives/month",
      "20 market research reports/month",
      "200+ ad creative templates",
      "Priority support",
    ],
    photoshootLine: "10 AI photoshoots/month",
    cta: "Start Free Trial",
  },
  pro: {
    tagline: "For growing brands that need more power",
    badge: "Pro",
    badgeColor: "bg-purple-50 text-purple-700",
    features: [
      "300 product listings/month",
      "300 AI images/month",
      "300 social media posts/month",
      "300 ad creatives/month",
      "100 market research reports/month",
      "200+ ad creative templates",
      "Export to CSV/JSON",
      "Priority support",
    ],
    photoshootLine: "30 AI photoshoots/month",
    cta: "Start Free Trial",
  },
  business: {
    tagline: "Scale without limits",
    badge: "Business",
    badgeColor: "bg-amber-50 text-amber-700",
    features: [
      "Unlimited product listings",
      "1,000 AI images/month",
      "Unlimited social media posts",
      "Unlimited ad creatives",
      "Unlimited market research",
      "200+ ad creative templates",
      "Export to CSV/JSON",
      "API access",
      "Dedicated support",
    ],
    photoshootLine: "100 AI photoshoots/month",
    cta: "Start Free Trial",
  },
};

const comparisonRows: {
  feature: string;
  values: (string | boolean)[];
}[] = [
  { feature: "Product Listings", values: ["5/mo", "50/mo", "300/mo", "Unlimited"] },
  { feature: "AI Images", values: ["5 lifetime", "100/mo", "300/mo", "1,000/mo"] },
  { feature: "AI Photoshoots", values: ["\u2014", "10/mo", "30/mo", "100/mo"] },
  { feature: "Social Posts", values: ["5/mo", "50/mo", "300/mo", "Unlimited"] },
  { feature: "Ad Creatives", values: ["5/mo", "50/mo", "300/mo", "Unlimited"] },
  { feature: "Market Research", values: ["\u2014", "20/mo", "100/mo", "Unlimited"] },
  { feature: "Creative Templates", values: ["\u2014", "200+", "200+", "200+"] },
  { feature: "Export Formats", values: [false, false, "CSV, JSON", "CSV, JSON"] },
  { feature: "Support Level", values: ["Community", "Priority", "Priority", "Dedicated"] },
  { feature: "API Access", values: [false, false, false, true] },
];

const faqs = [
  {
    q: 'What counts as a "photoshoot"?',
    a: "One photoshoot generates up to 5 professional images from your product photo. The AI analyzes your product, selects appropriate scenes, and creates studio, lifestyle, model, and in-context shots.",
  },
  {
    q: "Can I upgrade or downgrade anytime?",
    a: "Yes. Upgrades take effect immediately and you only pay the prorated difference. Downgrades apply at the end of your current billing cycle so you never lose access mid-period.",
  },
  {
    q: "What's the difference between AI images and photoshoots?",
    a: "AI images are generated from text descriptions (no upload needed). Photoshoots use your actual product photo to create professional scenes that preserve your exact product appearance.",
  },
  {
    q: "Do you offer refunds?",
    a: "Absolutely. Every paid plan comes with a 14-day money-back guarantee. If ShelfReady isn't the right fit, contact our support team and we'll issue a full refund -- no questions asked.",
  },
  {
    q: "What platforms do you support?",
    a: "For product listings we support Amazon, Etsy, and Shopify. Social media posts can be generated for Instagram, Facebook, and Pinterest. Ad copy works with Facebook/Instagram Ads and Google Ads.",
  },
  {
    q: "Is there an API?",
    a: "The Business plan includes full REST API access so you can integrate ShelfReady into your own tools and workflows. API documentation is available in your dashboard once you upgrade.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
        {/* Subtle background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-white" />
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.06),transparent_70%)]" />

        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <Sparkles className="h-3 w-3" />
            14-day money-back guarantee
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
            Start free and scale as you grow. All plans include a 14-day
            money-back guarantee.
          </p>

          {/* ── Billing toggle (pill) ───────────────────────────────── */}
          <div className="mt-10 inline-flex items-center gap-1 rounded-full bg-purple-50 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
                !annual
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
                annual
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Yearly
            </button>
            {/* Save badge */}
            <span
              className={cn(
                "ml-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-all duration-300",
                annual
                  ? "translate-x-0 scale-100 opacity-100"
                  : "-translate-x-2 scale-90 opacity-0",
              )}
            >
              <Zap className="h-3 w-3" />
              Save 20%
            </span>
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ──────────────────────────────────────────── */}
      <section className="pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {planKeys.map((key) => {
              const plan = PLANS[key];
              const meta = planMeta[key];
              const isPopular = key === "pro";
              const monthlyPrice = annual
                ? Math.round(plan.priceYearly / 12)
                : plan.priceMonthly;

              const card = (
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border bg-white p-7 transition-shadow duration-300",
                    isPopular
                      ? "border-transparent shadow-xl"
                      : "border-slate-200 hover:shadow-xl",
                  )}
                >
                  {/* Popular ribbon */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-1.5 text-xs font-bold tracking-wide text-white shadow-md shadow-blue-500/25">
                        <Star className="h-3 w-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan badge */}
                  <span
                    className={cn(
                      "mb-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
                      meta.badgeColor,
                    )}
                  >
                    {meta.badge}
                  </span>

                  {/* Price */}
                  <div className="mb-1 flex items-baseline gap-1">
                    {annual && plan.priceMonthly > 0 && (
                      <span className="mr-1 text-lg font-medium text-slate-400 line-through">
                        ${plan.priceMonthly}
                      </span>
                    )}
                    <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                      ${monthlyPrice}
                    </span>
                    {monthlyPrice > 0 && (
                      <span className="text-sm font-medium text-slate-400">
                        /mo
                      </span>
                    )}
                  </div>
                  {annual && plan.priceYearly > 0 && (
                    <p className="mb-3 text-xs text-slate-400">
                      ${plan.priceYearly} billed annually
                    </p>
                  )}
                  {!annual && plan.priceMonthly === 0 && (
                    <p className="mb-3 text-xs text-slate-400">
                      Free forever
                    </p>
                  )}
                  {!annual && plan.priceMonthly > 0 && (
                    <p className="mb-3 text-xs text-slate-400">&nbsp;</p>
                  )}

                  {/* Tagline */}
                  <p className="mb-6 text-sm text-slate-500">{meta.tagline}</p>

                  {/* Photoshoot highlight */}
                  {meta.photoshootLine && (
                    <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-slate-100 px-4 py-3">
                      <Camera className="h-4.5 w-4.5 flex-shrink-0 text-[#7c3aed]" />
                      <span className="text-sm font-semibold text-slate-700">
                        {meta.photoshootLine}
                      </span>
                    </div>
                  )}

                  {/* Feature list */}
                  <ul className="mb-8 flex-1 space-y-3">
                    {meta.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-slate-600"
                      >
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href="/signup"
                    className={cn(
                      "group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200",
                      isPopular
                        ? "bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
                        : key === "free"
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {meta.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              );

              /* Gradient border wrapper for Pro card */
              if (isPopular) {
                return (
                  <div
                    key={key}
                    className="relative rounded-2xl bg-gradient-to-b from-[#2563eb] to-[#7c3aed] p-[2px] lg:scale-105 lg:z-10"
                  >
                    {card}
                  </div>
                );
              }

              return (
                <div key={key} className="relative">
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ───────────────────────────────── */}
      <section className="border-t border-slate-100 bg-slate-50/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-slate-900">
            Compare plan features
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-sm text-slate-500">
            A detailed breakdown so you can pick the right plan for your
            business.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-500">
                    Feature
                  </th>
                  {planKeys.map((key) => (
                    <th
                      key={key}
                      className={cn(
                        "px-4 py-4 text-center text-sm font-bold",
                        key === "pro" ? "text-[#7c3aed]" : "text-slate-900",
                      )}
                    >
                      {PLANS[key].name}
                      {key === "pro" && (
                        <span className="ml-1.5 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          Popular
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      "border-b border-slate-100 last:border-b-0 transition-colors",
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                    )}
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-700">
                      {row.feature}
                    </td>
                    {row.values.map((val, i) => (
                      <td key={i} className="px-4 py-3.5 text-center">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="mx-auto h-5 w-5 text-emerald-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-slate-300" />
                          )
                        ) : val === "\u2014" ? (
                          <span className="text-slate-300">{val}</span>
                        ) : (
                          <span className="text-sm font-medium text-slate-700">
                            {val}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-slate-500">
            Everything you need to know about our plans and billing.
          </p>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "overflow-hidden rounded-xl border transition-colors duration-200",
                    isOpen
                      ? "border-blue-200 bg-blue-50/30"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left"
                  >
                    <span className="pr-4 text-sm font-semibold text-slate-800">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-200 ease-in-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-500">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <Shield className="mx-auto mb-5 h-10 w-10 text-[#2563eb]" />
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Still not sure? Start free.
          </h2>
          <p className="mt-3 text-base text-slate-500">
            No credit card required. Upgrade anytime.
          </p>
          <Link
            href="/signup"
            className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} ShelfReady. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
