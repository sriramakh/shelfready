"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Camera,
  Share2,
  Megaphone,
  Search,
  Layers,
  ArrowRight,
  Check,
  Star,
  Heart,
  Shield,
  Sparkles,
  TrendingUp,
  Quote,
} from "lucide-react";
import { PLANS } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Package,
    title: "Listings That Actually Convert",
    description:
      "SEO-optimized titles, bullets, and descriptions crafted for Amazon, Etsy, and Shopify. No more staring at a blank page.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Camera,
    title: "Pro Photoshoots, Zero Hassle",
    description:
      "Upload your product photo and get back stunning studio, lifestyle, and model shots. Professional imagery without the professional price tag.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Share2,
    title: "Social Content on Autopilot",
    description:
      "Platform-perfect posts for Instagram, Facebook, and Pinterest — complete with hashtags, captions, and CTAs that feel authentic.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Megaphone,
    title: "Ad Creatives That Pop",
    description:
      "160+ templates for scroll-stopping ad creatives. A/B test-ready copy and visuals that actually get clicks.",
    color: "bg-amber-50 text-amber-700",
  },
  {
    icon: Search,
    title: "Know Your Market Inside Out",
    description:
      "Live competitor analysis, keyword gaps, and pricing insights. Make decisions based on data, not guesswork.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Layers,
    title: "One Product, Every Platform",
    description:
      "Export optimized listings across marketplaces — Amazon keywords, Etsy tags, Shopify SEO. All from a single upload.",
    color: "bg-indigo-50 text-indigo-600",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Handmade Jewelry Seller",
    platform: "Etsy",
    quote:
      "I used to spend entire weekends writing listings and editing photos. ShelfReady gave me my weekends back — and my sales actually went up 40%.",
    rating: 5,
    avatar: "SM",
  },
  {
    name: "Marcus T.",
    role: "Home Goods Brand Owner",
    platform: "Amazon",
    quote:
      "The AI photoshoots are honestly unreal. I uploaded a simple product shot and got back lifestyle images that look like I hired a whole creative agency.",
    rating: 5,
    avatar: "MT",
  },
  {
    name: "Priya K.",
    role: "Skincare Entrepreneur",
    platform: "Shopify",
    quote:
      "The market insights feature helped me spot a gap no one else was filling. Launched a new line and hit $10K in the first month. Can't recommend this enough.",
    rating: 5,
    avatar: "PK",
  },
];

const showcaseImages = [
  { src: "/showcase/studio.png", label: "Studio Shot", style: "Clean & Professional" },
  { src: "/showcase/model.png", label: "Model Shot", style: "Lifestyle & Real" },
  { src: "/showcase/outdoor.png", label: "Outdoor Scene", style: "Natural & Warm" },
  { src: "/showcase/context.png", label: "In Context", style: "Styled & Relatable" },
];

