"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Check, X, ChevronDown, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------
 * Editorial pricing page — mirrors the landing v3 aesthetic.
 * Paper cream bg · ink headlines · serif numerals · mono labels.
 * ---------------------------------------------------------------- */

const planKeys = ["free", "starter", "pro", "business"] as const;
type PlanKey = (typeof planKeys)[number];

const planMeta: Record<PlanKey, {
  tagline: string;
  features: string[];
  featured?: boolean;
  badge?: string;
}> = {
  free: {
    tagline: "Kick the tires.",
    features: [
      "5 product listings / month",
      "5 AI images (lifetime)",
      "5 social posts / month",
      "5 ad copies / month",
      "Watermarked exports",
    ],
  },
  starter: {
    tagline: "For the solo shop.",
    features: [
      "50 listings / month",
      "100 AI images / month",
      "10 AI photoshoots / month",
      "50 social posts · 50 ad creatives",
      "20 market research reports",
      "Priority support",
    ],
  },
  pro: {
    tagline: "The sweet spot.",
    featured: true,
    badge: "Most picked",
    features: [
      "300 listings / month",
      "300 AI images · 30 photoshoots",
      "300 social posts · 300 ad creatives",
      "100 market research reports",
      "Export to CSV / JSON",
      "200+ ad creative templates",
      "Priority support",
    ],
  },
  business: {
    tagline: "For the agency.",
    features: [
      "Unlimited listings & social",
      "1,000 AI images · 100 photoshoots",
      "Unlimited ads & research",
      "API access",
      "Team seats · SSO",
      "Dedicated support",
    ],
  },
};

const comparisonRows: { feature: string; values: (string | boolean)[] }[] = [
  { feature: "Product listings", values: ["5 / mo", "50 / mo", "300 / mo", "Unlimited"] },
  { feature: "AI images", values: ["5 lifetime", "100 / mo", "300 / mo", "1,000 / mo"] },
  { feature: "AI photoshoots", values: ["—", "10 / mo", "30 / mo", "100 / mo"] },
  { feature: "Social posts", values: ["5 / mo", "50 / mo", "300 / mo", "Unlimited"] },
  { feature: "Ad creatives", values: ["5 / mo", "50 / mo", "300 / mo", "Unlimited"] },
  { feature: "Market research", values: ["—", "20 / mo", "100 / mo", "Unlimited"] },
  { feature: "Creative templates", values: ["—", "200+", "200+", "200+"] },
  { feature: "Export formats", values: [false, false, "CSV, JSON", "CSV, JSON"] },
  { feature: "Support", values: ["Community", "Priority", "Priority", "Dedicated"] },
  { feature: "API access", values: [false, false, false, true] },
];

