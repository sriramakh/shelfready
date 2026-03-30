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

  // Simple markdown-to-HTML (handles ##, **, ```, -, |, [], >)
  const html = post.content
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="bg-neutral-100 px-1.5 py-0.5 rounded text-[13px]">$1</code>')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, "").replace(/```$/g, "");
      return `<pre class="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-[13px] overflow-x-auto my-4"><code>${code}</code></pre>`;
    })
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c))) return "";
      const tag = cells[0]?.startsWith("**") ? "th" : "td";
      const cls = tag === "th" ? "font-semibold text-left p-2 border-b border-neutral-200" : "p-2 border-b border-neutral-100";
      return `<tr>${cells.map((c) => `<${tag} class="${cls}">${c}</${tag}>`).join("")}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => `<table class="w-full text-[14px] my-4">${match}</table>`)
    .replace(/^\- (.+)$/gm, '<li class="flex gap-2 text-[15px] text-neutral-600 mb-1.5"><span class="text-blue-500 mt-1.5">•</span><span>$1</span></li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, (match) => `<ul class="my-3">${match}</ul>`)
    .replace(/^\> (.+)$/gm, '<blockquote class="border-l-4 border-blue-200 pl-4 py-2 my-4 text-neutral-600 italic">$1</blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline font-medium">$1</a>')
    .replace(/\n\n/g, '</p><p class="text-[16px] text-neutral-600 leading-relaxed mb-4">')
    .replace(/^(?!<)(.+)$/gm, (match) => {
      if (match.startsWith("<")) return match;
      return match;
    });

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-neutral-100 bg-white sticky top-0 z-50 backdrop-blur-xl bg-white/80">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="ShelfReady" className="h-6 w-6 rounded-md" />
            <span className="font-semibold text-[14px]">ShelfReady</span>
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{post.category}</span>
          <span className="text-[12px] text-neutral-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-4">{post.title}</h1>
        <p className="text-lg text-neutral-500 leading-relaxed mb-6">{post.excerpt}</p>

        <div className="flex items-center gap-4 text-[13px] text-neutral-400 mb-10 pb-10 border-b border-neutral-100">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span>·</span>
          <span>{post.author}</span>
        </div>

        {/* Content */}
        <div
          className="prose-custom [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 [&_strong]:text-neutral-900 [&_a]:text-blue-600 [&_a:hover]:underline"
          dangerouslySetInnerHTML={{ __html: `<p class="text-[16px] text-neutral-600 leading-relaxed mb-4">${html}</p>` }}
        />

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-neutral-100">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-neutral-300" />
            {post.tags.map((tag) => (
              <span key={tag} className="text-[12px] bg-neutral-50 border border-neutral-200 text-neutral-500 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-neutral-900 rounded-3xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to try ShelfReady?</h3>
          <p className="text-neutral-400 text-[14px] mb-6">Generate your first listing, photoshoot, or ad creative in under a minute.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-xl text-[14px] font-semibold hover:bg-neutral-100 transition-colors">
            Get Started Free
          </Link>
        </div>
      </article>
    </div>
  );
}
