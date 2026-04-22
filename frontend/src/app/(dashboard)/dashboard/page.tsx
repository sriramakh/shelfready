"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { cn, formatNumber } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/loading-spinner";
import { OnboardingTour } from "@/components/shared/onboarding-tour";
import type { UsageCurrent, ListingResponse } from "@/types/api";
import {
  FileText,
  Image,
  Share2,
  Megaphone,
  Plus,
  ArrowRight,
  TrendingUp,
  Zap,
  Search,
  ArrowUpRight,
  Lightbulb,
  Sparkles,
  BookOpen,
  Package,
  MousePointerClick,
  BarChart3,
} from "lucide-react";

/* ---------- Quick actions data ---------- */
const createActions = [
  {
    title: "Master Suite",
    description: "One image → listing + photoshoot + social + ads + research",
    href: "/master",
    icon: Sparkles,
    gradient: "from-primary to-blue-700",
    lightBg: "bg-purple-50",
    lightText: "text-primary",
  },
  {
    title: "Create Listing",
    description: "Generate an optimized product listing",
    href: "/listings/new",
    icon: FileText,
    gradient: "from-blue-500 to-blue-600",
    lightBg: "bg-blue-50",
    lightText: "text-blue-600",
  },
  {
    title: "Generate Images",
    description: "AI product lifestyle photos",
    href: "/images/generate",
    icon: Image,
    gradient: "from-primary to-purple-600",
    lightBg: "bg-purple-50",
    lightText: "text-purple-600",
  },
  {
    title: "Create Social Post",
    description: "Social media content in seconds",
    href: "/social/generate",
    icon: Share2,
    gradient: "from-pink-500 to-rose-600",
    lightBg: "bg-pink-50",
    lightText: "text-pink-600",
  },
  {
    title: "Generate Ad Copy",
    description: "High-converting ad variants",
    href: "/ads/generate",
    icon: Megaphone,
    gradient: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50",
    lightText: "text-amber-600",
  },
];

const analyzeActions = [
  {
    title: "Market Research",
    description: "Analyze competitors and trends",
    href: "/research",
    icon: Search,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-600",
  },
  {
    title: "View Analytics",
    description: "Track usage and performance",
    href: "/usage",
    icon: BarChart3,
    gradient: "from-indigo-500 to-violet-600",
    lightBg: "bg-indigo-50",
    lightText: "text-indigo-600",
  },
];

