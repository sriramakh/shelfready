"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Package,
  Share2,
  Megaphone,
  Search,
  Layers,
  ChevronRight,
  Check,
  Hash,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";

// ── Real generated data (from MiniMax) ──────────────────────────────

import listingData from "../../../public/showcase/example_listing.json";
import socialData from "../../../public/showcase/example_social.json";
import adsData from "../../../public/showcase/example_ads.json";
import researchData from "../../../public/showcase/example_research.json";
import multiData from "../../../public/showcase/example_multiplatform.json";

// ── Feature Showcases ───────────────────────────────────────────────

function ListingShowcase() {
  const [showMore, setShowMore] = useState(false);
  const title = listingData.title || "";
  const bullets = listingData.bullets || [];
  const keywords = listingData.keywords || [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Input</p>
        <p className="text-sm text-text-muted">&quot;Bamboo Cutting Board Set, 3-piece, organic moso bamboo, deep juice grooves, anti-slip feet, $34.99&quot;</p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-primary/50">
          <div className="w-8 h-[2px] bg-gradient-to-r from-primary/30 to-primary/60" />
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      <div className="rounded-xl bg-white border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">AMAZON</span>
            <span className="text-[10px] text-text-muted">Optimized Title</span>
          </div>
          <p className="text-sm font-semibold text-secondary leading-snug">{title}</p>
        </div>

        <div className="p-4 border-b border-border/50">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Key Selling Points</p>
          <ul className="space-y-2">
            {bullets.slice(0, showMore ? bullets.length : 3).map((b: string, i: number) => (
              <li key={i} className="flex gap-2 text-xs text-text-muted leading-relaxed">
                <Check className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {bullets.length > 3 && (
            <button onClick={() => setShowMore(!showMore)} className="text-xs text-primary font-medium mt-2 cursor-pointer hover:underline">
              {showMore ? "Show less" : `+${bullets.length - 3} more`}
            </button>
          )}
        </div>

        <div className="p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Backend Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {(keywords as string[]).map((kw: string, i: number) => (
              <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{typeof kw === "string" ? kw : ""}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialShowcase() {
  const caption = socialData.caption || "";
  const hashtags = socialData.hashtags || [];
  const cta = socialData.cta_text || "";

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Input</p>
        <p className="text-sm text-text-muted">&quot;Bamboo Cutting Board Set, eco-friendly, lifestyle tone, drive traffic to Amazon&quot;</p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-primary/50">
          <div className="w-8 h-[2px] bg-gradient-to-r from-pink-300/50 to-pink-500/50" />
          <ChevronRight className="h-4 w-4 text-pink-400" />
        </div>
      </div>

      <div className="rounded-xl bg-white border border-border shadow-sm overflow-hidden">
        {/* Instagram post preview */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
            <span className="text-xs font-semibold text-secondary">your_brand</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 font-bold">INSTAGRAM</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line">
            {caption}
          </p>
        </div>

        {/* Hashtags */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-1 mb-2">
            <Hash className="h-3 w-3 text-blue-500" />
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{hashtags.length} Hashtags</p>
          </div>
          <p className="text-[10px] text-blue-600 leading-relaxed">
            {hashtags.map((h: string) => h.startsWith("#") ? h : `#${h}`).join(" ")}
          </p>
        </div>

        {/* CTA */}
        {cta && (
          <div className="p-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Call to Action</p>
            <p className="text-xs text-secondary font-medium">{cta}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdsShowcase() {
  const [activeVariant, setActiveVariant] = useState(0);
  const variants = adsData.variants || [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Input</p>
        <p className="text-sm text-text-muted">&quot;Bamboo Cutting Board Set, $34.99, 20% off, target: women 28-45, eco-conscious&quot;</p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-primary/50">
          <div className="w-8 h-[2px] bg-gradient-to-r from-amber-300/50 to-amber-500/50" />
          <ChevronRight className="h-4 w-4 text-amber-400" />
        </div>
      </div>

      <div className="rounded-xl bg-white border border-border shadow-sm overflow-hidden">
        {/* Variant tabs */}
        <div className="flex border-b border-border/50">
          {variants.map((v: { variant_label?: string }, i: number) => (
            <button
              key={i}
              onClick={() => setActiveVariant(i)}
              className={cn(
                "flex-1 text-xs font-semibold py-2.5 transition-colors cursor-pointer",
                activeVariant === i
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-text-muted hover:text-text"
              )}
            >
              Variant {v.variant_label || String.fromCharCode(65 + i)}
            </button>
          ))}
        </div>

        {/* Active variant */}
        {variants[activeVariant] && (
          <div className="p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Headline</p>
              <p className="text-sm font-bold text-secondary">{(variants[activeVariant] as { headline?: string }).headline}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Primary Text</p>
              <p className="text-xs text-text-muted leading-relaxed">{(variants[activeVariant] as { primary_text?: string }).primary_text}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">CTA Button</p>
                <span className="text-xs bg-primary text-white px-3 py-1 rounded-md font-medium">{(variants[activeVariant] as { cta?: string }).cta}</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Angle</p>
                <p className="text-[10px] text-purple-600 font-medium">{(variants[activeVariant] as { angle?: string }).angle}</p>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 pb-3">
          <p className="text-[10px] text-text-muted text-center">3 variants ready for A/B testing</p>
        </div>
      </div>
    </div>
  );
}

function ResearchShowcase() {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const analysis = researchData.analysis || "";
  const keywords = researchData.keywords_found || [];
  const competitors = researchData.competitors || [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Query</p>
        <p className="text-sm text-text-muted">&quot;Bamboo cutting board market on Amazon, $20-50 range&quot;</p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-primary/50">
          <div className="w-8 h-[2px] bg-gradient-to-r from-emerald-300/50 to-emerald-500/50" />
          <ChevronRight className="h-4 w-4 text-emerald-400" />
        </div>
      </div>

      <div className="rounded-xl bg-white border border-border shadow-sm overflow-hidden">
        {/* Analysis snippet */}
        <div className="p-4 border-b border-border/50">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Market Analysis</p>
          <p className="text-xs text-text-muted leading-relaxed">
            {showFullAnalysis ? analysis : analysis.slice(0, 300)}
            {analysis.length > 300 && (
              <button onClick={() => setShowFullAnalysis(!showFullAnalysis)} className="text-primary font-medium ml-1 cursor-pointer hover:underline">
                {showFullAnalysis ? "Show less" : "Read more"}
              </button>
            )}
          </p>
        </div>

        {/* Top competitors */}
        <div className="p-4 border-b border-border/50">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Top {competitors.length} Competitors</p>
          <div className="space-y-2">
            {competitors.map((c: { name?: string; price_range?: string; strengths?: string }, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-surface-alt/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-secondary">{c.name}</span>
                </div>
                <span className="text-[10px] text-text-muted bg-white px-2 py-0.5 rounded-full">{c.price_range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{keywords.length} Keywords Found</p>
          <div className="flex flex-wrap gap-1">
            {keywords.map((kw: string, i: number) => (
              <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{kw}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MultiPlatformShowcase() {
  const [activePlatform, setActivePlatform] = useState<"amazon" | "etsy" | "shopify">("amazon");
  const [showAllBullets, setShowAllBullets] = useState(false);

  const platforms = [
    { id: "amazon" as const, name: "Amazon", color: "#FF9900", style: "Keyword-dense, A9 optimized" },
    { id: "etsy" as const, name: "Etsy", color: "#F1641E", style: "Story-driven, tag-rich" },
    { id: "shopify" as const, name: "Shopify", color: "#96BF48", style: "Conversion-focused DTC" },
  ];

  const data = (multiData as Record<string, { title?: string; bullets?: string[]; tags?: string[]; meta_description?: string; style?: string }>)[activePlatform] || {};

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Same Product</p>
        <p className="text-sm text-text-muted">&quot;Premium 3-Piece Bamboo Cutting Board Set&quot; — optimized differently per platform</p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1 text-primary/50">
          <div className="w-8 h-[2px] bg-gradient-to-r from-violet-300/50 to-violet-500/50" />
          <ChevronRight className="h-4 w-4 text-violet-400" />
        </div>
      </div>

      <div className="rounded-xl bg-white border border-border shadow-sm overflow-hidden">
        {/* Platform tabs */}
        <div className="flex border-b border-border/50">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => { setActivePlatform(p.id); setShowAllBullets(false); }}
              className={cn(
                "flex-1 text-xs font-semibold py-2.5 transition-all cursor-pointer border-b-2",
                activePlatform === p.id
                  ? "border-current"
                  : "border-transparent text-text-muted hover:text-text"
              )}
              style={activePlatform === p.id ? { color: p.color } : undefined}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {/* Style badge */}
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${platforms.find(p => p.id === activePlatform)?.color}15`, color: platforms.find(p => p.id === activePlatform)?.color }}
            >
              {platforms.find(p => p.id === activePlatform)?.style}
            </span>
          </div>

          {/* Title */}
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Title</p>
            <p className="text-xs font-semibold text-secondary leading-snug">{data.title}</p>
          </div>

          {/* Platform-specific content */}
          {data.bullets && data.bullets.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Key Points</p>
              <ul className="space-y-1.5">
                {data.bullets.slice(0, showAllBullets ? data.bullets.length : 3).map((b: string, i: number) => (
                  <li key={i} className="text-[11px] text-text-muted flex gap-1.5 leading-relaxed">
                    <Check className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {data.bullets.length > 3 && (
                <button
                  onClick={() => setShowAllBullets(!showAllBullets)}
                  className="text-[11px] text-primary font-medium mt-2 cursor-pointer hover:underline"
                >
                  {showAllBullets ? "Show less" : `+${data.bullets.length - 3} more`}
                </button>
              )}
            </div>
          )}

          {data.tags && data.tags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Tags ({data.tags.length})</p>
              <div className="flex flex-wrap gap-1">
                {data.tags.map((t: string, i: number) => (
                  <span key={i} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {data.meta_description && (
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">SEO Meta</p>
              <p className="text-[11px] text-text-muted italic">{data.meta_description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdCreativesShowcase() {
  const templates = [
    { name: "Flash Sale", src: "/templates/flash_sale.png" },
    { name: "Black Friday", src: "/templates/black_friday.png" },
    { name: "Premium", src: "/templates/premium.png" },
    { name: "New Arrival", src: "/templates/new_arrival.png" },
  ];
  const results = [
    { name: "Flash Sale", src: "/showcase/creative_flash_sale.png" },
    { name: "New Arrival", src: "/showcase/creative_new_arrival.png" },
    { name: "Premium", src: "/showcase/creative_premium.png" },
    { name: "Comparison", src: "/showcase/creative_comparison.png" },
  ];

  const [activeView, setActiveView] = useState<"templates" | "results">("templates");

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView("templates")}
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer",
            activeView === "templates" ? "bg-primary text-white" : "bg-surface-alt text-text-muted hover:text-text"
          )}
        >
          70+ Templates
        </button>
        <button
          onClick={() => setActiveView("results")}
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer",
            activeView === "results" ? "bg-primary text-white" : "bg-surface-alt text-text-muted hover:text-text"
          )}
        >
          Product Applied
        </button>
      </div>

      {activeView === "templates" && (
        <div className="space-y-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-text-muted">Pick any template style — the AI adapts it to your product with your custom messaging, offers, and branding.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <div key={t.name} className="rounded-lg border border-border overflow-hidden group">
                <div className="aspect-video overflow-hidden bg-surface-alt">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.src} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="p-1.5 text-center">
                  <p className="text-[11px] font-semibold text-text">{t.name}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-muted text-center">+ 130+ more templates across Sale, Launch, Lifestyle, Premium, Social, Industry categories</p>
        </div>
      )}

      {activeView === "results" && (
        <div className="space-y-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-3">
            <div className="w-[60px] flex-shrink-0 rounded-md overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/showcase/input.png" alt="Input" className="w-full h-auto" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Input: Bamboo Cutting Board</p>
              <p className="text-xs text-text-muted">+ offer: &quot;25% off, Code CHOP25, Free Shipping&quot;</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {results.map((r) => (
              <div key={r.name} className="rounded-lg border border-border overflow-hidden group">
                <div className="aspect-video overflow-hidden bg-surface-alt">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.src} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="p-1.5 text-center">
                  <p className="text-[11px] font-semibold text-text">{r.name}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-muted text-center">Same product, custom messaging — applied to different template styles</p>
        </div>
      )}
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────

const SHOWCASES = [
  {
    id: "listing",
    title: "AI Listing Optimizer",
    subtitle: "SEO-optimized titles, bullet points, and descriptions — tailored per platform.",
    icon: Package,
    gradient: "from-blue-500 to-blue-600",
    component: ListingShowcase,
  },
  {
    id: "social",
    title: "Social Content Engine",
    subtitle: "Platform-perfect posts with captions, hashtags, and CTAs — ready to publish.",
    icon: Share2,
    gradient: "from-pink-500 to-rose-600",
    component: SocialShowcase,
  },
  {
    id: "ads",
    title: "Ad Copy Generator",
    subtitle: "A/B test-ready ad variants with proven conversion frameworks.",
    icon: Megaphone,
    gradient: "from-amber-500 to-orange-600",
    component: AdsShowcase,
  },
  {
    id: "creatives",
    title: "Ad Creatives + Templates",
    subtitle: "70+ visual ad templates — upload your product, pick a style, get scroll-stopping creatives.",
    icon: ImageIcon,
    gradient: "from-rose-500 to-red-600",
    component: AdCreativesShowcase,
  },
  {
    id: "research",
    title: "Competitor Intelligence + Market Insights",
    subtitle: "Live market research with keyword analysis and competitor profiling.",
    icon: Search,
    gradient: "from-emerald-500 to-teal-600",
    component: ResearchShowcase,
  },
  {
    id: "multi",
    title: "Multi-Platform Export",
    subtitle: "Same product, optimized differently for Amazon, Etsy, and Shopify.",
    icon: Layers,
    gradient: "from-violet-500 to-purple-600",
    component: MultiPlatformShowcase,
  },
];

function getGradientColors(gradient: string): { from: string; to: string } {
  const colorMap: Record<string, string> = {
    "blue-500": "#3b82f6", "blue-600": "#2563eb",
    "pink-500": "#ec4899", "rose-600": "#e11d48",
    "amber-500": "#f59e0b", "orange-600": "#ea580c",
    "rose-500": "#f43f5e", "red-600": "#dc2626",
    "emerald-500": "#10b981", "teal-600": "#0d9488",
    "violet-500": "#8b5cf6", "purple-600": "#9333ea",
  };
  const fromMatch = gradient.match(/from-(\S+)/);
  const toMatch = gradient.match(/to-(\S+)/);
  return {
    from: colorMap[fromMatch?.[1] ?? ""] ?? "#3b82f6",
    to: colorMap[toMatch?.[1] ?? ""] ?? "#2563eb",
  };
}

export default function FeatureShowcases() {
  const [activeShowcase, setActiveShowcase] = useState(0);

  return (
    <section className="py-24 sm:py-32 bg-surface-alt/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
            See It In Action
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary tracking-tight">
            Real AI-Generated Output
          </h2>
          <p className="mt-5 text-lg text-text-muted leading-relaxed">
            These are actual outputs from ShelfReady — not mockups. Every example was generated by our AI in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Feature selector tabs */}
          <div className="lg:col-span-4 flex flex-col gap-2 min-h-[600px]">
            {SHOWCASES.map((showcase, i) => (
              <button
                key={showcase.id}
                onClick={() => setActiveShowcase(i)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                  activeShowcase === i
                    ? "bg-white border-transparent shadow-lg ring-1 ring-primary/20"
                    : "border-border hover:bg-white hover:shadow-sm"
                )}
                style={activeShowcase === i ? {
                  boxShadow: "0 4px 24px -4px rgba(37, 99, 235, 0.12), 0 0 0 1px rgba(37, 99, 235, 0.08)",
                } : undefined}
              >
                {/* Active tab left accent bar */}
                {activeShowcase === i && (
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-gradient-to-b",
                    showcase.gradient
                  )} />
                )}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-xl p-2.5 bg-gradient-to-br text-white transition-transform duration-200",
                    showcase.gradient,
                    activeShowcase === i ? "scale-110 shadow-md" : "group-hover:scale-105"
                  )}>
                    <showcase.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-semibold transition-colors",
                      activeShowcase === i ? "text-secondary" : "text-text-muted"
                    )}>
                      {showcase.title}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                      {showcase.subtitle}
                    </p>
                  </div>
                  <ArrowRight className={cn(
                    "h-4 w-4 transition-all duration-200",
                    activeShowcase === i
                      ? "text-primary translate-x-0 opacity-100"
                      : "text-text-muted -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50"
                  )} />
                </div>
              </button>
            ))}
          </div>

          {/* Right: Active showcase content */}
          <div className="lg:col-span-8 min-h-[600px]">
            <div className="rounded-2xl border border-border bg-white/50 overflow-hidden min-h-[600px] h-full flex flex-col">
              {/* Colored accent line at top matching active feature gradient */}
              <div className={cn(
                "h-1 w-full bg-gradient-to-r transition-all duration-500",
                SHOWCASES[activeShowcase].gradient
              )} />

              {/* Header with colored background strip */}
              <div className={cn(
                "flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-gradient-to-r",
                `${SHOWCASES[activeShowcase].gradient.replace("from-", "from-").replace("to-", "to-")}`,
              )} style={{
                background: `linear-gradient(to right, ${getGradientColors(SHOWCASES[activeShowcase].gradient).from}08, ${getGradientColors(SHOWCASES[activeShowcase].gradient).to}05)`,
              }}>
                <div className={cn(
                  "rounded-xl p-2.5 bg-gradient-to-br text-white shadow-md",
                  SHOWCASES[activeShowcase].gradient
                )}>
                  {(() => {
                    const Icon = SHOWCASES[activeShowcase].icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary">
                    {SHOWCASES[activeShowcase].title}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {SHOWCASES[activeShowcase].subtitle}
                  </p>
                </div>
              </div>

              {/* Content with fade animation */}
              <div
                className="p-6 flex-1"
                key={activeShowcase}
                style={{ animation: "showcaseFadeIn 0.3s ease-out" }}
              >
                {(() => {
                  const Component = SHOWCASES[activeShowcase].component;
                  return <Component />;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
