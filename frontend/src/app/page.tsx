"use client";

import { useState } from "react";
import Link from "next/link";
import FeatureShowcases from "@/components/landing/feature-showcases";
import {
  Package,
  Image,
  Share2,
  Megaphone,
  Search,
  Layers,
  Upload,
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Camera,
  Zap,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";
import { PLANS } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Package,
    title: "AI Listing Optimizer",
    description:
      "Generate SEO-optimized titles, bullets, and descriptions for Amazon, Etsy, and Shopify.",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Camera,
    title: "Product Photoshoot",
    description:
      "Upload your product, get 5 professional photoshoot images with models, studio, and lifestyle scenes.",
    gradient: "from-primary to-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Share2,
    title: "Social Content Engine",
    description:
      "Create platform-perfect posts for Instagram, Facebook, and Pinterest with hashtags and CTAs.",
    gradient: "from-pink-500 to-rose-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Megaphone,
    title: "Ad Copy + Creatives",
    description:
      "A/B test-ready ad copy and visual creatives with 70+ templates. Upload your product, pick a style, get scroll-stopping ads.",
    gradient: "from-amber-500 to-orange-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Search,
    title: "Competitor Intelligence + Market Insights",
    description:
      "Live web search competitive analysis with keyword gaps and pricing insights.",
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Layers,
    title: "Multi-Platform Export",
    description:
      "One product, optimized differently for every marketplace — Amazon keywords, Etsy tags, Shopify SEO.",
    gradient: "from-indigo-500 to-violet-400",
    bg: "bg-indigo-500/10",
  },
];

const steps = [
  {
    num: "01",
    title: "Describe or Upload",
    description: "Enter product details or upload a photo.",
    icon: Upload,
  },
  {
    num: "02",
    title: "AI Creates Everything",
    description:
      "Listings, images, ads, and social posts generated in seconds.",
    icon: Sparkles,
  },
  {
    num: "03",
    title: "Launch & Sell",
    description: "Export to your marketplace and start converting.",
    icon: Zap,
  },
];

const testimonials = [
  {
    quote:
      "ShelfReady cut our listing creation time from 3 hours to 10 minutes. The AI photoshoot feature alone paid for the subscription in one day.",
    name: "Sarah Chen",
    role: "Founder",
    company: "Bloom Naturals",
    stars: 5,
  },
  {
    quote:
      "We went from 50 to 400 SKUs in two months without hiring a copywriter. The multi-platform export is a game-changer for us.",
    name: "Marcus Rivera",
    role: "Operations Lead",
    company: "UrbanGear Co.",
    stars: 5,
  },
  {
    quote:
      "The ad copy generator consistently outperforms our agency-written ads. We've seen a 38% lift in ROAS since switching.",
    name: "Priya Sharma",
    role: "E-commerce Director",
    company: "Luxe Home Decor",
    stars: 5,
  },
];

const photoshootTypes = [
  { label: "Studio", color: "from-blue-500/20 to-blue-600/10", icon: Camera },
  { label: "Outdoor", color: "from-emerald-500/20 to-emerald-600/10", icon: Image },
  { label: "With Model", color: "from-purple-500/20 to-purple-600/10", icon: Sparkles },
  { label: "In Context", color: "from-amber-500/20 to-amber-600/10", icon: Layers },
];

