"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, X, Sparkles, FileText, Image, Share2, Megaphone, Search, BarChart3 } from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Welcome to ShelfReady!",
    description: "Let's take a quick tour of your dashboard. We'll show you the 6 AI-powered tools that'll transform your product marketing.",
    icon: Sparkles,
    color: "#2563eb",
    target: null, // full-screen welcome
  },
  {
    title: "Create Product Listings",
    description: "Generate SEO-optimized listings for Amazon, Etsy, and Shopify. Just describe your product and pick a platform — the AI handles the rest.",
    icon: FileText,
    color: "#3b82f6",
    target: "sidebar-listings",
    highlight: "/listings",
  },
  {
    title: "AI Product Photoshoot",
    description: "Upload a single product photo and get professional studio, lifestyle, model, and in-context shots. No photographer needed.",
    icon: Image,
    color: "#8b5cf6",
    target: "sidebar-images",
    highlight: "/images",
  },
  {
    title: "Social Media Content",
    description: "Generate scroll-stopping captions, hashtags, and CTAs for Instagram, Facebook, and Pinterest in your brand's tone.",
    icon: Share2,
    color: "#ec4899",
    target: "sidebar-social",
    highlight: "/social",
  },
  {
    title: "Ad Copy & Creatives",
    description: "Create high-converting ad variants for Facebook and Google, plus visual ad creatives with 200+ templates.",
    icon: Megaphone,
    color: "#f59e0b",
    target: "sidebar-ads",
    highlight: "/ads",
  },
  {
    title: "Market Research",
    description: "Analyze competitors, discover keyword gaps, and get pricing intelligence — all powered by live web search + AI analysis.",
    icon: Search,
    color: "#10b981",
    target: "sidebar-research",
    highlight: "/research",
  },
  {
    title: "Track Your Usage",
    description: "Monitor your monthly quotas across all tools. Upgrade anytime from the Billing page for higher limits.",
    icon: BarChart3,
    color: "#6366f1",
    target: "sidebar-usage",
    highlight: "/usage",
  },
  {
    title: "You're all set!",
    description: "Start by creating your first product listing. Just click the 'New Listing' button above, or pick any tool from the sidebar.",
    icon: Sparkles,
    color: "#2563eb",
    target: null,
  },
];

const STORAGE_KEY = "shelfready_tour_completed";

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Show tour only if not completed before
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay so dashboard renders first
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const complete = useCallback(() => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      complete();
    }
  }, [step, complete]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  useEffect(() => {
    if (!active) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") complete();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, next, prev, complete]);

  // Highlight sidebar items
  useEffect(() => {
    if (!active) return;
    const current = TOUR_STEPS[step];
    // Remove all previous highlights
    document.querySelectorAll("[data-tour-highlight]").forEach((el) => {
      (el as HTMLElement).style.removeProperty("box-shadow");
      (el as HTMLElement).style.removeProperty("z-index");
      (el as HTMLElement).style.removeProperty("position");
    });
    // Add highlight to current target
    if (current.highlight) {
      const el = document.querySelector(`a[href="${current.highlight}/generate"], a[href="${current.highlight}"]`) as HTMLElement;
      if (el) {
        el.setAttribute("data-tour-highlight", "true");
        el.style.boxShadow = `0 0 0 3px ${current.color}40, 0 0 20px ${current.color}20`;
        el.style.zIndex = "60";
        el.style.position = "relative";
      }
    }
    return () => {
      document.querySelectorAll("[data-tour-highlight]").forEach((el) => {
        (el as HTMLElement).style.removeProperty("box-shadow");
        (el as HTMLElement).style.removeProperty("z-index");
        (el as HTMLElement).style.removeProperty("position");
        el.removeAttribute("data-tour-highlight");
      });
    };
  }, [active, step]);

  if (!active) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={complete} />

      {/* Tour card */}
      <div className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <div className="bg-white dark:bg-[#1a1c27] rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-neutral-100 dark:bg-white/5">
            <div
              className="h-full rounded-r-full transition-all duration-500"
              style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%`, background: current.color }}
            />
          </div>

          {/* Header */}
          <div className="px-6 pt-6 pb-0 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${current.color}15` }}>
                <Icon className="h-5 w-5" style={{ color: current.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: current.color }}>
                  Step {step + 1} of {TOUR_STEPS.length}
                </p>
              </div>
            </div>
            <button onClick={complete} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-white/5 dark:hover:text-neutral-300 transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{current.title}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{current.description}</p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === step ? "w-6" : "w-1.5 opacity-30"
                  }`}
                  style={{ background: i === step ? current.color : "#94a3b8" }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prev}
                  className="px-3 py-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all cursor-pointer hover:brightness-110"
                style={{ background: current.color }}
              >
                {isLast ? "Get Started" : "Next"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
