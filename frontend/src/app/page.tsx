"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/constants";
import allTemplates from "@/lib/creative-templates.json";
import {
  ArrowRight, Check, Star, Package, Camera, Megaphone,
  Share2, Search, Layers, Sparkles, Play, ChevronRight, X,
} from "lucide-react";

/* ── Data ──────────────────────────────────────────────────────────── */
const TOOL_SLIDES = [
  {
    id: "listing", label: "Listing Optimizer", icon: Package, color: "#3b82f6", tag: "Amazon · Etsy · Shopify",
    steps: ["Analyzing product keywords...", "Optimizing for A9 algorithm...", "Generating SEO title...", "Writing 5 bullet points...", "Creating HTML description...", "Extracting backend keywords..."],
    output: {
      type: "listing",
      title: "Premium Organic Bamboo Cutting Board Set — 3 Piece Kitchen Chopping Boards with Deep Juice Grooves, Anti-Slip Rubber Feet, BPA-Free & Knife-Friendly, Eco-Friendly Gift for Home Chefs",
      bullets: [
        "VERSATILE 3-PIECE SET: Includes Large (18×12\"), Medium (14×10\"), and Small (10×7\") for every kitchen task",
        "HEALTHIER COOKING: 100% organic moso bamboo, naturally antimicrobial, BPA-free and food-safe",
        "MESS-FREE PREP: Deep juice grooves catch liquids, non-slip rubber feet keep boards stable",
        "ECO-CONSCIOUS: Sustainable bamboo is biodegradable and renewable, recyclable packaging",
        "PERFECT GIFT: Ideal for housewarming, weddings, holidays — dishwasher safe, oil occasionally",
      ],
      keywords: ["bamboo cutting board", "cutting board set 3 piece", "organic kitchen", "juice groove board", "eco kitchen tools", "knife friendly", "housewarming gift", "meal prep board"],
      description: "<b>Elevate Your Kitchen</b><br>Transform meal prep with premium organic bamboo...",
      platforms: { amazon: "A9 optimized · 200 char title", etsy: "13 long-tail tags · story description", shopify: "SEO meta · conversion copy" },
    },
  },
  {
    id: "photoshoot", label: "Product Photoshoot", icon: Camera, color: "#8b5cf6", tag: "5 pro shots from 1 photo",
    steps: ["Analyzing product shape & color...", "Detecting product category: kitchen...", "Selecting AI model: female, lifestyle...", "Generating studio shot...", "Generating lifestyle scene...", "Generating model + product shot..."],
    output: {
      type: "images",
      images: [
        { src: "/showcase/studio.png", label: "Studio" },
        { src: "/showcase/model.png", label: "With Model" },
        { src: "/showcase/outdoor.png", label: "Lifestyle" },
        { src: "/showcase/context.png", label: "In Context" },
      ],
      input: "/showcase/input.png",
    },
  },
  {
    id: "ads", label: "Ad Creatives", icon: Megaphone, color: "#f59e0b", tag: "200+ templates",
    steps: ["Analyzing product for ad context...", "Matching template: Flash Sale...", "Compositing product into template...", "Adding text overlays: 25% OFF...", "Generating variant: New Arrival...", "Generating variant: Premium..."],
    output: {
      type: "creatives",
      images: [
        { src: "/showcase/creative_flash_sale.png", label: "Flash Sale" },
        { src: "/showcase/creative_new_arrival.png", label: "New Arrival" },
        { src: "/showcase/creative_premium.png", label: "Premium" },
        { src: "/showcase/creative_comparison.png", label: "Comparison" },
      ],
      input: "/showcase/input.png",
    },
  },
  {
    id: "social", label: "Social Content", icon: Share2, color: "#ec4899", tag: "IG · FB · Pinterest",
    steps: ["Crafting Instagram hook...", "Generating 25 tiered hashtags...", "Writing engagement CTA...", "Adapting for Facebook...", "Creating Pinterest pin description...", "Optimizing for each algorithm..."],
    output: {
      type: "social",
      platforms: [
        { name: "Instagram", handle: "@ecochop_kitchen", caption: "There's something magical about cooking with tools that love the planet back. 🌿\n\nOur bamboo cutting board set brings warmth and sustainability to your kitchen counter. Crafted from organic bamboo, these beauties are naturally antibacterial and gentle on your knives.", hashtags: "#ecokitchen #sustainableliving #bamboo #handmade #shopsmall #kitchenessentials #mealprep #organickitchen #ecofriendly #homecooking", cta: "🔗 Link in bio — 25% off with code CHOP25" },
        { name: "Facebook", caption: "Is your plastic cutting board scratched up and harboring bacteria? Time to upgrade. 🪵\n\nOur organic bamboo set is naturally antimicrobial, knife-friendly, and actually looks good on your counter.", cta: "Shop now → Free shipping over $30" },
        { name: "Pinterest", caption: "Premium Organic Bamboo Cutting Board Set — the eco-friendly kitchen essential every home cook needs. Deep juice grooves, anti-slip feet, and beautiful enough to display. Perfect housewarming gift.", cta: "Save this pin · Shop the set" },
      ],
    },
  },
  {
    id: "research", label: "Market Insights", icon: Search, color: "#10b981", tag: "Live competitive intel",
    steps: ["Searching DuckDuckGo for market data...", "Analyzing 72 search results...", "Identifying top 5 competitors...", "Extracting keyword gaps...", "Calculating pricing intelligence...", "Generating actionable recommendations..."],
    output: {
      type: "research",
      analysis: "The bamboo cutting board market on Amazon is valued at $400-500M annually with 18-22% YoY growth in the eco-friendly segment.",
      competitors: [
        { name: "Lipper International", price: "$25-35", weakness: "No juice grooves" },
        { name: "Bambu", price: "$40-55", weakness: "Single piece only" },
        { name: "Royal Craft Wood", price: "$18-30", weakness: "Not organic certified" },
      ],
      keywords: ["bamboo cutting board", "eco kitchen", "organic cutting board set", "knife friendly board", "wooden chopping board", "housewarming gift kitchen", "BPA free cutting board", "juice groove board"],
      opportunity: "No competitor combines organic certification + 3-piece set + juice grooves under $35",
    },
  },
  {
    id: "multi", label: "Multi-Platform", icon: Layers, color: "#6366f1", tag: "1 product → 3 platforms",
    steps: ["Generating Amazon A9-optimized listing...", "Adapting to Etsy storytelling format...", "Creating Shopify conversion copy...", "Extracting 13 Etsy long-tail tags...", "Writing Shopify meta description...", "Generating backend keywords..."],
    output: {
      type: "multiplatform",
      platforms: [
        { name: "Amazon", style: "Keyword-dense · A9 optimized", title: "Premium Organic Bamboo Cutting Board Set — 3 Piece with Juice Grooves & Anti-Slip Feet", detail: "200 char title · 5 CAPS bullets · HTML description · 15 backend keywords" },
        { name: "Etsy", style: "Story-driven · 13 tags", title: "Handmade Bamboo Cutting Board Set | Organic Kitchen Gift | Eco-Friendly Chopping Board", detail: "140 char title · storytelling description · 13 long-tail tags" },
        { name: "Shopify", style: "Conversion-focused · SEO meta", title: "EcoChop Bamboo Cutting Board Set | Organic Kitchen Essentials", detail: "60 char SEO title · meta description · landing page copy · 6 selling points" },
      ],
    },
  },
];

