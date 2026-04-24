import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import posts from "../../../../content/blog/posts.json";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — ShelfReady Blog`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  /*
   * Lightweight markdown → HTML. Styling uses the editorial palette:
   * clay accents, paper callouts, serif sub-headings, text-muted body.
   */
  const html = post.content
    .replace(/^### (.+)$/gm, '<h3 class="text-[22px] mt-10 mb-3 text-secondary tracking-[-0.01em]" style="font-family:var(--font-display);font-weight:400">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-[28px] mt-14 mb-4 text-secondary tracking-[-0.015em]" style="font-family:var(--font-display);font-weight:400">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-secondary">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-surface-alt border border-border px-1.5 py-0.5 rounded text-[13px]" style="font-family:var(--font-mono)">$1</code>')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, "").replace(/```$/g, "");
      return `<pre class="bg-surface-alt border border-border p-4 text-[13px] overflow-x-auto my-5" style="font-family:var(--font-mono)"><code>${code}</code></pre>`;
    })
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c))) return "";
      const tag = cells[0]?.startsWith("**") ? "th" : "td";
      const cls =
        tag === "th"
          ? "font-semibold text-left p-3 border-b border-border text-secondary"
          : "p-3 border-b border-border/60 text-text-muted";
      return `<tr>${cells.map((c) => `<${tag} class="${cls}">${c}</${tag}>`).join("")}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => `<table class="w-full text-[14px] my-5 border border-border">${match}</table>`)
    .replace(/^\- (.+)$/gm, '<li class="flex gap-3 text-[16px] text-text-muted leading-relaxed mb-2"><span class="text-primary mt-1.5 font-mono text-[11px] tracking-wider">—</span><span>$1</span></li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, (match) => `<ul class="my-4">${match}</ul>`)
    .replace(/^\> (.+)$/gm, '<blockquote class="border-l-2 border-primary pl-5 py-1 my-6 text-secondary italic text-[18px]" style="font-family:var(--font-display)">$1</blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline font-medium">$1</a>')
    .replace(/\n\n/g, '</p><p class="text-[16px] text-text-muted leading-relaxed mb-4">')
    .replace(/^(?!<)(.+)$/gm, (match) => {
      if (match.startsWith("<")) return match;
      return match;
    });

  return (
    <div className="min-h-screen bg-surface text-text">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-surface/85 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-[12px] font-medium text-text-muted hover:text-text uppercase tracking-[0.14em]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Journal
          </Link>
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" className="h-[60px] w-[60px] rounded relative -top-[4px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-wordmark.png" alt="ShelfReady" className="h-[40px] w-auto" />
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        {/* Meta eyebrow */}
        <div
          className="flex items-center gap-3 mb-8 text-[11px] uppercase tracking-[0.18em] text-text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="text-primary">{post.category}</span>
          <span className="w-6 h-px bg-border" />
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readTime}
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.02em] text-secondary mb-6"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          {post.title}
        </h1>
        <p className="text-[18px] text-text-muted leading-relaxed mb-8">{post.excerpt}</p>

        <div
          className="flex items-center gap-4 text-[11px] uppercase tracking-[0.14em] text-text-muted/80 mb-12 pb-10 border-b border-border"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>·</span>
          <span>{post.author}</span>
        </div>

        {/* Content */}
        <div
          className="prose-custom"
          dangerouslySetInnerHTML={{
            __html: `<p class="text-[16px] text-text-muted leading-relaxed mb-4">${html}</p>`,
          }}
        />

        {/* Tags */}
        <div className="mt-14 pt-8 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-text-muted/60" />
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-[0.12em] bg-surface-alt border border-border text-text-muted px-3 py-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA — editorial dark block */}
        <div className="mt-14 bg-secondary text-[#FAF6EC] px-8 sm:px-12 py-12 text-center">
          <p
            className="text-[11px] uppercase tracking-[0.22em] text-[#E3D9C4] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Enough reading
          </p>
          <h3
            className="text-[clamp(24px,3vw,40px)] leading-[1] tracking-[-0.02em] mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            Turn 1 photo into <em className="italic text-primary-light">everything</em> you need to sell.
          </h3>
          <p className="text-[#C9BFA8] text-[14px] mb-6 max-w-md mx-auto">
            Generate your first listing, photoshoot, or ad in under a minute. Free plan — no credit card.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-[#FAF6EC] px-6 py-3 text-[14px] font-semibold rounded transition-colors"
          >
            Start free
          </Link>
        </div>
      </article>
    </div>
  );
}