const planEntries = Object.entries(PLANS) as [
  keyof typeof PLANS,
  (typeof PLANS)[keyof typeof PLANS],
][];

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ===== GLOBAL KEYFRAMES (injected once) ===== */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-gradient { animation: gradient-shift 8s ease infinite; background-size: 200% 200%; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; background-size: 200% 100%; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.7s ease-out both; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>

      {/* ===== NAVIGATION ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <Package className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-secondary">
                ShelfReady
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                ["Features", "#features"],
                ["How It Works", "#how-it-works"],
                ["Photoshoots", "#photoshoots"],
                ["Pricing", "#pricing"],
                ["Testimonials", "#testimonials"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="text-sm font-medium text-text-muted hover:text-text transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
              >
                Start Free
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 animate-gradient opacity-[0.03]" />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-32 left-[10%] w-[500px] h-[500px] bg-blue-400/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-[5%] w-[600px] h-[600px] bg-purple-400/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-300/5 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/10 px-4 py-1.5 mb-8">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  AI-Powered E-commerce Platform
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-secondary leading-[1.08]">
                Your Products Deserve{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Professional Marketing
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-text-muted leading-relaxed max-w-xl">
                AI-powered listings, photoshoots, ad copy, and social content
                — everything e-commerce sellers need to scale, in one
                platform.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all overflow-hidden"
                >
                  {/* Shimmer overlay */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" />
                  <span className="relative flex items-center gap-2">
                    Start Free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
                <a
                  href="#photoshoots"
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-border bg-white px-8 py-4 text-base font-bold text-text hover:border-primary/30 hover:bg-primary/[0.02] transition-all hover:-translate-y-0.5"
                >
                  See It In Action
                </a>
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  7,500+ sellers
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  4.9/5 rating
                </span>
              </div>
            </div>

            {/* Right — floating mockup */}
            <div className="animate-fade-in-up delay-200 hidden lg:block">
              <div className="animate-float">
                <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 shadow-2xl shadow-purple-500/10">
                  <div className="rounded-3xl bg-white p-6 sm:p-8">
                    {/* Fake browser bar */}
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-surface-alt rounded-lg border border-border px-4 py-1 text-xs text-text-muted">
                          app.shelfready.ai
                        </div>
                      </div>
                    </div>
                    {/* Content cards */}
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-slate-50 border border-primary/10 p-5">
                        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                          AI-Generated Title
                        </div>
                        <p className="text-sm font-semibold text-secondary leading-snug">
                          Premium Organic Cotton Baby Blanket - Ultra Soft
                          Swaddle Wrap for Newborns, Breathable &amp;
                          Hypoallergenic
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-surface-alt border border-border p-4">
                          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                            SEO Score
                          </div>
                          <div className="text-2xl font-bold text-emerald-600">
                            94
                            <span className="text-xs font-medium text-text-muted">
                              /100
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl bg-surface-alt border border-border p-4">
                          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Images Ready
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            5
                            <span className="text-xs font-medium text-text-muted ml-1">
                              photos
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["organic baby blanket", "cotton swaddle", "newborn gift", "nursery"].map(
                          (kw) => (
                            <span
                              key={kw}
                              className="rounded-full bg-white border border-primary/20 px-3 py-1 text-xs font-medium text-primary/80"
                            >
                              {kw}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LOGO BAR ===== */}
      <section className="py-14 border-y border-border/40 bg-surface-alt/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-text-muted mb-10 uppercase tracking-wider">
            Trusted by sellers on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
            {["Amazon", "Etsy", "Shopify", "eBay", "Walmart"].map((name) => (
              <span
                key={name}
                className="text-2xl sm:text-3xl font-bold text-secondary/20 hover:text-secondary/80 transition-colors duration-300 cursor-default select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Everything You Need
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary tracking-tight">
              One platform, every tool
            </h2>
            <p className="mt-5 text-lg text-text-muted leading-relaxed">
              From product research to listing optimization, images, social
              posts, and ads — ShelfReady covers your entire e-commerce
              content pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border bg-white p-7 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`inline-flex rounded-2xl p-3.5 mb-5 bg-gradient-to-br ${feature.gradient} shadow-lg`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-secondary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        id="how-it-works"
        className="py-24 sm:py-32 bg-surface-alt/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Simple Workflow
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary tracking-tight">
              Three steps to better listings
            </h2>
            <p className="mt-5 text-lg text-text-muted leading-relaxed">
              No design skills needed. No copywriting experience required.
              Just describe your product and let AI do the rest.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-primary/20 via-purple-400/30 to-purple-600/20" />

            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center">
                {/* Number badge */}
                <div className="relative inline-flex mb-7">
                  <div className="h-[120px] w-[120px] rounded-3xl bg-gradient-to-br from-primary/10 to-purple-400/10 flex items-center justify-center border border-primary/5">
                    <step.icon className="h-12 w-12 text-primary" />
                  </div>
                  <span className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-primary/30">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURE SHOWCASES (real AI output) ===== */}
      <FeatureShowcases />

      {/* ===== PRODUCT PHOTOSHOOT SHOWCASE ===== */}
      <section id="photoshoots" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Killer Feature
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary tracking-tight">
              Professional Photoshoots in 30 Seconds
            </h2>
            <p className="mt-5 text-lg text-text-muted leading-relaxed">
              Upload your product photo — AI generates studio shots, lifestyle
              scenes, and model images automatically.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left: input product image */}
            <div className="flex-shrink-0 w-full max-w-[280px]">
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-surface-alt/80 p-4 text-center">
                <div className="rounded-xl overflow-hidden border border-border mb-3 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/showcase/input.png"
                    alt="Original product photo — bamboo cutting board"
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4 text-primary/60" />
                  <p className="text-sm font-semibold text-text-muted">
                    Your Product Photo
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center flex-shrink-0">
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-16 h-[2px] bg-gradient-to-r from-primary/40 to-purple-400/40" />
                <ArrowRight className="h-6 w-6 text-primary/40" />
              </div>
              <div className="lg:hidden flex flex-col items-center gap-2 py-2">
                <div className="h-10 w-[2px] bg-gradient-to-b from-primary/40 to-purple-400/40" />
                <ChevronRight className="h-5 w-5 text-primary/40 rotate-90" />
              </div>
            </div>

            {/* Right: 2x2 real output grid */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto lg:mx-0">
                {[
                  { label: "Studio", src: "/showcase/studio.png" },
                  { label: "Outdoor", src: "/showcase/outdoor.png" },
                  { label: "With Model", src: "/showcase/model.png" },
                  { label: "In Context", src: "/showcase/context.png" },
                ].map((shot) => (
                  <div
                    key={shot.label}
                    className="group rounded-2xl border border-border bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shot.src}
                        alt={`AI-generated ${shot.label} photoshoot`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-sm font-semibold text-secondary">
                        {shot.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-text-muted mt-12 max-w-2xl mx-auto">
            AI automatically detects your product, chooses the right scene and model,
            and creates context-appropriate scenes — all from a single product photo.
          </p>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 sm:py-32 bg-surface-alt/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-5 text-lg text-text-muted leading-relaxed">
              Start free and upgrade as you grow. All plans include core AI
              features.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-14">
            <span
              className={`text-sm font-semibold transition-colors ${
                !yearly ? "text-secondary" : "text-text-muted"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                yearly ? "bg-primary" : "bg-slate-200"
              }`}
              aria-label="Toggle yearly billing"
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  yearly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold transition-colors ${
                  yearly ? "text-secondary" : "text-text-muted"
                }`}
              >
                Yearly
              </span>
              {yearly && (
                <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5">
                  Save 20%
                </span>
              )}
            </span>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {planEntries.map(([key, plan]) => {
              const isPopular = "popular" in plan && plan.popular;
              const monthlyEquivalent = yearly
                ? Math.round(plan.priceYearly / 12)
                : plan.priceMonthly;

              return (
                <div
                  key={key}
                  className={`relative rounded-2xl flex flex-col ${
                    isPopular
                      ? "p-[2px] bg-gradient-to-b from-primary via-purple-400 to-purple-600 shadow-2xl shadow-primary/15 scale-[1.03] z-10"
                      : ""
                  }`}
                >
                  <div
                    className={`relative rounded-2xl p-7 flex flex-col flex-1 ${
                      isPopular
                        ? "bg-white"
                        : "border border-border bg-white"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-gradient-to-r from-primary to-purple-600 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-primary/25">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="mb-5">
                      <h3 className="text-lg font-bold text-secondary">
                        {plan.name}
                      </h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-secondary">
                          ${monthlyEquivalent}
                        </span>
                        {monthlyEquivalent > 0 && (
                          <span className="text-sm text-text-muted font-medium">
                            /mo
                          </span>
                        )}
                      </div>
                      {yearly && plan.priceYearly > 0 && (
                        <p className="mt-1 text-xs text-text-muted">
                          Billed ${plan.priceYearly}/year
                        </p>
                      )}
                      {!yearly && plan.priceMonthly === 0 && (
                        <p className="mt-1 text-xs text-text-muted">
                          Free forever
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-sm text-text-muted"
                        >
                          <Check
                            className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                              isPopular ? "text-primary" : "text-emerald-500"
                            }`}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/signup"
                      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                        isPopular
                          ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                          : plan.priceMonthly === 0
                            ? "bg-primary/5 text-primary hover:bg-purple-500/10 border border-primary/20"
                            : "bg-secondary text-white hover:bg-secondary/90 shadow-md"
                      }`}
                    >
                      {plan.priceMonthly === 0
                        ? "Get Started Free"
                        : "Start Free Trial"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" />
              SSL security
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-500" />
              99.9% uptime
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Social Proof
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary tracking-tight">
              Loved by sellers worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border bg-white p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>

                <blockquote className="text-sm text-text leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="mt-6 pt-5 border-t border-border/60 flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-400/20 flex items-center justify-center text-sm font-bold text-primary">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-secondary">
                      {t.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-8 py-20 sm:px-16 sm:py-28 text-center overflow-hidden">
            {/* Decorative orbs */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white max-w-3xl mx-auto leading-tight tracking-tight">
                Ready to Transform Your Product Marketing?
              </h2>
              <p className="mt-6 text-lg text-blue-200/80 max-w-xl mx-auto leading-relaxed">
                Join 7,500+ e-commerce sellers using ShelfReady to create
                professional listings and images.
              </p>
              <div className="mt-10">
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center gap-2 rounded-2xl bg-white px-10 py-4 text-base font-bold text-secondary hover:bg-blue-50 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-0.5 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer pointer-events-none" />
                  <span className="relative flex items-center gap-2">
                    Start Free — No Credit Card Required
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border bg-surface-alt/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Package className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-lg font-bold text-secondary">
                  ShelfReady
                </span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed max-w-xs">
                AI-powered tools to create, optimize, and scale your
                e-commerce product listings.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3 mt-6">
                {["X", "LI", "YT"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="h-8 w-8 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-xs font-bold text-text-muted hover:text-primary hover:border-primary/20 transition-colors"
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold text-secondary mb-4">
                Product
              </h4>
              <ul className="space-y-2.5">
                {[
                  "Listing Optimizer",
                  "AI Photoshoots",
                  "Ad Copy",
                  "Social Content",
                  "Competitor Intelligence",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold text-secondary mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                {["About", "Blog", "Careers", "Contact"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold text-secondary mb-4">
                Support
              </h4>
              <ul className="space-y-2.5">
                {["Help Center", "Contact Us", "Status Page"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-secondary mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-text-muted hover:text-text transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">
              &copy; {new Date().getFullYear()} ShelfReady. All rights
              reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-text-muted/70">
              <Sparkles className="h-3 w-3" />
              Built with AI
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