/* ── 6-Tool Interactive Demo with Streaming ───────────────────────── */
function ToolDemo() {
  const [active, setActive] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [phase, setPhase] = useState<"streaming" | "output">("streaming");
  const [streamStep, setStreamStep] = useState(0);

  const tool = TOOL_SLIDES[active];

  // Auto-advance tools
  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => setActive((a) => (a + 1) % TOOL_SLIDES.length), 10000);
    return () => clearInterval(t);
  }, [autoPlay]);

  // Streaming phase
  useEffect(() => {
    setPhase("streaming");
    setStreamStep(0);
    const steps = tool.steps.length;
    // Stream each step
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < steps; i++) {
      timers.push(setTimeout(() => setStreamStep(i + 1), 180 * (i + 1)));
    }
    // Switch to output after all steps
    timers.push(setTimeout(() => setPhase("output"), 180 * steps + 420));
    return () => timers.forEach(clearTimeout);
  }, [active, tool.steps.length]);

  const TIcon = tool.icon;

  return (
    <section className="py-24 px-4 bg-white border-y border-neutral-200/60">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-[13px] font-bold text-[#2563eb] uppercase tracking-wider mb-2">See it in action</p>
          <h2 className="text-[2.25rem] sm:text-[2.75rem] font-extrabold tracking-[-0.03em]">Six AI tools. Real output.</h2>
          <p className="mt-3 text-neutral-500 max-w-md mx-auto">Click any tool to watch ShelfReady generate content from a single product.</p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4 items-stretch">
          {/* Left — 6 Tool tabs */}
          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:justify-between" style={{ height: "600px" }}>
            {TOOL_SLIDES.map((t, i) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => { setActive(i); setAutoPlay(false); }}
                  className={`flex items-center gap-3 px-4 rounded-xl text-left transition-all cursor-pointer flex-shrink-0 lg:w-full lg:flex-1 ${
                    active === i ? "bg-white border border-neutral-200 shadow-lg" : "hover:bg-neutral-50 border border-transparent"
                  }`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: active === i ? t.color : "#f0f0f0" }}>
                    <Icon className={`h-4 w-4 ${active === i ? "text-white" : "text-neutral-400"}`} />
                  </div>
                  <div className="min-w-0 hidden lg:block">
                    <p className={`text-[13px] font-bold truncate ${active === i ? "text-neutral-900" : "text-neutral-500"}`}>{t.label}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{t.tag}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right — Streaming output */}
          <div>
            <div className="bg-[#0c0c0c] rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ height: "600px" }}>
              {/* Header */}
              <div className="px-4 py-2.5 flex items-center justify-between bg-[#141414] border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${tool.color}25` }}>
                    <TIcon className="h-3.5 w-3.5" style={{ color: tool.color }} />
                  </div>
                  <span className="text-[13px] font-bold text-white">{tool.label}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${tool.color}15`, color: tool.color }}>{tool.tag}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${phase === "streaming" ? "bg-amber-400 animate-pulse" : "bg-[#2563eb]"}`} />
                  <span className="text-[10px] text-neutral-500 font-mono">{phase === "streaming" ? "generating..." : "complete"}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1" key={active}>
                {/* Input prompt */}
                <div className="flex gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px]">👤</span>
                  </div>
                  <div className="bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5 flex-1">
                    <p className="text-[12px] text-neutral-400">Generate {tool.label.toLowerCase()} for: <span className="text-neutral-200">Organic Bamboo Cutting Board Set — 3-piece, juice grooves, anti-slip feet, $34.99</span></p>
                  </div>
                </div>

                {/* Streaming steps */}
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${tool.color}20` }}>
                    <Sparkles className="h-3 w-3" style={{ color: tool.color }} />
                  </div>
                  <div className="flex-1 space-y-2">
                    {/* Stream steps */}
                    {phase === "streaming" && (
                      <div className="space-y-1.5">
                        {tool.steps.slice(0, streamStep).map((step, i) => (
                          <p key={i} className="text-[11px] text-neutral-500 fade-slide" style={{ animationDelay: `${i * 0.05}s` }}>
                            <span className="text-[#2563eb]">✓</span> {step}
                          </p>
                        ))}
                        {streamStep < tool.steps.length && (
                          <div className="flex items-center gap-1.5">
                            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-neutral-600 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Output */}
                    {phase === "output" && (
                      <div className="space-y-3 fade-slide">
                        {/* Listing output */}
                        {tool.output.type === "listing" && (
                          <>
                            <div className="bg-white/5 border border-white/8 rounded-xl p-3.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: tool.color }}>Optimized Title</p>
                              <p className="text-[13px] font-semibold text-neutral-200 leading-snug">{tool.output.title as string}</p>
                            </div>
                            <div className="bg-white/5 border border-white/8 rounded-xl p-3.5 space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: tool.color }}>5 Bullet Points</p>
                              {((tool.output as any).bullets || []).map((b: string, i: number) => (
                                <p key={i} className="text-[11px] text-neutral-400 flex gap-1.5"><Check className="h-3 w-3 text-[#2563eb] flex-shrink-0 mt-0.5" />{b}</p>
                              ))}
                            </div>
                            <div className="bg-white/5 border border-white/8 rounded-xl p-3.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: tool.color }}>Backend Keywords</p>
                              <div className="flex flex-wrap gap-1">
                                {((tool.output as any).keywords || []).map((k: string) => <span key={k} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{k}</span>)}
                              </div>
                            </div>
                            <div className="bg-white/5 border border-white/8 rounded-xl p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: tool.color }}>Platform Versions</p>
                              <div className="grid grid-cols-3 gap-2">
                                {Object.entries((tool.output as any).platforms || {}).map(([k, v]) => (
                                  <div key={k} className="text-center">
                                    <p className="text-[11px] font-bold text-neutral-300 capitalize">{k}</p>
                                    <p className="text-[9px] text-neutral-500">{v as string}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Images output (photoshoot + creatives) */}
                        {(tool.output.type === "images" || tool.output.type === "creatives") && (
                          <>
                            {/* Input → Output grid: input as first card, outputs follow */}
                            <div className="grid grid-cols-5 gap-2">
                              {/* Input card */}
                              <div className="rounded-lg overflow-hidden border border-dashed border-white/20 fade-slide">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={(tool.output as any).input} alt="Input" className="w-full aspect-square object-cover" />
                                <div className="bg-white/5 px-2 py-1"><p className="text-[10px] text-neutral-500 font-medium">Input</p></div>
                              </div>
                              {/* Output cards */}
                              {((tool.output as any).images || []).map((img: { src: string; label: string }, i: number) => (
                                <div key={i} className="rounded-lg overflow-hidden border border-white/10 fade-slide" style={{ animationDelay: `${i * 0.12}s` }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={img.src} alt={img.label} className="w-full aspect-square object-cover" />
                                  <div className="bg-white/5 px-2 py-1"><p className="text-[10px] text-neutral-400 font-medium">{img.label}</p></div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Social output */}
                        {tool.output.type === "social" && (
                          <div className="space-y-2.5">
                            {((tool.output as any).platforms || []).map((p: { name: string; handle?: string; caption: string; hashtags?: string; cta: string }, i: number) => (
                              <div key={p.name} className="bg-white/5 border border-white/8 rounded-xl p-3 fade-slide" style={{ animationDelay: `${i * 0.15}s` }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${tool.color}15`, color: tool.color }}>{p.name}</span>
                                  {p.handle && <span className="text-[10px] text-neutral-500">{p.handle}</span>}
                                </div>
                                <p className="text-[11px] text-neutral-400 leading-relaxed whitespace-pre-line">{p.caption.slice(0, 120)}...</p>
                                {p.hashtags && <p className="text-[10px] text-blue-400 mt-1">{p.hashtags.slice(0, 80)}...</p>}
                                <p className="text-[10px] text-neutral-500 mt-1.5 font-medium">{p.cta}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Research output */}
                        {tool.output.type === "research" && (
                          <>
                            <div className="bg-white/5 border border-white/8 rounded-xl p-3.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: tool.color }}>Market Analysis</p>
                              <p className="text-[12px] text-neutral-400 leading-relaxed">{(tool.output as any).analysis}</p>
                            </div>
                            <div className="bg-white/5 border border-white/8 rounded-xl p-3.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: tool.color }}>Top Competitors</p>
                              {((tool.output as any).competitors || []).map((c: { name: string; price: string; weakness: string }) => (
                                <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                                  <span className="text-[11px] font-semibold text-neutral-300">{c.name}</span>
                                  <span className="text-[10px] text-neutral-500">{c.price}</span>
                                  <span className="text-[10px] text-amber-400">{c.weakness}</span>
                                </div>
                              ))}
                            </div>
                            <div className="bg-white/5 border border-white/8 rounded-xl p-3.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: tool.color }}>Keywords ({((tool.output as any).keywords || []).length})</p>
                              <div className="flex flex-wrap gap-1">
                                {((tool.output as any).keywords || []).map((k: string) => <span key={k} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{k}</span>)}
                              </div>
                            </div>
                            <div className="bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-xl p-3">
                              <p className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider mb-1">Opportunity</p>
                              <p className="text-[11px] text-neutral-300">{(tool.output as any).opportunity}</p>
                            </div>
                          </>
                        )}

                        {/* Multi-platform output */}
                        {tool.output.type === "multiplatform" && (
                          <div className="space-y-2.5">
                            {((tool.output as any).platforms || []).map((p: { name: string; style: string; title: string; detail: string }, i: number) => (
                              <div key={p.name} className="bg-white/5 border border-white/8 rounded-xl p-3.5 fade-slide" style={{ animationDelay: `${i * 0.15}s` }}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[12px] font-bold text-white">{p.name}</span>
                                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${tool.color}15`, color: tool.color }}>{p.style}</span>
                                </div>
                                <p className="text-[12px] text-neutral-300 leading-snug mb-1">{p.title}</p>
                                <p className="text-[10px] text-neutral-500">{p.detail}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Streaming Hero Demo ───────────────────────────────────────────── */
function HeroDemo({ slide, setSlide, autoRef }: { slide: number; setSlide: (n: number) => void; autoRef: React.MutableRefObject<boolean> }) {
  const [phase, setPhase] = useState<"input" | "generating" | "output">("input");
  const [genProgress, setGenProgress] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const current = TOOL_SLIDES[slide];

  // Reset phases when slide changes
  useEffect(() => {
    setPhase("input");
    setGenProgress(0);
    setTypedChars(0);

    // Phase 1: Show input for 0.6s
    const t1 = setTimeout(() => setPhase("generating"), 600);
    // Phase 2: Generating animation for 1.4s, then output
    const t2 = setTimeout(() => setPhase("output"), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [slide]);

  // Progress bar during generating phase
  useEffect(() => {
    if (phase !== "generating") return;
    const interval = setInterval(() => {
      setGenProgress((p) => Math.min(p + 1, 100));
    }, 14);
    return () => clearInterval(interval);
  }, [phase]);

  // Typing effect for listing text
  useEffect(() => {
    if (phase !== "output" || current.output.type !== "listing") return;
    const text = (current.output as any).title;
    if (typedChars >= text.length) return;
    const t = setTimeout(() => setTypedChars((c) => c + 1), 12);
    return () => clearTimeout(t);
  }, [phase, typedChars, current]);

  return (
    <div className="bg-[#0f0f0f] rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] overflow-hidden">
      {/* Terminal-style header */}
      <div className="px-4 py-2.5 flex items-center gap-2 bg-[#1a1a1a]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-[11px] text-neutral-500 font-mono">ShelfReady AI</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse" />
      </div>

      {/* Tool selector */}
      <div className="px-3 pt-2.5 pb-1 flex gap-1 border-b border-white/5">
        {TOOL_SLIDES.map((t, i) => (
          <button key={t.label} onClick={() => { setSlide(i); autoRef.current = false; }}
            className={`relative px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              slide === i ? "text-white bg-white/10" : "text-neutral-500 hover:text-neutral-300"
            }`}>
            {t.label}
            {slide === i && <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: t.color }} />}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="p-4 min-h-[330px]">
        {/* Phase: Input */}
        {phase === "input" && (
          <div className="space-y-3 animate-[fadeSlide_0.3s_ease-out]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#2563eb]/20 flex items-center justify-center">
                <span className="text-[10px]">👤</span>
              </div>
              <span className="text-[12px] text-neutral-400">You</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <p className="text-[13px] text-neutral-300 leading-relaxed">
                Generate {current.label.toLowerCase()} for my organic bamboo cutting board set — 3-piece, juice grooves, anti-slip feet. Price $34.99. Target: home cooks.
              </p>
            </div>
          </div>
        )}

        {/* Phase: Generating */}
        {phase === "generating" && (
          <div className="space-y-4 animate-[fadeSlide_0.3s_ease-out]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${current.color}30` }}>
                <Sparkles className="h-3 w-3" style={{ color: current.color }} />
              </div>
              <span className="text-[12px] text-neutral-400">ShelfReady AI</span>
              <span className="text-[10px] text-neutral-600 ml-auto font-mono">generating...</span>
            </div>

            {/* Thinking dots */}
            <div className="flex items-center gap-1.5 px-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-neutral-600 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>

            {/* Progress bar */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-neutral-500">{current.label}</span>
                <span className="text-[11px] font-mono" style={{ color: current.color }}>{genProgress}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-75" style={{ width: `${genProgress}%`, background: current.color }} />
              </div>
            </div>

            {/* Streaming tokens */}
            <div className="bg-white/5 rounded-lg p-3 space-y-1.5">
              {genProgress > 20 && <p className="text-[11px] text-neutral-500 animate-[fadeSlide_0.3s_ease-out]">✓ Analyzing product details...</p>}
              {genProgress > 45 && <p className="text-[11px] text-neutral-500 animate-[fadeSlide_0.3s_ease-out]">✓ Optimizing for target audience...</p>}
              {genProgress > 70 && <p className="text-[11px] animate-[fadeSlide_0.3s_ease-out]" style={{ color: current.color }}>⟳ Generating {current.label.toLowerCase()}...</p>}
              {genProgress > 90 && <p className="text-[11px] text-neutral-500 animate-[fadeSlide_0.3s_ease-out]">✓ Finalizing output...</p>}
            </div>
          </div>
        )}

        {/* Phase: Output */}
        {phase === "output" && (
          <div className="space-y-3 animate-[fadeSlide_0.4s_ease-out]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${current.color}30` }}>
                <Sparkles className="h-3 w-3" style={{ color: current.color }} />
              </div>
              <span className="text-[12px] text-neutral-400">ShelfReady AI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto" style={{ background: `${current.color}20`, color: current.color }}>
                {current.tag}
              </span>
            </div>

            {/* Images — photoshoots + creatives */}
            {(current.output.type === "images" || current.output.type === "creatives") && (
              <div className="grid grid-cols-4 gap-2">
                {((current.output as any).images || []).map((img: { src: string; label: string }, i: number) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-white/10 animate-[fadeSlide_0.4s_ease-out]" style={{ animationDelay: `${i * 0.15}s` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.label} className="w-full aspect-square object-cover" />
                    <div className="bg-white/5 px-2 py-1"><p className="text-[10px] text-neutral-400">{img.label}</p></div>
                  </div>
                ))}
              </div>
            )}

            {/* Listing — typing effect */}
            {current.output.type === "listing" && (
              <div className="space-y-2">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: current.color }}>Optimized Title</p>
                  <p className="text-[13px] text-neutral-200 font-semibold leading-snug">
                    {(current.output as any).title.slice(0, typedChars)}
                    {typedChars < (current.output as any).title.length && <span className="inline-block w-0.5 h-4 bg-white/60 animate-pulse ml-0.5 align-middle" />}
                  </p>
                </div>
                {typedChars >= (current.output as any).title.length && (current.output as any).bullets.map((b: string, i: number) => (
                  <div key={i} className="flex gap-2 text-[12px] text-neutral-400 animate-[fadeSlide_0.3s_ease-out] px-1" style={{ animationDelay: `${i * 0.12}s` }}>
                    <Check className="h-3.5 w-3.5 text-[#2563eb] flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Social — stream in */}
            {current.output.type === "social" && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
                  <span className="text-[12px] font-bold text-neutral-300">{((current.output as any).platforms?.[0])?.handle}</span>
                  <span className="text-[9px] bg-pink-500/20 text-pink-400 font-bold px-1.5 py-0.5 rounded-full ml-auto">IG</span>
                </div>
                <p className="text-[12px] text-neutral-400 leading-relaxed">{((current.output as any).platforms?.[0])?.caption}</p>
                <p className="text-[10px] text-blue-400 mt-2">{((current.output as any).platforms?.[0])?.hashtags}</p>
              </div>
            )}

            {/* Research */}
            {current.output.type === "research" && (
              <div className="space-y-2">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: current.color }}>Market Analysis</p>
                  <p className="text-[12px] text-neutral-400 leading-relaxed">{((current.output as any).analysis || "").slice(0, 180)}...</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: current.color }}>Top Competitors</p>
                  {((current.output as any).competitors || []).slice(0, 3).map((c: { name: string; price: string; weakness: string }, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-white/5 last:border-0">
                      <span className="text-neutral-300 font-medium">{c.name}</span>
                      <span className="text-neutral-500">{c.price}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {((current.output as any).keywords || []).slice(0, 6).map((k: string) => (
                    <span key={k} className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-platform */}
            {current.output.type === "multiplatform" && (
              <div className="space-y-2">
                {((current.output as any).platforms || []).map((p: { name: string; style: string; title: string; detail: string }, i: number) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 animate-[fadeSlide_0.3s_ease-out]" style={{ animationDelay: `${i * 0.12}s` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${current.color}15`, color: current.color }}>{p.name}</span>
                      <span className="text-[9px] text-neutral-500">{p.style}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 font-medium">{p.title}</p>
                    <p className="text-[9px] text-neutral-500 mt-0.5">{p.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const plans_data = [
  { key: "starter", name: "Starter", price: PLANS.starter.priceMonthly, yearly: PLANS.starter.priceYearly, features: PLANS.starter.features.slice(0, 5), cta: "Start free trial" },
  { key: "pro", name: "Pro", price: PLANS.pro.priceMonthly, yearly: PLANS.pro.priceYearly, features: PLANS.pro.features.slice(0, 6), popular: true, cta: "Start free trial" },
  { key: "business", name: "Business", price: PLANS.business.priceMonthly, yearly: PLANS.business.priceYearly, features: PLANS.business.features.slice(0, 6), cta: "Start free trial" },
];

const templates = (allTemplates as { id: string; category: string; name: string; preview: string }[]);

/* ── Page ──────────────────────────────────────────────────────────── */
export default function Landing() {
  const [annual, setAnnual] = useState(false);
  const [slide, setSlide] = useState(0);
  const [tplCat, setTplCat] = useState("all");
  const [tplPreview, setTplPreview] = useState<string | null>(null);
  const autoRef = useRef(true);

  useEffect(() => {
    const t = setInterval(() => {
      if (autoRef.current) setSlide((s) => (s + 1) % TOOL_SLIDES.length);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const current = TOOL_SLIDES[slide];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-neutral-900">
      <style>{`
        @keyframes bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .bar-anim{animation:bar 4s linear both;transform-origin:left}
        .fade-slide{animation:fadeSlide .4s ease-out both}
      `}</style>

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#fafaf9]/80 backdrop-blur-2xl">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="ShelfReady" className="h-8 w-8 rounded-[10px]" />
            <span className="text-[17px] font-bold tracking-[-0.02em]">ShelfReady</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-[14px] text-neutral-500 font-medium">
            <a href="#demo" className="hover:text-neutral-900 transition-colors">Product</a>
            <a href="#templates" className="hover:text-neutral-900 transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-neutral-900 transition-colors">Pricing</a>
            <Link href="/blog" className="hover:text-neutral-900 transition-colors">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[14px] font-medium text-neutral-500 hover:text-neutral-900 hidden sm:block">Log in</Link>
            <Link href="/signup" className="text-[14px] font-semibold bg-[#2563eb] text-white px-5 py-2 rounded-full hover:bg-[#1d4ed8] transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO — Headline left, Product demo right                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="pt-32 sm:pt-40 pb-4 px-6">
        <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#2563eb]/5 border border-[#2563eb]/15 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse" />
              <span className="text-[13px] font-semibold text-[#2563eb]">Now in public beta</span>
            </div>

            <h1 className="text-[clamp(2.4rem,5.5vw,3.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Product in.
              <br />
              <span className="text-[#2563eb]">Sales content out.</span>
            </h1>

            <p className="mt-5 text-[17px] text-neutral-500 leading-[1.6] max-w-[440px]">
              One photo or description → AI generates listings, professional photos, ad creatives, and social posts. For Amazon, Etsy, and Shopify.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link href="/signup" className="group flex items-center gap-2 bg-[#2563eb] text-white pl-5 pr-4 py-3 rounded-full text-[15px] font-semibold hover:bg-[#1d4ed8] transition-all shadow-[0_2px_20px_-4px_rgba(25,49,83,0.4)]">
                Generate your first listing
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-5 text-[13px] text-neutral-400">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2563eb]" /> Free to start</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2563eb]" /> No credit card</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2563eb]" /> Cancel anytime</span>
            </div>

            {/* Mini social proof */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#fafaf9] bg-neutral-200" />)}
              </div>
              <div>
                <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-[12px] text-neutral-400">Loved by 10,000+ sellers</p>
              </div>
            </div>
          </div>

          {/* Right — Streaming AI Generation Demo */}
          <div id="demo" className="relative hidden lg:block">
            <HeroDemo slide={slide} setSlide={setSlide} autoRef={autoRef} />
          </div>
        </div>

        {/* Logos */}
        <div className="max-w-[1200px] mx-auto mt-20 pb-6 flex items-center justify-center gap-10 border-b border-neutral-200/60">
          {["Amazon", "Etsy", "Shopify", "eBay", "Walmart"].map(n => (
            <span key={n} className="text-[14px] font-bold tracking-tight text-neutral-300 hover:text-neutral-500 transition-colors cursor-default">{n}</span>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-16">
            <p className="text-[13px] font-bold text-[#2563eb] uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-[2.25rem] sm:text-[2.75rem] font-extrabold tracking-[-0.03em]">Three steps. Under a minute.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "01", t: "Describe or upload", d: "Enter product details or drop a photo.", img: "/showcase/input.png" },
              { n: "02", t: "AI generates everything", d: "Listings, photos, ads, social — per platform.", img: "/showcase/studio.png" },
              { n: "03", t: "Publish and sell", d: "Export to Amazon, Etsy, Shopify. Go live.", img: "/showcase/creative_flash_sale.png" },
            ].map(s => (
              <div key={s.n} className="group">
                <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white hover:shadow-xl transition-shadow">
                  <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.img} alt={s.t} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                  </div>
                  <div className="p-5">
                    <span className="text-[11px] font-bold text-neutral-300 tracking-widest">{s.n}</span>
                    <h3 className="text-[16px] font-bold tracking-[-0.01em] mt-1">{s.t}</h3>
                    <p className="text-[14px] text-neutral-500 mt-1">{s.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 6-TOOL DEMO CAROUSEL                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <ToolDemo />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CREATIVE TEMPLATES                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="templates" className="py-24 px-6 bg-white border-y border-neutral-200/60">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-[13px] font-bold text-[#2563eb] uppercase tracking-wider mb-2">200+ ad templates</p>
              <h2 className="text-[2.25rem] sm:text-[2.75rem] font-extrabold tracking-[-0.03em]">Creatives that convert.</h2>
              <p className="mt-2 text-neutral-500 max-w-md">Pick a template, upload your product, add your offer — get scroll-stopping ad creatives in seconds.</p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[{id:"all",l:"All"},{id:"sale",l:"Sale"},{id:"pastel",l:"Pastel"},{id:"minimalist",l:"Minimal"},{id:"genz",l:"Gen Z"},{id:"millennial",l:"Millennial"},{id:"lifestyle",l:"Lifestyle"},{id:"luxury",l:"Premium"}].map(c => (
                <button key={c.id} onClick={() => setTplCat(c.id)} className={`text-[12px] font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all ${tplCat === c.id ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500 hover:text-neutral-900"}`}>{c.l}</button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {templates.filter(t => tplCat === "all" || t.category === tplCat).slice(0, 32).map(t => (
              <button key={t.id} onClick={() => setTplPreview(t.preview)} className="rounded-lg overflow-hidden border border-neutral-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-[#2563eb]/40 transition-all cursor-pointer group">
                <div className="aspect-video overflow-hidden bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.preview} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                </div>
              </button>
            ))}
          </div>

          {/* Before → After */}
          <div className="mt-12 bg-[#fafaf9] rounded-2xl border border-neutral-200 p-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-24 flex-shrink-0">
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-2 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/showcase/input.png" alt="Input" className="w-full rounded-md" />
              </div>
              <p className="text-[10px] text-neutral-400 text-center mt-1 font-semibold">Your photo</p>
            </div>
            <ArrowRight className="h-5 w-5 text-neutral-300 flex-shrink-0 hidden sm:block" />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[{s:"/showcase/creative_flash_sale.png",l:"Flash Sale"},{s:"/showcase/creative_new_arrival.png",l:"New Arrival"},{s:"/showcase/creative_premium.png",l:"Premium"},{s:"/showcase/creative_comparison.png",l:"Comparison"}].map(c => (
                <div key={c.l} className="rounded-lg overflow-hidden border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.s} alt={c.l} className="w-full" />
                  <p className="text-[10px] text-neutral-500 text-center py-1 font-medium bg-white">{c.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SOCIAL PROOF                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-neutral-900 text-white">
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[{v:"30s",l:"Avg. time"},{v:"200+",l:"Ad templates"},{v:"6-in-1",l:"Platform"},{v:"$174",l:"Saved/mo"}].map(m => (
              <div key={m.l} className="text-center">
                <p className="text-[2.5rem] sm:text-[3rem] font-extrabold tracking-tight">{m.v}</p>
                <p className="text-[13px] text-neutral-500 mt-1">{m.l}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {q:"Replaced 3 tools I was paying $120/month for. Photoshoots alone are worth it.",n:"Sarah M.",r:"Etsy · 4,200 sales"},
              {q:"Generated my entire launch in 20 minutes — listings, images, ads, social. All of it.",n:"James K.",r:"Amazon FBA · 6 figures"},
              {q:"The ad templates are better than what our agency made. And they're instant.",n:"Priya R.",r:"Shopify store owner"},
            ].map(t => (
              <div key={t.n} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
                <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-[14px] text-neutral-300 leading-relaxed">&ldquo;{t.q}&rdquo;</p>
                <div className="mt-4"><p className="text-[13px] font-semibold">{t.n}</p><p className="text-[11px] text-neutral-500">{t.r}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PRICING                                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-[2.25rem] sm:text-[2.75rem] font-extrabold tracking-[-0.03em]">Simple pricing</h2>
          <p className="mt-2 text-neutral-500">Start free. Upgrade when you grow.</p>

          <div className="mt-5 inline-flex items-center bg-neutral-100 rounded-full p-1">
            <button onClick={() => setAnnual(false)} className={`text-[13px] font-semibold px-5 py-1.5 rounded-full cursor-pointer transition-all ${!annual ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`text-[13px] font-semibold px-5 py-1.5 rounded-full cursor-pointer transition-all flex items-center gap-1.5 ${annual ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"}`}>
              Yearly <span className="text-[10px] text-[#2563eb] font-bold">-20%</span>
            </button>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-4 text-left">
            {plans_data.map(p => (
              <div key={p.key} className={`relative bg-white rounded-2xl p-6 transition-all ${p.popular ? "border-2 border-[#2563eb] shadow-[0_8px_40px_-12px_rgba(206,164,52,0.15)] scale-[1.02]" : "border border-neutral-200 hover:shadow-lg"}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563eb] text-[#1e3a5f] text-[11px] font-bold px-4 py-1 rounded-full">Most popular</div>}
                <p className="text-[16px] font-bold">{p.name}</p>
                <div className="mt-2 mb-4">
                  <span className="text-[2.5rem] font-extrabold tracking-tight">${annual ? Math.round(p.yearly / 12) : p.price}</span>
                  <span className="text-neutral-400 text-[14px]">/mo</span>
                </div>
                <Link href="/signup" className={`block text-center py-2.5 rounded-xl text-[14px] font-semibold transition-all ${p.popular ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]" : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}>{p.cta}</Link>
                <ul className="mt-5 space-y-2">
                  {p.features.map(f => <li key={f} className="flex items-start gap-2 text-[13px] text-neutral-600"><Check className="h-4 w-4 text-[#2563eb] flex-shrink-0 mt-0.5" />{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-neutral-400 mt-6">Free plan — 5 listings/mo, 5 images, social posts &amp; ad copies. <Link href="/signup" className="text-[#2563eb] hover:underline font-medium">Start free →</Link></p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CTA                                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-[#0f172a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[2rem] sm:text-[2.5rem] font-extrabold tracking-[-0.03em] text-white">Stop creating content manually.</h2>
          <p className="mt-3 text-blue-100 text-[16px]">Let AI generate everything in under a minute.</p>
          <Link href="/signup" className="group inline-flex items-center gap-2 mt-8 bg-white text-[#1e3a5f] px-8 py-3.5 rounded-full text-[15px] font-bold hover:bg-blue-50 transition-colors shadow-xl">
            Generate your first listing <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-4 text-[13px] text-blue-200/60">Free. No credit card required.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-neutral-200/60 bg-[#fafaf9]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/logo-icon.png" alt="ShelfReady" className="h-6 w-6 rounded-md" /><span className="text-[13px] font-bold">ShelfReady</span></div>
          <div className="flex items-center gap-6 text-[13px] text-neutral-400 font-medium">
            <Link href="/pricing" className="hover:text-neutral-600">Pricing</Link>
            <Link href="/blog" className="hover:text-neutral-600">Blog</Link>
            <Link href="/login" className="hover:text-neutral-600">Log in</Link>
            <Link href="/terms" className="hover:text-neutral-600">Terms</Link>
            <Link href="/privacy" className="hover:text-neutral-600">Privacy</Link>
          </div>
          <p className="text-[11px] text-neutral-300">© 2026 ShelfReady</p>
        </div>
      </footer>

      {/* Template preview modal */}
      {tplPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setTplPreview(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setTplPreview(null)} className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg cursor-pointer hover:bg-neutral-100"><X className="h-4 w-4" /></button>
            <div className="rounded-2xl overflow-hidden shadow-2xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tplPreview} alt="" className="w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