/* ---------- Tips data ---------- */
const tips = [
  {
    icon: Lightbulb,
    title: "Write Better Listings",
    description:
      "Include specific product details and target audience info for higher-quality AI output.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Sparkles,
    title: "Image Generation Tips",
    description:
      "Use lifestyle shots for social media and clean studio shots for marketplace listings.",
    color: "text-primary",
    bg: "bg-purple-50",
  },
  {
    icon: BookOpen,
    title: "Maximize Your Plan",
    description:
      "Batch-generate content for multiple products to make the most of your monthly quota.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
];

/* ---------- Helpers ---------- */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* ---------- Component ---------- */
export default function DashboardPage() {
  const { user, session } = useAuth();
  const [usage, setUsage] = useState<UsageCurrent | null>(null);
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    async function fetchData() {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      try {
        const [usageData, listingsData] = await Promise.all([
          api.getCurrentUsage(session.access_token) as Promise<UsageCurrent>,
          api.getListings(session.access_token) as Promise<{
            items: ListingResponse[];
          }>,
        ]);
        setUsage(usageData);
        setListings(listingsData?.items?.slice(0, 5) || []);
      } catch {
        // Silently handle - user may have no data yet
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session?.access_token]);

  if (loading) return <PageLoader />;

  const total = usage?.total;
  const unlimited = total?.limit === -1;
  const usagePercent = total && total.limit > 0
    ? Math.round((total.used / total.limit) * 100)
    : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset =
    circumference - (usagePercent / 100) * circumference;
  const nearLimit = usagePercent > 80;

  /* ---------- Stats cards data ---------- */
  const stats = [
    {
      label: "Total Listings",
      value: listings.length,
      trend: "+2 this week",
      trendUp: true,
      icon: FileText,
      gradient: "from-blue-500/10 to-blue-600/5",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Images Generated",
      value: 0,
      trend: "Get started",
      trendUp: null,
      icon: Image,
      gradient: "from-primary/10 to-purple-600/5",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Social Posts",
      value: 0,
      trend: "Get started",
      trendUp: null,
      icon: Share2,
      gradient: "from-pink-500/10 to-pink-600/5",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      label: "Quota Used",
      value: total ? (unlimited ? "Unlimited" : `${usagePercent}%`) : "0%",
      trend: total
        ? (unlimited ? `${formatNumber(total.used)} used` : `${formatNumber(total.remaining)} left`)
        : "Full quota available",
      trendUp: usagePercent < 80 ? true : false,
      icon: TrendingUp,
      gradient: "from-emerald-500/10 to-emerald-600/5",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      <OnboardingTour />

      {/* ===== Welcome section ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="text-text-muted mt-1.5 text-[15px]">
            Here&apos;s an overview of your ShelfReady activity.
          </p>
        </div>
        <Link
          href="/listings/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New Listing
        </Link>
      </div>

      {/* ===== Stats Grid ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <CardBody
              className={cn(
                "bg-gradient-to-br rounded-xl",
                stat.gradient
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    "rounded-xl p-2.5",
                    stat.iconBg
                  )}
                >
                  <stat.icon
                    className={cn("h-5 w-5", stat.iconColor)}
                  />
                </div>
              </div>
              <p className="text-sm text-text-muted font-medium">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-secondary mt-0.5">
                {typeof stat.value === "number"
                  ? formatNumber(stat.value)
                  : stat.value}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                {stat.trendUp === true && (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                )}
                {stat.trendUp === false && (
                  <TrendingUp className="h-3 w-3 text-amber-500 rotate-180" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    stat.trendUp === true
                      ? "text-emerald-600"
                      : stat.trendUp === false
                        ? "text-amber-600"
                        : "text-text-muted"
                  )}
                >
                  {stat.trend}
                </span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ===== Usage Meter + Quick Actions ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Meter */}
        <Card className="overflow-hidden">
          <CardBody className="flex flex-col items-center justify-center py-8 relative">
            {/* Decorative background ring */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <div className="h-48 w-48 rounded-full border-[20px] border-primary" />
            </div>

            <p className="text-sm font-semibold text-secondary mb-1">
              API Usage
            </p>
            <p className="text-xs text-text-muted mb-5">Current billing window</p>

            <div className="relative">
              <svg
                className="w-36 h-36 -rotate-90"
                viewBox="0 0 100 100"
              >
                {/* Background track */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="7"
                />
                {/* Gradient definition */}
                <defs>
                  <linearGradient
                    id="gaugeGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop
                      offset="0%"
                      stopColor={nearLimit ? "#ef4444" : "#3b82f6"}
                    />
                    <stop
                      offset="100%"
                      stopColor={nearLimit ? "#f97316" : "#8b5cf6"}
                    />
                  </linearGradient>
                </defs>
                {/* Progress arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    nearLimit && "animate-pulse"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-secondary">
                  {usagePercent}%
                </span>
                <span className="text-xs text-text-muted font-medium">
                  used
                </span>
              </div>
            </div>

            {total && (
              <div className="mt-5 text-center space-y-1">
                <p className="text-sm font-medium text-secondary">
                  {formatNumber(total.used)}
                  {!unlimited && (
                    <>
                      {" "}
                      <span className="text-text-muted font-normal">of</span>{" "}
                      {formatNumber(total.limit)}
                    </>
                  )}{" "}
                  <span className="text-text-muted font-normal">requests</span>
                </p>
                <p className="text-xs text-text-muted">
                  {unlimited ? "Unlimited plan" : `${formatNumber(total.remaining)} remaining`}
                </p>
              </div>
            )}

            {!total && (
              <div className="mt-5 text-center">
                <p className="text-sm text-text-muted">
                  No usage data yet
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create section */}
          <div>
            <h2 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Zap className="h-4 w-4 text-amber-500" />
              Create
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {createActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative overflow-hidden">
                    <CardBody className="flex items-center gap-4 relative z-10">
                      <div
                        className={cn(
                          "rounded-xl p-2.5 transition-all duration-200",
                          action.lightBg,
                          "group-hover:scale-110"
                        )}
                      >
                        <action.icon
                          className={cn("h-5 w-5", action.lightText)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary">
                          {action.title}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {action.description}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-text-muted opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200" />
                    </CardBody>
                    {/* Gradient border accent on hover */}
                    <div
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity",
                        action.gradient
                      )}
                    />
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Analyze section */}
          <div>
            <h2 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Search className="h-4 w-4 text-emerald-500" />
              Analyze
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analyzeActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative overflow-hidden">
                    <CardBody className="flex items-center gap-4 relative z-10">
                      <div
                        className={cn(
                          "rounded-xl p-2.5 transition-all duration-200",
                          action.lightBg,
                          "group-hover:scale-110"
                        )}
                      >
                        <action.icon
                          className={cn("h-5 w-5", action.lightText)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary">
                          {action.title}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {action.description}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-text-muted opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200" />
                    </CardBody>
                    <div
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity",
                        action.gradient
                      )}
                    />
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Recent Activity ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary">
            Recent Listings
          </h2>
          {listings.length > 0 && (
            <Link
              href="/listings"
              className="text-sm text-primary hover:text-purple-600 font-medium flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {listings.length === 0 ? (
          <Card className="overflow-hidden">
            <CardBody className="py-12">
              <div className="flex flex-col items-center text-center max-w-md mx-auto">
                {/* Icon composition */}
                <div className="relative mb-6">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 p-5">
                    <Package className="h-10 w-10 text-blue-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 rounded-lg bg-amber-50 p-1.5 border-2 border-white shadow-sm">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="absolute -bottom-1 -left-2 rounded-lg bg-emerald-50 p-1.5 border-2 border-white shadow-sm">
                    <MousePointerClick className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-secondary mb-1.5">
                  No listings yet
                </h3>
                <p className="text-sm text-text-muted mb-6 leading-relaxed">
                  Create your first AI-powered product listing in minutes.
                  Follow these steps to get started:
                </p>

                {/* Getting started steps */}
                <div className="w-full space-y-3 mb-6 text-left">
                  {[
                    {
                      step: 1,
                      title: "Enter your product info",
                      desc: "Name, details, target audience",
                    },
                    {
                      step: 2,
                      title: "Choose your platform",
                      desc: "Amazon, Etsy, or Shopify",
                    },
                    {
                      step: 3,
                      title: "Generate and customize",
                      desc: "AI creates your optimized listing",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-start gap-3 rounded-lg bg-surface-alt/70 px-4 py-3"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white flex-shrink-0 mt-0.5">
                        {item.step}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-secondary">
                          {item.title}
                        </p>
                        <p className="text-xs text-text-muted">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/listings/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Create First Listing
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="divide-y divide-border/60">
              {listings.map((listing, index) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-surface-alt/50 transition-all duration-150 group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 group-hover:from-blue-100 group-hover:to-blue-50 transition-colors">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate group-hover:text-secondary transition-colors">
                      {listing.generated_title || listing.product_name}
                    </p>
                    <p className="text-xs text-text-muted capitalize mt-0.5">
                      {listing.platform}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150" />
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ===== Tips Section ===== */}
      <div>
        <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Tips & Best Practices
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tips.map((tip) => (
            <Card
              key={tip.title}
              className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <CardBody>
                <div
                  className={cn(
                    "rounded-xl p-2.5 w-fit mb-3",
                    tip.bg
                  )}
                >
                  <tip.icon className={cn("h-5 w-5", tip.color)} />
                </div>
                <h3 className="text-sm font-semibold text-secondary mb-1">
                  {tip.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {tip.description}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
