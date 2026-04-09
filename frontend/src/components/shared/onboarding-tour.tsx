"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, X, Sparkles, FileText, Image, Share2, Megaphone, Search, BarChart3, CreditCard, Settings, ChevronRight } from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  selector: string | null; // CSS selector to highlight
  position: "center" | "right" | "bottom-right"; // tooltip position relative to target
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to ShelfReady!",
    description: "Let's walk you through your dashboard. This 60-second tour will show you exactly where everything is.",
    icon: Sparkles,
    color: "#2563eb",
    selector: null,
    position: "center",
  },
  {
    title: "Product Listings",
    description: "Generate SEO-optimized listings for Amazon, Etsy, and Shopify. Enter your product details, pick a platform, and get a complete listing with title, bullets, description, and keywords.",
    icon: FileText,
    color: "#3b82f6",
    selector: 'a[href="/listings"]',
    position: "right",
  },
  {
    title: "AI Image Studio",
    description: "Upload one product photo → get professional studio, lifestyle, model, and in-context shots. Or generate images from text descriptions. No photographer needed.",
    icon: Image,
    color: "#8b5cf6",
    selector: 'a[href="/images/generate"]',
    position: "right",
  },
  {
    title: "Social Media Content",
    description: "Pick a platform (Instagram, Facebook, Pinterest), set the tone, and get scroll-stopping captions, 20+ hashtags, and a clear CTA — ready to post.",
    icon: Share2,
    color: "#ec4899",
    selector: 'a[href="/social/generate"]',
    position: "right",
  },
  {
    title: "Ad Copy & Creatives",
    description: "Two tools in one: generate ad copy variants for Facebook/Google, OR upload your product + pick from 200+ templates to create visual ad creatives.",
    icon: Megaphone,
    color: "#f59e0b",
    selector: 'a[href="/ads/generate"]',
    position: "right",
  },
  {
    title: "Market Research",
    description: "Enter a product or category → get competitor analysis, keyword gaps, pricing intelligence, and actionable recommendations powered by live web data.",
    icon: Search,
    color: "#10b981",
    selector: 'a[href="/research"]',
    position: "right",
  },
  {
    title: "Usage & Billing",
    description: "Track your monthly usage across all tools here. When you need more, upgrade your plan from the Billing page — takes 30 seconds.",
    icon: BarChart3,
    color: "#6366f1",
    selector: 'a[href="/usage"]',
    position: "right",
  },
  {
    title: "You're ready to go!",
    description: "Click any tool in the sidebar to get started. We recommend creating your first product listing — it only takes a minute.",
    icon: Sparkles,
    color: "#2563eb",
    selector: null,
    position: "center",
  },
];

const STORAGE_KEY = "shelfready_tour_completed";

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const t = setTimeout(() => setActive(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const complete = useCallback(() => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) setStep((s) => s + 1);
    else complete();
  }, [step, complete]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  // Keyboard navigation
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

  // Position tooltip next to target element
  useEffect(() => {
    if (!active) return;
    const current = TOUR_STEPS[step];

    if (!current.selector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(current.selector) as HTMLElement;
    if (!el) {
      setTargetRect(null);
      return;
    }

    // Scroll element into view if needed
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const updateRect = () => {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    };

    updateRect();
    // Update on scroll/resize
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [active, step]);

  if (!active) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  let arrowStyle: React.CSSProperties = {};
  let showArrow = false;

  if (targetRect && current.position === "right") {
    // Position tooltip to the right of the sidebar item
    tooltipStyle = {
      position: "fixed",
      left: targetRect.right + 16,
      top: targetRect.top + targetRect.height / 2,
      transform: "translateY(-50%)",
    };
    arrowStyle = {
      position: "absolute",
      left: -8,
      top: "50%",
      transform: "translateY(-50%) rotate(45deg)",
      width: 16,
      height: 16,
    };
    showArrow = true;
  } else {
    // Center on screen
    tooltipStyle = {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  return (
    <>
      {/* Backdrop with spotlight cutout */}
      <div className="fixed inset-0 z-[90]" onClick={complete}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-spotlight">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 4}
                  width={targetRect.width + 12}
                  height={targetRect.height + 8}
                  rx={12}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#tour-spotlight)"
          />
        </svg>
      </div>

      {/* Highlight ring around target */}
      {targetRect && (
        <div
          className="fixed z-[91] pointer-events-none rounded-xl transition-all duration-500"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 4,
            width: targetRect.width + 12,
            height: targetRect.height + 8,
            boxShadow: `0 0 0 3px ${current.color}, 0 0 24px ${current.color}40`,
          }}
        />
      )}

      {/* Pulsing dot on target */}
      {targetRect && (
        <div
          className="fixed z-[92] pointer-events-none"
          style={{ left: targetRect.right - 4, top: targetRect.top - 2 }}
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: current.color }} />
            <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: current.color }} />
          </span>
        </div>
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="fixed z-[92] w-[340px]"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow pointing to target */}
        {showArrow && (
          <div
            className="bg-white dark:bg-[#1a1c27] border-l border-b border-neutral-200 dark:border-white/10"
            style={arrowStyle}
          />
        )}

        <div className="bg-white dark:bg-[#1a1c27] rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-neutral-100 dark:bg-white/5">
            <div
              className="h-full rounded-r-full transition-all duration-500"
              style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%`, background: current.color }}
            />
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${current.color}15` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: current.color }} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: current.color }}>
                  {step + 1} / {TOUR_STEPS.length}
                </p>
              </div>
              <button onClick={complete} className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-white/5 dark:hover:text-neutral-300 transition-colors cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white mb-1.5">{current.title}</h3>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed">{current.description}</p>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-white/5">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? "w-5" : "w-1.5"
                    }`}
                    style={{
                      background: i === step ? current.color : i < step ? `${current.color}40` : "#d1d5db",
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                {!isFirst && (
                  <button
                    onClick={prev}
                    className="px-2.5 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                )}
                {isFirst && (
                  <button
                    onClick={complete}
                    className="px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-600 rounded-md transition-colors cursor-pointer"
                  >
                    Skip tour
                  </button>
                )}
                <button
                  onClick={next}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer hover:brightness-110"
                  style={{ background: current.color }}
                >
                  {isLast ? "Start Building" : "Next"}
                  {isLast ? <Sparkles className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
