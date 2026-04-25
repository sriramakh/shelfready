"use client";

/*
 * ShelfReady landing — v3 (editorial handoff from Claude Design).
 * Ported from shelfready-handoff/project/ShelfReady v3.html and its JSX
 * components. Design system tokens live in ./landing.css. All CTAs point
 * at /signup so cold traffic lands in the real funnel.
 */

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/constants";
import "./landing.css";

/* ── Logo mark — camera-bracket S sparkle ──────────────────────────── */
function Logo() {
  return (
    <div className="logo">
      <div className="logo-mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png"
          alt="ShelfReady"
          width={66}
          height={66}
          style={{ display: "block", objectFit: "contain" }}
        />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-wordmark.png"
        alt="shelfready"
        style={{ height: 50, width: "auto", display: "block" }}
      />
    </div>
  );
}

/* ── Nav ──────────────────────────────────────────────────────────── */
function Nav() {
  return (
    <nav className="nav nav-v2">
      <div className="nav-inner">
        <Logo />
        <div className="nav-cta">
          <a href="#pricing" className="nav-price-link">
            Pricing
          </a>
          <Link href="/login" className="btn btn-ghost nav-signin">
            Sign in
          </Link>
          <Link href="/signup" className="btn btn-clay">
            Try free
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ── Trust bar ────────────────────────────────────────────────────── */
function TrustBar() {
  return (
    <div className="trust-bar">
      <span className="trust-text">
        Trusted by Etsy, Amazon, eBay and Shopify sellers
      </span>
    </div>
  );
}

/* ── Before/after drag slider ─────────────────────────────────────── */
function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    let raf: number | undefined;
    let t = 0;
    const sweep = () => {
      t += 0.018;
      if (t > Math.PI) return;
      setPos(50 + Math.sin(t) * 35);
      raf = requestAnimationFrame(sweep);
    };
    const tm = window.setTimeout(() => {
      raf = requestAnimationFrame(sweep);
    }, 600);
    return () => {
      window.clearTimeout(tm);
      if (raf !== undefined) cancelAnimationFrame(raf);
    };
  }, []);

  const move = useCallback((clientX: number) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(2, Math.min(98, p)));
  }, []);

  const down = (e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true;
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    move(clientX);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const clientX =
        "touches" in e ? (e as TouchEvent).touches[0]?.clientX : (e as MouseEvent).clientX;
      if (typeof clientX === "number") move(clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [move]);

  return (
    <div className="ba-slider" ref={ref} onMouseDown={down} onTouchStart={down}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ba-img" src="/design-img/jewelry-studio01.png" alt="After" />
      <div className="ba-after-wrap" style={{ width: `${pos}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ba-img"
          src="/design-img/jewelry-input.png"
          alt="Before"
          style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }}
        />
      </div>
      <span className="ba-tag before">Your phone photo</span>
      <span className="ba-tag after">ShelfReady</span>
      <div className="ba-handle" style={{ left: `${pos}%` }}>
        <div className="ba-handle-knob">⇆</div>
      </div>
      <span className="ba-hint">← Drag to compare →</span>
    </div>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="hero-v3" id="upload">
      <div className="hero-v3-inner">
        <div className="hero-v3-grid">
          <div>
            <TrustBar />
            <h1>
              Turn 1 product photo into <em>everything</em> you need to sell.
            </h1>
            <p className="hero-v3-sub">
              Upload one photo. Get photos, ads, and listings that actually drive sales.
            </p>
            <div className="hero-v3-cta-wrap">
              <Link href="/signup" className="btn btn-clay btn-xl hero-v2-cta">
                📷 Upload your photo — free
              </Link>
              <div
                className="mono"
                style={{ fontSize: 12, color: "var(--ink-muted)", letterSpacing: "0.04em" }}
              >
                See results in 30 seconds • No credit card required
              </div>
            </div>
          </div>
          <BeforeAfter />
        </div>
      </div>
      <div className="sticky-cta-mobile">
        <Link
          href="/signup"
          className="btn btn-clay btn-lg"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Upload your photo — free
        </Link>
      </div>
    </section>
  );
}

/* ── Research mini (used inside HowItWorks 06 card, referenced but not rendered) */
// Kept out — the design passes thumb paths directly in v3.

/* ── How it works — 1 input → 6 outputs radial layout ───────────── */
interface HowOutput {
  num: string;
  title: string;
  sub: string;
  thumb: string;
  pos: "top" | "top-right" | "bottom-right" | "bottom" | "bottom-left" | "top-left";
}

const HOW_OUTPUTS: HowOutput[] = [
  { num: "01", title: "Photoshoot", sub: "10 scenes from 1 photo", thumb: "/design-img/jewelry-studio01.png", pos: "top" },
  { num: "02", title: "Ad creatives", sub: "Up to 5 platform-native ads", thumb: "/design-img/ad-valentines.png", pos: "top-right" },
  { num: "03", title: "Listing copy", sub: "Amazon · Etsy · Shopify · eBay", thumb: "/design-img/listing-etsy.png", pos: "bottom-right" },
  { num: "04", title: "Social posts", sub: "IG · FB · Pinterest", thumb: "/design-img/social-knot.png", pos: "bottom" },
  { num: "05", title: "Multi-platform export", sub: "Every format, sized right", thumb: "/design-img/brands-marketplaces.png", pos: "bottom-left" },
  { num: "06", title: "Market research", sub: "Competitive intel", thumb: "/design-img/research-jewelry.png", pos: "top-left" },
];

function HowItWorks() {
  const radialRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [lines, setLines] = useState<Array<{ sx: number; sy: number; ex: number; ey: number }>>([]);

  const compute = useCallback(() => {
    const radial = radialRef.current;
    const center = centerRef.current;
    if (!radial || !center) return;
    const rb = radial.getBoundingClientRect();
    const cb = center.getBoundingClientRect();
    const cx = cb.left + cb.width / 2 - rb.left;
    const cy = cb.top + cb.height / 2 - rb.top;
    const centerRadius = Math.min(cb.width, cb.height) / 2;
    const next = nodeRefs.current
      .filter((n): n is HTMLDivElement => !!n)
      .map((n) => {
        const b = n.getBoundingClientRect();
        const nx = b.left + b.width / 2 - rb.left;
        const ny = b.top + b.height / 2 - rb.top;
        const dx = nx - cx;
        const dy = ny - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const sx = cx + (dx / dist) * centerRadius;
        const sy = cy + (dy / dist) * centerRadius;
        const ex = nx - (dx / dist) * (Math.min(b.width, b.height) / 2);
        const ey = ny - (dy / dist) * (Math.min(b.width, b.height) / 2);
        return { sx, sy, ex, ey };
      });
    setLines(next);
  }, []);

  useLayoutEffect(() => {
    compute();
    const ro = new ResizeObserver(compute);
    if (radialRef.current) ro.observe(radialRef.current);
    window.addEventListener("resize", compute);
    const t = window.setTimeout(compute, 300);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.clearTimeout(t);
    };
  }, [compute]);

  return (
    <section className="section how-section" id="how">
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 40px" }}>
          <span className="uppercase-label">06 · How it works</span>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(48px, 6.2vw, 92px)",
              lineHeight: 1,
              letterSpacing: "-0.025em",
              margin: "18px 0 18px",
              fontWeight: 400,
            }}
          >
            From 1 photo →{" "}
            <em style={{ color: "var(--clay)", fontStyle: "italic" }}>everything</em> you need to sell.
          </h2>
          <p style={{ fontSize: 17, color: "var(--ink-3)", lineHeight: 1.5, margin: 0 }}>
            Upload once. ShelfReady generates every asset you need to sell — photos,
            ads, listings, social, research — all ready to paste.
          </p>
        </div>

        <div className="how-radial" ref={radialRef}>
          <svg className="how-mesh" aria-hidden="true">
            {lines.map((l, i) => (
              <g key={i}>
                <line x1={l.sx} y1={l.sy} x2={l.ex} y2={l.ey} />
                <circle cx={l.sx} cy={l.sy} r="3" className="mesh-dot" />
                <circle cx={l.ex} cy={l.ey} r="3" className="mesh-dot" />
              </g>
            ))}
          </svg>

          <div className="how-center" ref={centerRef}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/design-img/jewelry-input.png" alt="Source phone photo" onLoad={compute} />
            <div className="how-center-label">
              <span className="mono">INPUT</span>
              <span>Your phone photo</span>
            </div>
          </div>

          {HOW_OUTPUTS.map((o, i) => (
            <div
              key={i}
              className={`how-node pos-${o.pos}`}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
            >
              <div className="how-card">
                <div className="how-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.thumb} alt={o.title} loading="lazy" onLoad={compute} />
                </div>
                <div className="how-meta">
                  <span className="mono how-num">{o.num}</span>
                  <div className="how-title">{o.title}</div>
                  <div className="how-sub">{o.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Outputs section — "Ten ways to sell." ───────────────────────── */
const OUTPUT_TILES = [
  { src: "/design-img/jewelry-studio01.png", label: "Studio shots that get clicks", num: "01", price: "$120" },
  { src: "/design-img/jewelry-studio02.png", label: "Click-ready studio shots", num: "02", price: "$120" },
  { src: "/design-img/jewelry-studio03.png", label: "Minimalist, conversion-focused", num: "03", price: "$120" },
  { src: "/design-img/jewelry-model01.png", label: "See how it looks on real people", num: "04", price: "$180" },
  { src: "/design-img/jewelry-model02.png", label: "Make your product feel premium", num: "05", price: "$180" },
  { src: "/design-img/jewelry-outdoor01.png", label: "Natural shots customers trust", num: "06", price: "$140" },
];

function OutputsSection() {
  return (
    <section className="outputs-section" id="outputs">
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <span className="uppercase-label">01 · The transformation</span>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(48px, 6.2vw, 92px)",
              lineHeight: 1,
              letterSpacing: "-0.025em",
              margin: "18px 0 18px",
              fontWeight: 400,
            }}
          >
            One photo.{" "}
            <em style={{ color: "var(--clay)", fontStyle: "italic" }}>More clicks.</em> More sales.
          </h2>
          <p style={{ fontSize: 17, color: "var(--ink-3)", lineHeight: 1.5, margin: 0 }}>
            Turn one dull photo into high-converting images for every platform.
          </p>
        </div>

        <div className="outputs-grid">
          <div className="outputs-source">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/design-img/jewelry-input.png" alt="Source phone photo" />
            <div className="outputs-source-meta">
              <span>Source · IMG_4812</span>
              <span style={{ color: "var(--clay)" }}>1 upload →</span>
            </div>
          </div>
          <div className="outputs-tiles">
            {OUTPUT_TILES.map((t, i) => (
              <div className="output-real" key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.src} alt={t.label} loading="lazy" />
                <span className="num">{t.num}</span>
                <span className="label">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="savings">
          <div className="left">
            Replaces <em>$300+</em> in photographer + retoucher fees.
          </div>
          <div className="right">Done in 28 seconds · Pro plan: ${PLANS.pro.priceMonthly}/mo</div>
        </div>
      </div>
    </section>
  );
}

/* ── Section head helper (used by feature sections) ──────────────── */
function SectionHead({
  label,
  title,
  sub,
  num,
}: {
  label: string;
  title: string;
  sub: string;
  num: string;
}) {
  return (
    <div className="section-head">
      <div>
        <div className="uppercase-label">
          {num} · {label}
        </div>
        <h2 dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <p>{sub}</p>
    </div>
  );
}

/* ── Ads section ─────────────────────────────────────────────────── */
const AD_VARIANTS = [
  { platform: "META · FEED", headline: "Chop like a chef,\ncare like a host.", body: "Organic moso bamboo. Juice grooves. Non-slip feet. Built for the kitchen you actually cook in.", cta: "Shop the set →", src: "/design-img/board-context01.png" },
  { platform: "GOOGLE · DISPLAY", headline: "The last cutting\nboard you'll buy.", body: "3 sizes. BPA-free. Antimicrobial bamboo that won't dull your knives. Free shipping today.", cta: "See it →", src: "/design-img/board-studio02.png" },
  { platform: "PINTEREST", headline: "A kitchen worth\nphotographing.", body: "Naturally antimicrobial bamboo. Deep juice grooves. Anti-slip feet. Hand-finished.", cta: "Save →", src: "/design-img/board-model01.png" },
  { platform: "META · STORY", headline: "Personalized.\nPractical.\nPass it down.", body: "The Williams engraved board — host-worthy, hand-finished, free engraving with every order.", cta: "Tap to shop", src: "/design-img/ad-williams-board.png" },
  { platform: "META · FEED", headline: "Organic. Antimicrobial.\nActually pretty.", body: "Moso bamboo, three sizes, deep juice grooves. Starting at $39.", cta: "Add to cart →", src: "/design-img/board-outdoor01.png" },
  { platform: "GOOGLE · SEARCH", headline: "Bamboo Cutting Board Set — 3pc · Free Shipping", body: "Organic moso bamboo · juice grooves · anti-slip · BPA-free · 4.8★ (2,400+)", cta: "shelfready.app/shop", src: "/design-img/board-input.png" },
];

function AdsSection() {
  const [variant, setVariant] = useState(0);
  return (
    <section className="section" id="ads" style={{ background: "var(--paper-2)" }}>
      <div className="container">
        <SectionHead
          num="02"
          label="Ad creatives"
          title="Create ads in <em>30 seconds</em>."
          sub="Stop paying designers. Generate ads that convert instantly."
        />
        <div className="feature-row reverse" style={{ gridTemplateColumns: "1fr" }}>
          <div className="feature-media" style={{ background: "var(--paper)" }}>
            <div className="ads-demo">
              {AD_VARIANTS.map((v, i) => (
                <div
                  key={i}
                  className="ad-card"
                  style={{
                    transform: variant === i ? "scale(1.02)" : "scale(1)",
                    transition: "all .25s",
                    cursor: "pointer",
                  }}
                  onClick={() => setVariant(i)}
                >
                  <div className="platform">
                    <span>{v.platform}</span>
                    <span>{String(i + 1).padStart(2, "0")}/06</span>
                  </div>
                  <div className="visual">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.src}
                      alt={v.platform}
                      loading="lazy"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div className="headline" style={{ whiteSpace: "pre-line" }}>
                    {v.headline}
                  </div>
                  <div className="body">{v.body}</div>
                  <div className="cta">{v.cta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Social section ──────────────────────────────────────────────── */
const SOCIAL_POSTS = [
  { handle: "@kindledkitchen", plat: "Instagram", avatar: "K", src: "/design-img/board-model01.png", body: "A quiet Saturday, one board, every chop of the day. Our personalized Williams board is back in stock. ↗", tags: "#cookathome #etsyfinds #kitchenessentials", meta: "♥ 1.2k · 84 · 3 days" },
  { handle: "Kindled Kitchen", plat: "Facebook", avatar: "K", src: "/design-img/ad-williams-board.png", body: "Why acacia? Naturally antimicrobial, easier on your knives than plastic, and lighter than walnut. Read the full guide on our journal.", tags: "", meta: "👍 842 · 💬 46" },
  { handle: "Kindled Kitchen", plat: "Pinterest", avatar: "K", src: "/design-img/board-context01.png", body: "Host-worthy chopping boards that disappear into your counter. Save for your next dinner party refresh.", tags: "#kitchenstyling #hosting #acacia", meta: "📌 3.4k saves" },
];

function SocialSection() {
  return (
    <section className="section" id="social">
      <div className="container">
        <SectionHead
          num="03"
          label="Social content"
          title="Create content for <em>every platform</em> in seconds."
          sub="Instagram, Etsy, and ads — ready to post instantly."
        />
        <div className="feature-row">
          <div className="feature-media">
            <div className="social-demo">
              {SOCIAL_POSTS.map((p, i) => (
                <div className="social-card" key={i}>
                  <div className="social-head">
                    <div className="avatar">{p.avatar}</div>
                    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                      <span>{p.handle}</span>
                      <span
                        className="mono"
                        style={{
                          fontSize: 9,
                          color: "var(--ink-muted)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.plat}
                      </span>
                    </div>
                  </div>
                  <div className="social-visual">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.src}
                      alt={p.handle}
                      loading="lazy"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div className="social-body">
                    {p.body}
                    {p.tags && (
                      <div style={{ marginTop: 6 }}>
                        <span className="tag">{p.tags}</span>
                      </div>
                    )}
                  </div>
                  <div className="social-footer">
                    <span>{p.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="feature-copy">
            <span className="uppercase-label">Platform-native copy</span>
            <h3>
              Not just cross-posting. <em>Cross-writing.</em>
            </h3>
            <p>
              Character counts, hashtag conventions, emoji density, CTA patterns — each
              platform has unwritten rules. We read them so you don&apos;t have to.
            </p>
            <ul className="feature-bullets">
              <li>
                <span className="num">IG.</span>
                <span>Caption ≤ 125ch before the fold · 3–5 tags · visual-first</span>
              </li>
              <li>
                <span className="num">FB.</span>
                <span>Longer form · link preview · reader-friendly line breaks</span>
              </li>
              <li>
                <span className="num">PT.</span>
                <span>Keyword-dense title · aspirational voice · rich pin ready</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Research section ────────────────────────────────────────────── */
function ResearchSection() {
  const rows: Array<[string, string, string, "hot" | "warm"]> = [
    ["bamboo cutting board set", "18.1k", "High", "hot"],
    ["anti-slip cutting board", "4.3k", "Medium", "hot"],
    ["dishwasher safe bamboo board", "2.1k", "Low", "hot"],
    ["organic moso bamboo board", "1.2k", "Low", "warm"],
    ["large bamboo cutting board", "6.8k", "Medium", "warm"],
  ];
  return (
    <section className="section" id="research" style={{ background: "var(--paper-2)" }}>
      <div className="container">
        <SectionHead
          num="04"
          label="Market research"
          title="What your <em>five closest competitors</em> won't tell you."
          sub="Most sellers lose sales because of poor product photos. Fix that first."
        />
        <div className="feature-row reverse">
          <div className="feature-copy">
            <span className="uppercase-label">Competitive intel</span>
            <h3>
              Every gap is an <em>angle</em>.
            </h3>
            <p>
              ShelfReady scrapes the top 20 competitors in your category, clusters their
              reviews, and surfaces the complaints they haven&apos;t solved. Those are
              your bullet points.
            </p>
            <ul className="feature-bullets">
              <li>
                <span className="num">$.</span>
                <span>Price distribution · where to slot in</span>
              </li>
              <li>
                <span className="num">⌖.</span>
                <span>Keyword gaps · what they forgot to target</span>
              </li>
              <li>
                <span className="num">★.</span>
                <span>Review clusters · pain points &amp; praise</span>
              </li>
              <li>
                <span className="num">⇡.</span>
                <span>Positioning map · unclaimed quadrants</span>
              </li>
            </ul>
          </div>
          <div className="feature-media" style={{ background: "var(--paper)", padding: 0 }}>
            <div className="research-demo">
              <div className="research-head">
                <span>Research · Bamboo cutting boards</span>
                <span>24 competitors · 2,847 reviews</span>
              </div>
              <div className="research-title">Three gaps worth claiming.</div>
              <div className="research-stats">
                <div className="research-stat">
                  <div className="k">Median price</div>
                  <div className="v">$34</div>
                  <div className="d">↗ +12% YoY</div>
                </div>
                <div className="research-stat">
                  <div className="k">Review avg</div>
                  <div className="v">4.3★</div>
                  <div className="d down">↘ warping (38%)</div>
                </div>
                <div className="research-stat">
                  <div className="k">Top unmet need</div>
                  <div className="v">dishwasher</div>
                  <div className="d">↗ 412 mentions</div>
                </div>
              </div>
              <div className="research-table">
                <div className="row head">
                  <span>Keyword</span>
                  <span>Volume</span>
                  <span>Difficulty</span>
                  <span>Opportunity</span>
                </div>
                {rows.map((r, i) => (
                  <div className="row" key={i}>
                    <span>{r[0]}</span>
                    <span className="mono">{r[1]}</span>
                    <span className="mono">{r[2]}</span>
                    <span>
                      <span className={`chip ${r[3]}`}>{r[3] === "hot" ? "HOT" : "WARM"}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Listing section ─────────────────────────────────────────────── */
const LISTING_CARDS = [
  {
    plat: "Amazon",
    tag: "Keyword density",
    c: "#F5CB7A",
    title:
      "Gold Knot Necklace — Dainty 14K Gold-Plated Love Knot Pendant, Minimalist Everyday Jewelry, Anniversary & Bridesmaid Gift for Her",
    bullets: [
      "PREMIUM GOLD-PLATED STAINLESS STEEL — tarnish-resistant, hypoallergenic, long-lasting shine",
      'ADJUSTABLE CHAIN — 16" + 2" extender fits every neckline',
      "ELEGANT LOVE KNOT PENDANT — symbol of connection and eternity",
      "LIGHTWEIGHT & COMFORTABLE for all-day wear",
      "GIFT-READY PACKAGING — ships in a branded gift box",
    ],
  },
  {
    plat: "Etsy",
    tag: "Story-led",
    c: "#F1A472",
    title:
      "Gold Knot Necklace · dainty · symbol of love & connection · everyday jewelry",
    bullets: [
      "A delicate gold knot — the quiet symbol for love that keeps going",
      'Hand-finished gold-plated pendant on a 16" + 2" adjustable chain',
      "Hypoallergenic and tarnish-resistant so it lives where you do",
      "Ships in a gift box for birthdays, bridesmaids, and just-becauses",
      "A little thing that means a lot",
    ],
  },
  {
    plat: "Shopify",
    tag: "Brand voice",
    c: "#C4D1A8",
    title: "The Knot Necklace",
    bullets: [
      "A quiet gold knot, for the everyday.",
      "14K gold-plated · hypoallergenic · tarnish-resistant",
      'Adjustable 16" + 2" chain',
      "Gift-boxed. Always.",
      "Lifetime replacement on manufacturing defects",
    ],
  },
  {
    plat: "eBay",
    tag: "Title-tag density",
    c: "#9EB5C9",
    title:
      "Gold Knot Necklace 14K Gold Plated Love Knot Pendant Dainty Minimalist Chain NEW",
    bullets: [
      "Condition: NEW with tags · ships same business day",
      "Metal: 14K gold-plated stainless steel, hypoallergenic",
      'Chain length: 16" + 2" extender, lobster clasp',
      "Pendant: love knot, ~12mm · weight ~3g",
      "Returns: 30-day free returns, authenticity guaranteed",
    ],
  },
];

function ListingSection() {
  return (
    <section className="section" id="listing">
      <div className="container">
        <SectionHead
          num="05"
          label="Listing optimizer"
          title="Copy-paste listings that <em>rank and convert</em>."
          sub="Generate titles, descriptions, and keywords ready for Etsy, Amazon, and Shopify."
        />
        <div className="listing-showcase">
          <div className="listing-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/design-img/listing-goldknot.png" alt="Gold Knot Necklace listing preview" />
            <div className="listing-preview-cap">
              <span className="mono">Etsy listing preview</span>
              <span>Auto-generated from one photo</span>
            </div>
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                background: "var(--paper-2)",
                border: "1px dashed var(--rule-soft)",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              Image is for representation · Actual output delivered in text / listing-friendly format
            </div>
          </div>
          <div className="listing-cards">
            {LISTING_CARDS.map((l, i) => (
              <div key={i} className="listing-card">
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, background: l.c }} />
                    <span
                      className="mono"
                      style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
                    >
                      {l.plat}
                    </span>
                  </div>
                  <span className="uppercase-label">{l.tag}</span>
                </div>
                <div
                  className="serif"
                  style={{ fontSize: 18, lineHeight: 1.15, letterSpacing: "-0.015em" }}
                >
                  {l.title}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12, color: "var(--ink-3)" }}>
                  {l.bullets.map((b, j) => (
                    <li
                      key={j}
                      style={{
                        padding: "8px 0",
                        borderTop: "1px solid var(--rule-soft)",
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <span className="mono" style={{ color: "var(--clay)", minWidth: 14 }}>
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button className="btn btn-outline" style={{ fontSize: 11, padding: "8px 12px" }}>
                    Copy
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: "8px 12px" }}>
                    Export CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Pricing section — reads from live PLANS constant ────────────── */
const PLAN_COPY: Record<string, { tagline: string; featured?: boolean; badge?: string; features: string[] }> = {
  free: {
    tagline: "Kick the tires.",
    features: [
      "5 product listings / month",
      "5 AI images (lifetime)",
      "5 social posts / month",
      "5 ad copies / month",
      "Watermarked exports",
    ],
  },
  starter: {
    tagline: "For the solo shop.",
    features: [
      "50 listings / month",
      "100 AI images / month",
      "10 AI photoshoots / month",
      "50 social posts · 50 ad creatives",
      "20 market research reports",
      "Priority support",
    ],
  },
  pro: {
    tagline: "The sweet spot.",
    featured: true,
    badge: "Most picked",
    features: [
      "300 listings / month",
      "300 AI images · 30 photoshoots",
      "300 social posts · 300 ad creatives",
      "100 market research reports",
      "Export to CSV / JSON",
      "200+ ad creative templates",
      "Priority support",
    ],
  },
  business: {
    tagline: "For the agency.",
    features: [
      "Unlimited listings & social",
      "1,000 AI images · 100 photoshoots",
      "Unlimited ads & research",
      "Team seats",
      "Dedicated support",
      "Early access to new features",
    ],
  },
};

function PricingSection() {
  const orderedKeys = ["free", "starter", "pro", "business"] as const;
  return (
    <section className="section" id="pricing">
      <div className="container">
        <SectionHead
          num="07"
          label="Pricing"
          title="<em>Start free.</em><br/>Upgrade when you scale."
          sub="Every plan ships with every feature. You're paying for volume, not capability. Cancel any time, prorated to the day."
        />
        <div className="pricing-grid">
          {orderedKeys.map((key, i) => {
            const plan = PLANS[key];
            const copy = PLAN_COPY[key];
            return (
              <div key={key} className={`price-card ${copy.featured ? "featured" : ""}`}>
                {copy.badge && <span className="badge">{copy.badge}</span>}
                <div className="uppercase-label">
                  {String(i + 1).padStart(2, "0")} · Plan
                </div>
                <div className="price-name">{plan.name}</div>
                <div className="price-amount">
                  <span className="v">${plan.priceMonthly}</span>
                  <span className="per">/mo</span>
                </div>
                <p className="price-muted">{copy.tagline}</p>
                <ul className="price-bullets">
                  {copy.features.map((f, j) => (
                    <li key={j}>
                      <span className="mk">—</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`btn ${copy.featured ? "btn-clay" : "btn-outline"} btn-lg`}
                  style={{ justifyContent: "center" }}
                >
                  {plan.priceMonthly === 0 ? "Start free" : `Get ${plan.name}`}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Dark CTA block ──────────────────────────────────────────────── */
function CtaBlock() {
  return (
    <section className="cta-block">
      <div className="container">
        <h2>
          Your product
          <br />
          belongs on the <em>front</em> shelf.
        </h2>
        <p>
          Upload one photo. We&apos;ll handle the rest — listing, photoshoot, ads,
          social, research. Ship in thirty minutes, not thirty days.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" className="btn btn-clay btn-lg">
            Upload your photo — free
          </Link>
          <Link
            href="/use-cases"
            className="btn btn-lg"
            style={{ color: "var(--cream)", border: "1px solid rgba(245,240,230,0.3)" }}
          >
            See use cases
          </Link>
        </div>
        <div
          className="mono"
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "var(--cream)",
            opacity: 0.7,
            letterSpacing: "0.04em",
          }}
        >
          Takes 30 seconds • No credit card needed
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p style={{ color: "var(--ink-3)", maxWidth: 340, marginTop: 16, fontSize: 14, lineHeight: 1.5 }}>
              Every product, shelf-ready in minutes. Built for the sellers who make
              things, not the platforms that sell them.
            </p>
            <div className="uppercase-label" style={{ marginTop: 24 }}>
              shelfready.app
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <Link href="/signup">Studio</Link>
            <Link href="/signup">Listings</Link>
            <Link href="/signup">Photoshoot</Link>
            <Link href="/signup">Ad creatives</Link>
            <Link href="/signup">Social</Link>
            <Link href="/signup">Research</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/use-cases">Use cases</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Start free</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ShelfReady, Inc.</span>
          <span>Made for sellers · vol. 01</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Root ───────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div className="shelf-landing">
      <Nav />
      <Hero />
      <OutputsSection />
      <AdsSection />
      <SocialSection />
      <ResearchSection />
      <ListingSection />
      <HowItWorks />
      <PricingSection />
      <CtaBlock />
      <Footer />
    </div>
  );
}