const pricingPlans = [
  {
    key: "starter" as const,
    badge: null,
    highlight: false,
  },
  {
    key: "pro" as const,
    badge: "Most Popular",
    highlight: true,
  },
  {
    key: "business" as const,
    badge: null,
    highlight: false,
  },
];

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function MillennialLandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  return (
    <div className="min-h-screen bg-[#fffbf7] text-stone-800 antialiased">
      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-stone-200/60 bg-[#fffbf7]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-stone-800">
              ShelfReady
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-stone-500 transition-colors hover:text-teal-600"
            >
              Features
            </a>
            <a
              href="#showcase"
              className="text-sm font-medium text-stone-500 transition-colors hover:text-teal-600"
            >
              Showcase
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-stone-500 transition-colors hover:text-teal-600"
            >
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#fffbf7] via-orange-50/30 to-[#fffbf7]" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-teal-100/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Trust pill */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm">
              <div className="flex -space-x-1.5">
                {[
                  "bg-teal-400",
                  "bg-amber-400",
                  "bg-rose-400",
                  "bg-indigo-400",
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`h-6 w-6 rounded-full border-2 border-white ${bg}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-stone-600">
                Trusted by <span className="font-bold text-stone-800">7,500+</span> sellers
              </span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-stone-900 md:text-6xl md:leading-[1.1]">
              Your products deserve{" "}
              <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                better marketing
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-500 md:text-xl">
              We&apos;ve got your back. ShelfReady handles the listings, photos,
              ads, and social content — so you can focus on what you love:{" "}
              <span className="font-medium text-stone-700">
                building your business.
              </span>
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-8 py-4 text-base font-semibold text-white shadow-md transition-all hover:bg-teal-700 hover:shadow-lg"
              >
                Start Free — No Card Needed
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#showcase"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-8 py-4 text-base font-semibold text-stone-700 shadow-sm transition-all hover:border-teal-200 hover:bg-teal-50"
              >
                See It in Action
              </a>
            </div>

            {/* Trust stats */}
            <div className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-6">
              {[
                { value: "7,500+", label: "Happy Sellers" },
                { value: "2M+", label: "Listings Created" },
                { value: "4.9/5", label: "Average Rating" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-stone-800">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-stone-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Testimonials ────────────────────────────── */}
      <section className="border-y border-stone-200/60 bg-gradient-to-b from-white to-orange-50/20 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-teal-600">
              Made for Real Sellers
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900">
              Don&apos;t just take our word for it
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="relative flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <Quote className="mb-3 h-8 w-8 text-teal-200" />
                <p className="flex-1 text-base leading-relaxed text-stone-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-800">
                      {t.name}
                    </div>
                    <div className="text-xs text-stone-400">
                      {t.role} &middot; {t.platform}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Heart className="h-3 w-3" />
              Everything You Need
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Six tools. One platform.{" "}
              <span className="text-teal-600">Infinite possibilities.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-stone-500">
              We built the toolkit we wished we had when we started selling
              online. Every feature is designed to save you time and help you
              sell more.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-md"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-stone-800">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-stone-500">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photoshoot Showcase ────────────────────────────────────── */}
      <section
        id="showcase"
        className="border-y border-stone-200/60 bg-gradient-to-b from-orange-50/30 via-white to-orange-50/20 py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              <Camera className="h-3 w-3" />
              AI Photoshoot Studio
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Upload once. Get a full photoshoot.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-stone-500">
              Just one product photo turns into studio-quality images with
              models, outdoor scenes, and styled settings — all powered by AI.
            </p>
          </div>

          {/* Before / After strip */}
          <div className="mb-10 flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* Input image */}
            <div className="w-full shrink-0 md:w-56">
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-white p-3 shadow-sm">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-100">
                  <Image
                    src="/showcase/input.png"
                    alt="Original product photo"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 text-center text-xs font-medium text-stone-400">
                  Your original photo
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex shrink-0 items-center justify-center md:mt-20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* Output grid */}
            <div className="grid flex-1 grid-cols-2 gap-4">
              {showcaseImages.map((img, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    <Image
                      src={img.src}
                      alt={img.label}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-stone-700">
                      {img.label}
                    </p>
                    <p className="text-xs text-stone-400">{img.style}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ad creatives row */}
          <div className="mt-12">
            <p className="mb-4 text-center text-sm font-semibold text-stone-500">
              Plus — generate ad creatives from the same photo
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                {
                  src: "/showcase/creative_flash_sale.png",
                  label: "Flash Sale",
                },
                {
                  src: "/showcase/creative_new_arrival.png",
                  label: "New Arrival",
                },
                {
                  src: "/showcase/creative_premium.png",
                  label: "Premium",
                },
                {
                  src: "/showcase/creative_comparison.png",
                  label: "Comparison",
                },
              ].map((img, i) => (
                <div
                  key={i}
                  className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden bg-stone-100">
                    <Image
                      src={img.src}
                      alt={img.label}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-stone-500">
                      {img.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Shield className="h-3 w-3" />
              Simple, Honest Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Pick a plan that fits your stage
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-stone-500">
              Start free, upgrade when you&apos;re ready. No surprise fees, no
              long contracts. Cancel anytime.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                Yearly
                <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => {
              const data = PLANS[plan.key];
              const price =
                billingCycle === "monthly"
                  ? data.priceMonthly
                  : Math.round(data.priceYearly / 12);
              const isHighlight = plan.highlight;

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-3xl border-2 p-7 transition-shadow ${
                    isHighlight
                      ? "border-teal-500 bg-white shadow-lg shadow-teal-100/50"
                      : "border-stone-200 bg-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-4 py-1 text-xs font-bold text-white shadow-sm">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-stone-800">
                      {data.name}
                    </h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-stone-900">
                        ${price}
                      </span>
                      <span className="text-sm text-stone-400">/month</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="mt-1 text-xs text-emerald-600 font-medium">
                        Billed ${data.priceYearly}/year
                      </p>
                    )}
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {data.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            isHighlight ? "text-teal-500" : "text-stone-400"
                          }`}
                        />
                        <span className="text-sm text-stone-600">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all ${
                      isHighlight
                        ? "bg-teal-600 text-white shadow-md hover:bg-teal-700 hover:shadow-lg"
                        : "border-2 border-stone-200 bg-white text-stone-700 hover:border-teal-200 hover:bg-teal-50"
                    }`}
                  >
                    {isHighlight ? "Get Started with Pro" : `Choose ${data.name}`}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Free tier note */}
          <p className="mt-8 text-center text-sm text-stone-400">
            Looking to just try it out?{" "}
            <Link
              href="/signup"
              className="font-semibold text-teal-600 underline decoration-teal-200 underline-offset-2 hover:text-teal-700"
            >
              Start with the Free plan
            </Link>{" "}
            — 5 listings and 5 images, no credit card required.
          </p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="mx-6 mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-600 to-teal-700 md:mx-auto md:max-w-5xl">
        <div className="relative px-8 py-20 text-center md:px-16">
          {/* Decorative warm circles */}
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-teal-500/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-orange-400/20 blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-teal-100 backdrop-blur-sm">
              <TrendingUp className="h-4 w-4" />
              Join 7,500+ sellers growing with ShelfReady
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Ready to grow your business?
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg text-teal-100/80">
              Stop spending hours on listings and ads. Let ShelfReady handle the
              heavy lifting while you focus on what matters most.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-teal-700 shadow-lg transition-all hover:bg-orange-50 hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-teal-200">
                <Shield className="h-4 w-4" />
                No credit card required &middot; Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200/60 bg-[#fffbf7] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-stone-800">
                ShelfReady
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-stone-400">
              <Link
                href="/pricing"
                className="transition-colors hover:text-teal-600"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="transition-colors hover:text-teal-600"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="transition-colors hover:text-teal-600"
              >
                Sign up
              </Link>
            </div>
            <p className="text-xs text-stone-400">
              &copy; {new Date().getFullYear()} ShelfReady. Made with{" "}
              <Heart className="inline h-3 w-3 text-rose-400" /> for sellers
              everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
