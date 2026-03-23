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
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  Star,
  ChevronRight,
  X,
  Crown,
  Flame,
  TrendingUp,
} from "lucide-react";
import { PLANS } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const NEON = {
  lime: "#84cc16",
  pink: "#f472b6",
  yellow: "#facc15",
  cyan: "#22d3ee",
  purple: "#a855f7",
};

const features = [
  {
    icon: Package,
    title: "AI Listings",
    slang: "SEO that actually slaps",
    description:
      "Titles, bullets, descriptions — optimized for Amazon, Etsy, Shopify. Algorithm-approved.",
    color: NEON.lime,
    badge: "HOT",
  },
  {
    icon: Camera,
    title: "AI Photoshoots",
    slang: "Main character energy for your products",
    description:
      "Upload a product pic, get back studio shots, lifestyle scenes, model shots. No photographer needed.",
    color: NEON.pink,
    badge: "NEW",
  },
  {
    icon: Share2,
    title: "Social Content",
    slang: "Post it. Watch it pop off.",
    description:
      "Instagram carousels, Facebook posts, Pinterest pins — with hashtags, CTAs, the whole thing.",
    color: NEON.cyan,
    badge: null,
  },
  {
    icon: Megaphone,
    title: "Ad Creatives",
    slang: "160+ templates that go crazy",
    description:
      "Scroll-stopping ad visuals + copy. A/B ready. Pick a vibe, drop your product, done.",
    color: NEON.yellow,
    badge: "160+",
  },
  {
    icon: Search,
    title: "Market Intel",
    slang: "Know what your competitors don't",
    description:
      "Competitor analysis, trending keywords, pricing gaps. It's giving... unfair advantage.",
    color: NEON.purple,
    badge: null,
  },
  {
    icon: Layers,
    title: "Multi-Platform Export",
    slang: "One click. Every platform.",
    description:
      "Export listings to Amazon, Etsy, Shopify format. CSV, JSON, whatever you need.",
    color: NEON.lime,
    badge: "FREE",
  },
];

const glowUpPairs = [
  {
    before: "/showcase/input.png",
    after: "/showcase/studio.png",
    label: "Studio Glow Up",
  },
  {
    before: "/showcase/input.png",
    after: "/showcase/outdoor.png",
    label: "Outdoor Vibes",
  },
  {
    before: "/showcase/input.png",
    after: "/showcase/model.png",
    label: "Model Energy",
  },
];

const templatePreviews = [
  { src: "/templates/gz_neon_chaos.png", label: "Neon Chaos" },
  { src: "/templates/gz_glitch.png", label: "Glitch" },
  { src: "/templates/gz_brutalist.png", label: "Brutalist" },
  { src: "/templates/gz_holographic.png", label: "Holographic" },
  { src: "/templates/gz_acid.png", label: "Acid" },
  { src: "/templates/gz_vapor.png", label: "Vaporwave" },
  { src: "/templates/gz_meme_format.png", label: "Meme Format" },
  { src: "/templates/gz_retro_pixel.png", label: "Retro Pixel" },
];

const planKeys = ["free", "starter", "pro", "business"] as const;

const planNeonColors: Record<string, string> = {
  free: NEON.lime,
  starter: NEON.cyan,
  pro: NEON.pink,
  business: NEON.yellow,
};

const planEmoji: Record<string, string> = {
  free: "🆓",
  starter: "🚀",
  pro: "💎",
  business: "👑",
};

/* ------------------------------------------------------------------ */
/*  COMPONENTS                                                         */
/* ------------------------------------------------------------------ */