const faqs = [
  {
    q: "What counts as a photoshoot?",
    a: "One photoshoot generates up to 10 professional images from a single product photo. The AI analyzes your product, selects appropriate scenes, and creates studio, lifestyle, model, and in-context shots while preserving the exact product.",
  },
  {
    q: "Can I upgrade or downgrade anytime?",
    a: "Yes. Upgrades take effect immediately and you only pay the prorated difference. Downgrades apply at the end of the current billing cycle so you never lose access mid-period.",
  },
  {
    q: "What's the difference between AI images and photoshoots?",
    a: "AI images are generated from text descriptions — no upload needed. Photoshoots use your actual product photo and re-stage it in multiple scenes, preserving the real product appearance.",
  },
  {
    q: "Do you offer refunds?",
    a: "Every paid plan comes with a 14-day money-back guarantee. If ShelfReady isn't the right fit, email support and we'll issue a full refund — no questions asked.",
  },
  {
    q: "Which platforms do you support?",
    a: "Listings for Amazon, Etsy, Shopify, and eBay. Social posts for Instagram, Facebook, and Pinterest. Ads for Meta and Google.",
  },
  {
    q: "Is there an API?",
    a: "The Business plan includes full REST API access so you can integrate ShelfReady into your own tools and workflows. Docs appear in the dashboard once you upgrade.",
  },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icon.png" alt="ShelfReady" className="h-7 w-7 rounded" />
      <span className="text-xl tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
        ShelfReady
      </span>
    </Link>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-surface text-text">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-surface/85 backdrop-blur">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-[13px] sm:text-[14px] font-medium text-text-muted hover:text-text">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-[13px] sm:text-[14px] font-semibold bg-primary text-[#FAF6EC] px-4 sm:px-5 py-2 rounded hover:bg-primary-dark transition-colors"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Header ── */}
      <section className="border-b border-border pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 text-center">
          <p
            className="text-[11px] uppercase tracking-[0.22em] text-text-muted mb-5"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            06 · Pricing
          </p>
          <h1
            className="text-[clamp(40px,6vw,72px)] leading-[1] tracking-[-0.025em] text-secondary mb-5"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            Priced for <em className="italic text-primary">sellers</em>,
            <br className="hidden sm:block" /> not enterprises.
          </h1>
          <p className="mx-auto max-w-xl text-[16px] sm:text-[17px] text-text-muted leading-relaxed">
            Every plan ships with every feature. You&apos;re paying for volume, not
            capability. Cancel any time, prorated to the day.
          </p>

          {/* Billing toggle — editorial pill */}
          <div
            className="mt-10 inline-flex items-center gap-0 rounded-full border border-border bg-[#FAF6EC] p-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-full px-5 py-2 text-[11px] uppercase tracking-[0.12em] transition-all cursor-pointer",
                !annual ? "bg-secondary text-[#FAF6EC]" : "text-text-muted hover:text-text",
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "rounded-full px-5 py-2 text-[11px] uppercase tracking-[0.12em] transition-all cursor-pointer",
                annual ? "bg-secondary text-[#FAF6EC]" : "text-text-muted hover:text-text",
              )}
            >
              Yearly · save 20%
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing grid ── */}
      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-border bg-surface">
            {planKeys.map((key, i) => {
              const plan = PLANS[key];
              const meta = planMeta[key];
              const monthlyPrice = annual
                ? Math.round(plan.priceYearly / 12)
                : plan.priceMonthly;
              const isFeatured = meta.featured;

              return (
                <div
                  key={key}
                  className={cn(
                    "relative flex flex-col p-8 border-r border-border last:border-r-0 border-b md:border-b-0 last:border-b-0 min-h-[560px]",
                    isFeatured && "bg-secondary text-[#FAF6EC]",
                  )}
                >
                  {meta.badge && (
                    <span
                      className="absolute top-4 right-4 rounded px-2 py-1 text-[10px] uppercase tracking-[0.12em] bg-primary text-[#FAF6EC]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {meta.badge}
                    </span>
                  )}

                  <p
                    className={cn(
                      "text-[11px] uppercase tracking-[0.14em]",
                      isFeatured ? "text-[#C9BFA8]" : "text-text-muted",
                    )}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {String(i + 1).padStart(2, "0")} · Plan
                  </p>

                  <div
                    className="text-[32px] tracking-[-0.02em] mt-4 mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {plan.name}
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-5 mb-2">
                    {annual && plan.priceMonthly > 0 && (
                      <span
                        className={cn(
                          "text-[18px] line-through mr-1",
                          isFeatured ? "text-[#A49B8A]" : "text-text-muted",
                        )}
                      >
                        ${plan.priceMonthly}
                      </span>
                    )}
                    <span
                      className="text-[56px] leading-none tracking-[-0.03em]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      ${monthlyPrice}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] uppercase tracking-[0.1em]",
                        isFeatured ? "text-[#C9BFA8]" : "text-text-muted",
                      )}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      /mo
                    </span>
                  </div>

                  <p
                    className={cn(
                      "text-[13px] mb-6",
                      isFeatured ? "text-[#C9BFA8]" : "text-text-muted",
                    )}
                  >
                    {meta.tagline}
                    {annual && plan.priceYearly > 0 && (
                      <span className="block text-[11px] mt-1 opacity-75">
                        ${plan.priceYearly} billed yearly
                      </span>
                    )}
                  </p>

                  <ul className="flex-1 space-y-0">
                    {meta.features.map((f, j) => (
                      <li
                        key={j}
                        className={cn(
                          "py-2.5 flex gap-2 text-[13px] border-t",
                          isFeatured
                            ? "border-[#3A342B] text-[#E3D9C4]"
                            : "border-border text-text",
                          j === meta.features.length - 1 && "border-b",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[11px] min-w-[14px] mt-0.5",
                            isFeatured ? "text-primary-light" : "text-primary",
                          )}
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          —
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={cn(
                      "mt-6 inline-flex items-center justify-center gap-2 rounded px-5 py-3 text-[14px] font-semibold transition-colors",
                      isFeatured
                        ? "bg-primary text-[#FAF6EC] hover:bg-primary-light"
                        : "border border-secondary text-secondary hover:bg-secondary hover:text-[#FAF6EC]",
                    )}
                  >
                    {plan.priceMonthly === 0 ? "Start free" : "Start 14-day trial"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="border-b border-border py-16 sm:py-20 bg-surface-alt">
        <div className="mx-auto max-w-[1160px] px-5 sm:px-6">
          <div className="text-center mb-10">
            <p
              className="text-[11px] uppercase tracking-[0.22em] text-text-muted mb-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Compare plans
            </p>
            <h2
              className="text-[clamp(28px,4vw,44px)] tracking-[-0.02em] text-secondary"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Every feature, <em className="italic text-primary">side by side</em>.
            </h2>
          </div>

          <div className="overflow-x-auto border border-border bg-surface">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th
                    className="px-5 py-4 text-left uppercase tracking-[0.14em] text-[11px] text-text-muted font-semibold"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Feature
                  </th>
                  {planKeys.map((key) => (
                    <th
                      key={key}
                      className={cn(
                        "px-4 py-4 text-center text-[14px]",
                        key === "pro" ? "text-primary" : "text-secondary",
                      )}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {PLANS[key].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={row.feature} className="border-b border-border/60 last:border-b-0">
                    <td className="px-5 py-3 text-text">{row.feature}</td>
                    {row.values.map((val, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="mx-auto h-4 w-4 text-primary" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-text-muted/50" />
                          )
                        ) : val === "—" ? (
                          <span className="text-text-muted/60">—</span>
                        ) : (
                          <span className="text-text">{val}</span>
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

      {/* ── FAQ ── */}
      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-[820px] px-5 sm:px-6">
          <div className="text-center mb-10">
            <p
              className="text-[11px] uppercase tracking-[0.22em] text-text-muted mb-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Questions
            </p>
            <h2
              className="text-[clamp(28px,4vw,44px)] tracking-[-0.02em] text-secondary"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Things people ask.
            </h2>
          </div>
          <div className="border-t border-border">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="border-b border-border">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between px-2 py-5 text-left hover:bg-surface-alt/50 transition-colors cursor-pointer"
                  >
                    <span
                      className="pr-4 text-[16px] text-secondary tracking-[-0.01em]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 flex-shrink-0 text-text-muted transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-200",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-2 pb-5 text-[14px] leading-relaxed text-text-muted">
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

      {/* ── Bottom CTA (dark editorial) ── */}
      <section className="bg-secondary text-[#FAF6EC] py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-5 sm:px-6 text-center">
          <h2
            className="text-[clamp(36px,5vw,60px)] leading-[1] tracking-[-0.02em] mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            Still on the fence?
            <br />
            <em className="italic text-primary-light">Start free.</em>
          </h2>
          <p className="text-[#C9BFA8] text-[15px] leading-relaxed mb-8">
            No credit card required. Upgrade any time. 14-day money-back on every paid plan.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded bg-primary hover:bg-primary-light text-[#FAF6EC] px-6 py-3 text-[15px] font-semibold transition-colors"
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 bg-surface">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <Logo />
          <p
            className="text-[11px] uppercase tracking-[0.18em] text-text-muted"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            © {new Date().getFullYear()} ShelfReady
          </p>
        </div>
      </footer>
    </div>
  );
}
