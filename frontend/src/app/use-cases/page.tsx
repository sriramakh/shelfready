"use client";

import { useState } from "react";
import Link from "next/link";
import useCases from "../../../content/use-cases.json";
import {
  ArrowLeft, Package, FileText, Camera, Megaphone, Share2, Search,
  Check, ChevronRight, ArrowRight,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type UseCase = Record<string, any>;

const TOOL_TABS = [
  { id: "listing", label: "Listing", icon: FileText, color: "#3b82f6" },
  { id: "social", label: "Social", icon: Share2, color: "#ec4899" },
  { id: "ads", label: "Ad Copy", icon: Megaphone, color: "#f59e0b" },
  { id: "research", label: "Research", icon: Search, color: "#10b981" },
  { id: "photoshoot", label: "Photoshoot", icon: Camera, color: "#8b5cf6" },
  { id: "creative", label: "Creatives", icon: Camera, color: "#6366f1" },
] as const;

function ListingOutput({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 uppercase tracking-wider">{data.platform}</span>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Optimized Title</p>
        <p className="text-[15px] font-semibold text-neutral-900 leading-snug">{data.title}</p>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-2">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Bullet Points</p>
        {data.bullets.map((b: string, i: number) => (
          <div key={i} className="flex gap-2 text-[13px] text-neutral-600">
            <Check className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span>{b}</span>
          </div>
        ))}
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Backend Keywords</p>
        <div className="flex flex-wrap gap-1.5">
          {data.keywords.map((k: string) => (
            <span key={k} className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">{k}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SocialOutput({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 uppercase">{data.platform}</span>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider mb-2">Caption</p>
        <p className="text-[14px] text-neutral-700 leading-relaxed whitespace-pre-line">{data.caption}</p>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider mb-2">Hashtags</p>
        <div className="flex flex-wrap gap-1.5">
          {data.hashtags.map((h: string) => (
            <span key={h} className="text-[11px] bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full">{h}</span>
          ))}
        </div>
      </div>
      {data.cta && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider mb-1">Call to Action</p>
          <p className="text-[14px] text-neutral-800 font-medium">{data.cta}</p>
        </div>
      )}
    </div>
  );
}

function AdsOutput({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 uppercase">{data.platform} Ads</span>
        <span className="text-[11px] text-neutral-400">{data.variants.length} variants</span>
      </div>
      {data.variants.map((v: any, i: number) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">{v.label || `Variant ${i + 1}`}</span>
          </div>
          <p className="text-[15px] font-bold text-neutral-900 mb-1">{v.headline}</p>
          <p className="text-[13px] text-neutral-600 leading-relaxed mb-2">{v.primary_text}</p>
          <span className="text-[12px] font-semibold text-amber-600">{v.cta} →</span>
        </div>
      ))}
    </div>
  );
}

function ResearchOutput({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Market Analysis</p>
        <p className="text-[13px] text-neutral-600 leading-relaxed whitespace-pre-line">{data.analysis}</p>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Top Keywords</p>
        <div className="flex flex-wrap gap-1.5">
          {data.keywords.map((k: string) => (
            <span key={k} className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">{k}</span>
          ))}
        </div>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-3">Competitors</p>
        <div className="space-y-3">
          {data.competitors.map((c: any, i: number) => (
            <div key={i} className="flex items-start justify-between pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
              <div>
                <p className="text-[13px] font-semibold text-neutral-900">{c.name}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">{c.weakness}</p>
              </div>
              <span className="text-[12px] font-mono text-neutral-400 flex-shrink-0 ml-4">{c.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhotoshootOutput({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.product_analysis && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">Product Analysis</p>
          <p className="text-[13px] text-neutral-700">
            <strong>{data.product_analysis.product_name}</strong> &middot; {data.product_analysis.color} &middot; {data.product_analysis.product_category}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.images.map((img: any, i: number) => (
          <div key={i} className="rounded-xl overflow-hidden border border-neutral-200">
            <div className="aspect-square overflow-hidden bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.theme} className="w-full h-full object-cover" />
            </div>
            <div className="px-3 py-2 bg-white">
              <p className="text-[11px] font-medium text-neutral-600 capitalize">{img.theme}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreativeOutput({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {data.creatives.map((c: any, i: number) => (
        <div key={i} className="rounded-xl overflow-hidden border border-neutral-200">
          <div className="aspect-square overflow-hidden bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.src} alt={c.size} className="w-full h-full object-cover" />
          </div>
          <div className="px-3 py-2 bg-white">
            <p className="text-[11px] font-medium text-neutral-600">{c.size}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UseCasesPage() {
  const [activeProduct, setActiveProduct] = useState(0);
  const [activeTool, setActiveTool] = useState("listing");

  const uc = useCases[activeProduct] as UseCase;

  // Filter tools to those that have data for this product
  const availableTools = TOOL_TABS.filter((t) => {
    const data = uc[t.id];
    return data !== null && data !== undefined;
  });

  // Reset to first available tool when product changes
  const currentTool = availableTools.find((t) => t.id === activeTool) ? activeTool : availableTools[0]?.id || "listing";

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fafaf9]/80 backdrop-blur-2xl border-b border-neutral-200/60">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="ShelfReady" className="h-8 w-8 rounded-[10px]" />
            <span className="text-[17px] font-bold tracking-[-0.02em]">ShelfReady</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-[14px] text-neutral-500 font-medium">
            <Link href="/#demo" className="hover:text-neutral-900 transition-colors">Product</Link>
            <Link href="/#templates" className="hover:text-neutral-900 transition-colors">Templates</Link>
            <Link href="/#pricing" className="hover:text-neutral-900 transition-colors">Pricing</Link>
            <span className="text-neutral-900 font-semibold">Use Cases</span>
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

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[13px] font-bold text-[#2563eb] uppercase tracking-wider mb-2">Real AI-Generated Output</p>
          <h1 className="text-[2.5rem] sm:text-[3rem] font-extrabold tracking-[-0.03em]">Use Cases</h1>
          <p className="mt-3 text-neutral-500 max-w-lg mx-auto">See exactly what ShelfReady generates for real products — listings, social posts, ads, research, photoshoots, and creatives.</p>
        </div>

        {/* Product Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {useCases.map((uc, i) => (
            <button
              key={uc.id}
              onClick={() => { setActiveProduct(i); setActiveTool("listing"); }}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                activeProduct === i
                  ? "bg-neutral-900 text-white shadow-lg"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
              }`}
            >
              {uc.name}
            </button>
          ))}
        </div>

        {/* Product + Tool Layout */}
        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          {/* Tool Tabs (Left Sidebar) */}
          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {availableTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = currentTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all cursor-pointer flex-shrink-0 lg:w-full ${
                    isActive
                      ? "bg-white border border-neutral-200 shadow-md"
                      : "hover:bg-white/60 border border-transparent"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? tool.color : "#f0f0f0" }}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-neutral-400"}`} />
                  </div>
                  <span className={`text-[13px] font-semibold ${isActive ? "text-neutral-900" : "text-neutral-500"}`}>
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Output Panel */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 min-h-[500px]">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
              <span className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider">
                AI-Generated Output for {uc.name}
              </span>
            </div>

            {currentTool === "listing" && uc.listing && <ListingOutput data={uc.listing} />}
            {currentTool === "social" && uc.social && <SocialOutput data={uc.social} />}
            {currentTool === "ads" && uc.ads && <AdsOutput data={uc.ads} />}
            {currentTool === "research" && uc.research && <ResearchOutput data={uc.research} />}
            {currentTool === "photoshoot" && uc.photoshoot && <PhotoshootOutput data={uc.photoshoot} />}
            {currentTool === "creative" && uc.creative && <CreativeOutput data={uc.creative} />}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#2563eb] text-white px-8 py-3.5 rounded-full text-[15px] font-bold hover:bg-[#1d4ed8] transition-colors shadow-lg"
          >
            Generate your first listing <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-[13px] text-neutral-400">Free to start. No credit card required.</p>
        </div>
      </div>
    </div>
  );
}