function NeonBadge({
  children,
  color,
  className = "",
  rotate = 0,
}: {
  children: React.ReactNode;
  color: string;
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${className}`}
      style={{
        background: color,
        color: "#0f0f0f",
        transform: `rotate(${rotate}deg)`,
        boxShadow: `0 0 20px ${color}66, 0 0 40px ${color}33`,
      }}
    >
      {children}
    </span>
  );
}

function GlowCard({
  children,
  color,
  className = "",
  hoverScale = true,
}: {
  children: React.ReactNode;
  color: string;
  className?: string;
  hoverScale?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border-2 bg-[#1a1a1a] p-6 transition-all duration-300 ${
        hoverScale ? "hover:scale-[1.03]" : ""
      } ${className}`}
      style={{
        borderColor: color,
        boxShadow: `0 0 30px ${color}22, inset 0 0 30px ${color}08`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE                                                          */
/* ------------------------------------------------------------------ */

export default function GenZLandingPage() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [activeGlowUp, setActiveGlowUp] = useState(0);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white selection:bg-[#84cc16] selection:text-black">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        {/* Background glow orbs */}
        <div
          className="pointer-events-none absolute top-0 left-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
          style={{ background: NEON.lime }}
        />
        <div
          className="pointer-events-none absolute top-32 right-0 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: NEON.pink }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[300px] rounded-full opacity-10 blur-[80px]"
          style={{ background: NEON.cyan }}
        />

        {/* Nav */}
        <nav className="relative mx-auto mb-20 flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl font-black text-black"
              style={{ background: NEON.lime }}
            >
              SR
            </div>
            <span className="text-xl font-bold tracking-tight">
              Shelf<span style={{ color: NEON.lime }}>Ready</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#glow-up" className="transition-colors hover:text-white">
              Glow Up
            </a>
            <a
              href="#templates"
              className="transition-colors hover:text-white"
            >
              Templates
            </a>
            <a href="#pricing" className="transition-colors hover:text-white">
              Pricing
            </a>
          </div>
          <Link
            href="/auth"
            className="rounded-full px-6 py-2.5 text-sm font-bold text-black transition-all duration-200 hover:scale-105"
            style={{
              background: NEON.lime,
              boxShadow: `0 0 20px ${NEON.lime}44`,
            }}
          >
            Get Started
          </Link>
        </nav>

        {/* Hero content */}
        <div className="relative mx-auto max-w-6xl text-center">
          {/* Floating badges */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <NeonBadge color={NEON.pink} rotate={-2}>
              <Flame className="mr-1 inline h-3 w-3" /> HOT
            </NeonBadge>
            <NeonBadge color={NEON.yellow} rotate={1}>
              AI-POWERED
            </NeonBadge>
            <NeonBadge color={NEON.cyan} rotate={-1}>
              FREE TO START
            </NeonBadge>
          </div>

          {/* MASSIVE headline */}
          <h1 className="mb-2 text-6xl leading-[0.9] font-black tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl">
            <span
              className="block"
              style={{
                background: `linear-gradient(135deg, ${NEON.lime}, ${NEON.cyan})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 40px ${NEON.lime}44)`,
              }}
            >
              YOUR LISTINGS
            </span>
            <span
              className="block"
              style={{
                background: `linear-gradient(135deg, ${NEON.pink}, ${NEON.yellow})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 40px ${NEON.pink}44)`,
              }}
            >
              ARE MID
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-white/50 sm:text-xl md:text-2xl">
            Your product photos are giving...{" "}
            <span className="font-medium text-white/70">nothing.</span>
            <br />
            <span className="font-semibold text-white">
              ShelfReady fixes that.
            </span>
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth"
              className="group relative inline-flex items-center gap-2 rounded-full px-10 py-4 text-lg font-black text-black transition-all duration-300 hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${NEON.lime}, ${NEON.cyan})`,
                boxShadow: `0 0 40px ${NEON.lime}44, 0 0 80px ${NEON.lime}22`,
              }}
            >
              TRY FREE — NO CAP
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="text-sm text-white/30">
              No credit card. No cap. Just vibes.
            </span>
          </div>

          {/* Trust pills */}
          <div className="mt-14 flex flex-wrap justify-center gap-3">
            {[
              "10,000+ sellers",
              "4.9★ rating",
              "160+ templates",
              "AI-powered",
            ].map((text, i) => (
              <div
                key={text}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/50 backdrop-blur-sm"
                style={{
                  transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
                }}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES                                                     */}
      {/* ============================================================ */}
      <section id="features" className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <NeonBadge color={NEON.yellow} className="mb-4" rotate={-2}>
              FEATURES
            </NeonBadge>
            <h2 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl">
              EVERYTHING YOU NEED
              <br />
              <span
                className="font-light italic"
                style={{ color: NEON.lime }}
              >
                to stop being mid
              </span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border-l-4 bg-[#1a1a1a] p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-[#222]"
                style={{
                  borderLeftColor: feature.color,
                  transform: `rotate(${i % 3 === 0 ? -0.5 : i % 3 === 1 ? 0 : 0.5}deg)`,
                }}
              >
                {/* Badge */}
                {feature.badge && (
                  <NeonBadge
                    color={feature.color}
                    className="absolute top-4 right-4"
                    rotate={3}
                  >
                    {feature.badge}
                  </NeonBadge>
                )}

                {/* Icon */}
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: `${feature.color}15`,
                    color: feature.color,
                  }}
                >
                  <feature.icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <h3 className="mb-1 text-xl font-black">{feature.title}</h3>
                <p
                  className="mb-3 text-sm font-bold"
                  style={{ color: feature.color }}
                >
                  {feature.slang}
                </p>
                <p className="text-sm font-light leading-relaxed text-white/50">
                  {feature.description}
                </p>

                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    boxShadow: `inset 0 0 40px ${feature.color}15, 0 0 30px ${feature.color}10`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  THE GLOW UP (Before / After)                                 */}
      {/* ============================================================ */}
      <section id="glow-up" className="relative px-4 py-24 sm:px-6 lg:px-8">
        {/* Background accent */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[150px]"
          style={{
            background: `linear-gradient(135deg, ${NEON.pink}, ${NEON.purple})`,
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <NeonBadge color={NEON.pink} className="mb-4" rotate={2}>
              <Sparkles className="mr-1 inline h-3 w-3" /> GLOW UP
            </NeonBadge>
            <h2 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl">
              THE{" "}
              <span
                style={{
                  background: `linear-gradient(135deg, ${NEON.pink}, ${NEON.purple})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                GLOW UP
              </span>
            </h2>
            <p className="mt-4 text-lg font-light text-white/40">
              Same product. Completely different energy.
            </p>
          </div>

          {/* Toggle tabs */}
          <div className="mb-8 flex justify-center gap-2">
            {glowUpPairs.map((pair, i) => (
              <button
                key={pair.label}
                onClick={() => setActiveGlowUp(i)}
                className="rounded-full px-5 py-2 text-sm font-bold transition-all duration-300"
                style={{
                  background:
                    activeGlowUp === i ? NEON.pink : "rgba(255,255,255,0.05)",
                  color: activeGlowUp === i ? "#0f0f0f" : "rgba(255,255,255,0.4)",
                  boxShadow:
                    activeGlowUp === i
                      ? `0 0 20px ${NEON.pink}44`
                      : "none",
                }}
              >
                {pair.label}
              </button>
            ))}
          </div>

          {/* Comparison */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Before */}
            <div
              className="relative overflow-hidden rounded-2xl border-2 p-4"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/50">
                  BEFORE
                </span>
                <span className="text-xs text-white/20">
                  basic product photo
                </span>
              </div>
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#1a1a1a]">
                <Image
                  src={glowUpPairs[activeGlowUp].before}
                  alt="Before"
                  fill
                  className="object-cover opacity-70 grayscale-[30%]"
                />
                {/* Sad overlay */}
                <div className="absolute inset-0 flex items-end justify-start p-4">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    giving nothing 😐
                  </span>
                </div>
              </div>
            </div>

            {/* After */}
            <div
              className="relative overflow-hidden rounded-2xl border-2 p-4"
              style={{
                borderColor: NEON.pink,
                boxShadow: `0 0 40px ${NEON.pink}22`,
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <NeonBadge color={NEON.pink}>AFTER</NeonBadge>
                <span className="text-xs text-white/40">
                  AI photoshoot magic
                </span>
              </div>
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#1a1a1a]">
                <Image
                  src={glowUpPairs[activeGlowUp].after}
                  alt="After"
                  fill
                  className="object-cover"
                />
                {/* Fire overlay */}
                <div className="absolute inset-0 flex items-end justify-start p-4">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold text-black"
                    style={{
                      background: NEON.pink,
                      boxShadow: `0 0 15px ${NEON.pink}66`,
                    }}
                  >
                    it&apos;s giving MAIN CHARACTER 🔥
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow between */}
          <div className="mt-6 text-center">
            <p className="text-sm font-light text-white/30">
              Upload any product photo → AI does the rest. That&apos;s literally
              it.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TEMPLATES                                                    */}
      {/* ============================================================ */}
      <section
        id="templates"
        className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
      >
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-10 blur-[120px]"
          style={{ background: NEON.yellow }}
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <NeonBadge color={NEON.yellow} className="mb-4" rotate={-3}>
              <Flame className="mr-1 inline h-3 w-3" /> 160+ TEMPLATES
            </NeonBadge>
            <h2 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl">
              TEMPLATES THAT
              <br />
              <span
                style={{
                  background: `linear-gradient(135deg, ${NEON.yellow}, ${NEON.lime})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                HIT DIFFERENT
              </span>
            </h2>
            <p className="mt-4 text-lg font-light text-white/40">
              Brutalist? Neon? Holographic? Meme format? We got you.
            </p>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {templatePreviews.map((template, i) => (
              <div
                key={template.label}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] transition-all duration-300 hover:scale-[1.05] hover:border-white/30"
                style={{
                  transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
                }}
              >
                <Image
                  src={template.src}
                  alt={template.label}
                  fill
                  className="object-cover transition-all duration-500 group-hover:scale-110"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-sm font-bold">{template.label}</span>
                </div>
                {/* Neon glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    boxShadow: `inset 0 0 30px ${NEON.yellow}20, 0 0 20px ${NEON.yellow}15`,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold transition-all duration-300 hover:scale-105"
              style={{
                borderColor: NEON.yellow,
                color: NEON.yellow,
              }}
            >
              EXPLORE ALL 160+ TEMPLATES
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SOCIAL PROOF TICKER                                          */}
      {/* ============================================================ */}
      <section className="overflow-hidden border-y border-white/5 py-6">
        <div
          className="flex animate-[scroll_20s_linear_infinite] gap-8 whitespace-nowrap"
          style={{
            width: "max-content",
          }}
        >
          {[
            "\"bruh this changed my entire shop\" — @etsyseller",
            "★★★★★ literally the only tool i use now",
            "\"my listings went from 💀 to 🔥\" — verified seller",
            "\"the photoshoot feature is INSANE\" — @amazonseller",
            "10,000+ sellers can't be wrong",
            "\"it's giving professional studio\" — @shopifyqueen",
            "★★★★★ ROI hit different with shelfready",
            "\"stopped paying photographers ngl\" — @dropshipking",
            "\"bruh this changed my entire shop\" — @etsyseller",
            "★★★★★ literally the only tool i use now",
            "\"my listings went from 💀 to 🔥\" — verified seller",
            "\"the photoshoot feature is INSANE\" — @amazonseller",
          ].map((text, i) => (
            <span
              key={i}
              className="text-sm font-medium text-white/20"
            >
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PRICING                                                      */}
      {/* ============================================================ */}
      <section id="pricing" className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full opacity-10 blur-[120px]"
          style={{ background: NEON.cyan }}
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <NeonBadge color={NEON.cyan} className="mb-4" rotate={1}>
              PRICING
            </NeonBadge>
            <h2 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl">
              PICK YOUR
              <br />
              <span
                style={{
                  background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.lime})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                FIGHTER
              </span>
            </h2>
            <p className="mt-4 text-lg font-light text-white/40">
              Start free. Upgrade when you&apos;re ready to go crazy.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {planKeys.map((key) => {
              const plan = PLANS[key];
              const color = planNeonColors[key];
              const isPro = key === "pro";

              return (
                <div
                  key={key}
                  className="group relative"
                  onMouseEnter={() => setHoveredPlan(key)}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  {/* Best value badge for Pro */}
                  {isPro && (
                    <div className="absolute -top-4 right-4 z-10">
                      <NeonBadge color={NEON.pink} rotate={3}>
                        <Crown className="mr-1 inline h-3 w-3" /> BEST VALUE
                      </NeonBadge>
                    </div>
                  )}

                  <div
                    className={`relative overflow-hidden rounded-2xl border-2 bg-[#1a1a1a] p-6 transition-all duration-300 ${
                      isPro ? "scale-[1.02]" : ""
                    } ${
                      hoveredPlan === key
                        ? "scale-[1.04] bg-[#222]"
                        : ""
                    }`}
                    style={{
                      borderColor: isPro ? NEON.pink : hoveredPlan === key ? color : "rgba(255,255,255,0.1)",
                      boxShadow:
                        isPro
                          ? `0 0 40px ${NEON.pink}22`
                          : hoveredPlan === key
                          ? `0 0 30px ${color}22`
                          : "none",
                    }}
                  >
                    {/* Plan header */}
                    <div className="mb-6">
                      <span className="text-2xl">{planEmoji[key]}</span>
                      <h3
                        className="mt-2 text-lg font-black uppercase tracking-wider"
                        style={{ color }}
                      >
                        {plan.name}
                      </h3>

                      {/* Price */}
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-5xl font-black md:text-6xl">
                          ${plan.priceMonthly}
                        </span>
                        <span className="text-sm font-light text-white/30">
                          /mo
                        </span>
                      </div>
                      {plan.priceMonthly === 0 && (
                        <NeonBadge
                          color={NEON.lime}
                          className="mt-2"
                          rotate={-1}
                        >
                          FREE FOREVER
                        </NeonBadge>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm font-light text-white/50"
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color }}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href="/auth"
                      className="mt-6 block w-full rounded-full py-3 text-center text-sm font-black uppercase tracking-wider transition-all duration-300 hover:scale-105"
                      style={{
                        background: isPro
                          ? `linear-gradient(135deg, ${NEON.pink}, ${NEON.purple})`
                          : hoveredPlan === key
                          ? color
                          : "rgba(255,255,255,0.05)",
                        color:
                          isPro || hoveredPlan === key
                            ? "#0f0f0f"
                            : "rgba(255,255,255,0.5)",
                        boxShadow:
                          isPro
                            ? `0 0 20px ${NEON.pink}44`
                            : "none",
                      }}
                    >
                      {plan.priceMonthly === 0
                        ? "START FREE"
                        : isPro
                        ? "GO PRO 💎"
                        : "GET STARTED"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                    */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8">
        {/* Full-width gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${NEON.lime}15, ${NEON.cyan}15, ${NEON.pink}15)`,
          }}
        />
        {/* Glow orbs */}
        <div
          className="pointer-events-none absolute top-0 left-0 h-[400px] w-[400px] rounded-full opacity-20 blur-[100px]"
          style={{ background: NEON.lime }}
        />
        <div
          className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full opacity-20 blur-[100px]"
          style={{ background: NEON.pink }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
            <span
              style={{
                background: `linear-gradient(135deg, ${NEON.lime}, ${NEON.yellow})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              STOP SCROLLING.
            </span>
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${NEON.pink}, ${NEON.cyan})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              START SELLING.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-lg text-lg font-light text-white/40">
            Join 10,000+ sellers who stopped settling for mid listings. Your
            competitors already did.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth"
              className="group inline-flex items-center gap-2 rounded-full px-12 py-5 text-xl font-black text-black transition-all duration-300 hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${NEON.lime}, ${NEON.cyan})`,
                boxShadow: `0 0 60px ${NEON.lime}33, 0 0 120px ${NEON.lime}11`,
              }}
            >
              LET&apos;S GO — IT&apos;S FREE
              <Zap className="h-6 w-6 transition-transform group-hover:rotate-12" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-white/20">
            <span>No credit card required</span>
            <span>·</span>
            <span>Free forever plan</span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="border-t border-white/5 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-black"
              style={{ background: NEON.lime }}
            >
              SR
            </div>
            <span className="text-sm font-bold text-white/40">
              ShelfReady
            </span>
          </div>
          <p className="text-xs text-white/20">
            Built different. &copy; {new Date().getFullYear()} ShelfReady. All
            rights reserved.
          </p>
        </div>
      </footer>

      {/* ============================================================ */}
      {/*  GLOBAL STYLES                                                */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
