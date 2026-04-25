import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import posts from "../../../content/blog/posts.json";

export const metadata = {
  title: "Blog — ShelfReady",
  description:
    "E-commerce tips, AI product photography guides, listing optimization strategies, and ad creative best practices for Amazon, Etsy, Shopify, and eBay sellers.",
  openGraph: { title: "ShelfReady Blog", description: "AI-powered e-commerce insights" },
};

export default function BlogPage() {
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-screen bg-surface text-text">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-surface/85 backdrop-blur">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" className="h-[66px] w-[66px] sm:h-[72px] sm:w-[72px] rounded relative -top-[4px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-wordmark.png" alt="ShelfReady" className="h-[48px] sm:h-[56px] w-auto" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/pricing"
              className="text-[13px] sm:text-[14px] font-medium text-text-muted hover:text-text hidden sm:inline-block"
            >
              Pricing
            </Link>
            <Link
              href="/signup"
              className="text-[13px] sm:text-[14px] font-semibold bg-primary text-[#FAF6EC] px-4 sm:px-5 py-2 rounded hover:bg-primary-dark transition-colors"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1160px] mx-auto px-5 sm:px-6 pt-16 pb-24 sm:pt-24">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <p
            className="text-[11px] uppercase tracking-[0.24em] text-text-muted mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Journal
          </p>
          <h1
            className="text-[clamp(48px,7vw,96px)] leading-[1] tracking-[-0.025em] text-secondary"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            Blog.
          </h1>
          <p className="mt-4 text-text-muted max-w-lg mx-auto text-[16px] leading-relaxed">
            E-commerce insights, guides, and strategies for sellers who actually ship.
          </p>
        </div>

        {/* Featured — full-bleed editorial */}
        <Link href={`/blog/${featured.slug}`} className="group block mb-16 sm:mb-20">
          <div className="border border-border bg-surface-alt hover:bg-[#E3D9C4]/40 transition-colors p-8 sm:p-12">
            <div
              className="flex items-center gap-3 mb-5 text-[11px] uppercase tracking-[0.18em] text-text-muted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span className="text-primary">{featured.category}</span>
              <span className="w-6 h-px bg-border" />
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {featured.readTime}
              </span>
              <span className="w-6 h-px bg-border" />
              <span>
                {new Date(featured.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h2
              className="text-[clamp(28px,4vw,52px)] leading-[1.05] tracking-[-0.02em] text-secondary mb-4 group-hover:text-primary transition-colors max-w-4xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              {featured.title}
            </h2>
            <p className="text-text-muted leading-relaxed max-w-2xl text-[16px] mb-6">
              {featured.excerpt}
            </p>
            <div
              className="text-[12px] uppercase tracking-[0.18em] text-primary font-semibold inline-flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Read essay
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Rest */}
        <div className="border-t border-border">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-4 md:gap-8 items-baseline py-7 sm:py-8 border-b border-border hover:bg-surface-alt/40 transition-colors -mx-3 px-3"
            >
              <div
                className="text-[11px] uppercase tracking-[0.18em] text-text-muted"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span className="text-primary">{post.category}</span>
                <span className="block mt-1 text-text-muted/80">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" · "}
                  {post.readTime}
                </span>
              </div>
              <div>
                <h3
                  className="text-[22px] sm:text-[26px] leading-[1.15] tracking-[-0.015em] text-secondary group-hover:text-primary transition-colors"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                >
                  {post.title}
                </h3>
                <p className="text-[14px] text-text-muted leading-relaxed mt-2 max-w-2xl">
                  {post.excerpt}
                </p>
              </div>
              <ArrowRight className="hidden md:block h-5 w-5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-2" />
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-surface">
        <div className="mx-auto max-w-[1160px] px-5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" className="h-[66px] w-[66px] rounded relative -top-[4px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-wordmark.png" alt="ShelfReady" className="h-[48px] w-auto" />
          </Link>
          <p
            className="text-[11px] uppercase tracking-[0.18em] text-text-muted"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            © {new Date().getFullYear()} ShelfReady
          </p>
        </div>
      </footer>
    </div>
  );
}
