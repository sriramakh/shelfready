"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { PageLoader } from "@/components/shared/loading-spinner";
import {
  Package,
  LayoutDashboard,
  FileText,
  Image,
  Share2,
  Megaphone,
  Search,
  Settings,
  CreditCard,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Crown,
  ArrowUpRight,
} from "lucide-react";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Listings", href: "/listings", icon: FileText },
  { label: "Images", href: "/images/generate", icon: Image },
  { label: "Social", href: "/social/generate", icon: Share2 },
  { label: "Ads", href: "/ads/generate", icon: Megaphone },
  { label: "Research", href: "/research", icon: Search },
];

const bottomNav = [
  { label: "Usage", href: "/usage", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Billing", href: "/billing", icon: CreditCard },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/listings": "Listings",
  "/listings/new": "New Listing",
  "/images/generate": "Image Studio",
  "/social/generate": "Social Content",
  "/ads/generate": "Ad Generator",
  "/research": "Market Research",
  "/usage": "Usage & Analytics",
  "/settings": "Settings",
  "/billing": "Billing",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <PageLoader />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Breadcrumb / page title
  const currentPageTitle =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(([key]) =>
      pathname.startsWith(key) && key !== "/dashboard"
    )?.[1] ||
    "Dashboard";

  const breadcrumbSegments = pathname.split("/").filter(Boolean);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-alt">
        {/* Mobile sidebar overlay */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
            sidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 z-50 h-full w-[264px] flex flex-col transition-transform duration-300 ease-out lg:translate-x-0",
            "bg-gradient-to-b from-white via-white to-slate-50/80 border-r border-border/60",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-border/40 flex-shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.png" alt="ShelfReady" className="h-9 w-9 rounded-xl shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow duration-200" />
              <span className="text-[17px] font-bold tracking-tight text-secondary">
                ShelfReady
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-5 px-3">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted/60">
              Main
            </p>
            <div className="space-y-0.5">
              {mainNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 relative group",
                      active
                        ? "bg-primary/8 text-primary"
                        : "text-text-muted hover:bg-purple-50/80 hover:text-text"
                    )}
                  >
                    {/* Active left border indicator */}
                    <div
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200",
                        active
                          ? "h-5 bg-primary"
                          : "h-0 bg-transparent group-hover:h-3 group-hover:bg-slate-300"
                      )}
                    />
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] transition-colors duration-150",
                        active ? "text-primary" : "text-text-muted group-hover:text-text"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="my-5 mx-3 border-t border-border/40" />

            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted/60">
              Account
            </p>
            <div className="space-y-0.5">
              {bottomNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 relative group",
                      active
                        ? "bg-primary/8 text-primary"
                        : "text-text-muted hover:bg-purple-50/80 hover:text-text"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200",
                        active
                          ? "h-5 bg-primary"
                          : "h-0 bg-transparent group-hover:h-3 group-hover:bg-slate-300"
                      )}
                    />
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] transition-colors duration-150",
                        active ? "text-primary" : "text-text-muted group-hover:text-text"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Plan badge & upgrade CTA */}
          <div className="px-3 pb-2 flex-shrink-0">
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-border/50 px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-secondary">
                  Free Plan
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed mb-2.5">
                Upgrade for unlimited listings and priority support.
              </p>
              <Link
                href="/billing"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-purple-600 transition-colors"
              >
                Upgrade Plan
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Sign out */}
          <div className="border-t border-border/40 p-3 flex-shrink-0">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-text-muted hover:bg-red-50 hover:text-red-600 transition-all duration-150 w-full cursor-pointer group"
            >
              <LogOut className="h-[18px] w-[18px] group-hover:text-red-500 transition-colors" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:pl-[264px]">
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-border/40 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-text-muted hover:text-text transition-colors cursor-pointer p-1 -ml-1 rounded-lg hover:bg-surface-alt"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                {breadcrumbSegments.map((segment, index) => {
                  const isLast = index === breadcrumbSegments.length - 1;
                  const href = "/" + breadcrumbSegments.slice(0, index + 1).join("/");
                  const label =
                    pageTitles[href] ||
                    segment.charAt(0).toUpperCase() + segment.slice(1);
                  return (
                    <span key={href} className="flex items-center gap-1.5">
                      {index > 0 && (
                        <span className="text-border select-none">/</span>
                      )}
                      {isLast ? (
                        <span className="font-semibold text-secondary">
                          {label}
                        </span>
                      ) : (
                        <Link
                          href={href}
                          className="text-text-muted hover:text-text transition-colors"
                        >
                          {label}
                        </Link>
                      )}
                    </span>
                  );
                })}
              </div>
              {/* Mobile page title */}
              <span className="sm:hidden text-sm font-semibold text-secondary">
                {currentPageTitle}
              </span>
            </div>

            {/* Right: user menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-150 cursor-pointer",
                  userMenuOpen
                    ? "bg-surface-alt ring-1 ring-border/50"
                    : "hover:bg-surface-alt"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 via-primary to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-text leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-text-muted leading-tight">
                    {user.email}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-text-muted hidden sm:block transition-transform duration-200",
                    userMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {/* User dropdown */}
              <div
                className={cn(
                  "absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border/60 bg-white shadow-xl shadow-black/8 z-20 overflow-hidden transition-all duration-200 origin-top-right",
                  userMenuOpen
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                )}
              >
                {/* User info header */}
                <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-blue-50/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-primary to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-secondary truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/80 border border-border/50 px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                      <Crown className="h-3 w-3 text-amber-500" />
                      Free Plan
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-text-muted hover:bg-surface-alt hover:text-text transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/billing"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-text-muted hover:bg-surface-alt hover:text-text transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </Link>
                  <Link
                    href="/usage"
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-text-muted hover:bg-surface-alt hover:text-text transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Usage
                  </Link>
                </div>

                <div className="border-t border-border/40 py-1.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
