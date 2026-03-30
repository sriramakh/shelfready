import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import posts from "../../../content/blog/posts.json";

export const metadata = {
  title: "Blog — ShelfReady",
  description: "E-commerce tips, AI product photography guides, listing optimization strategies, and ad creative best practices for Amazon, Etsy, and Shopify sellers.",
  openGraph: { title: "ShelfReady Blog", description: "AI-powered e-commerce insights" },
};

export default function BlogPage() {
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-neutral-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="ShelfReady" className="h-7 w-7 rounded-lg" />
            <span className="font-semibold text-[15px]">ShelfReady</span>
          </Link>
          <Link href="/signup" className="text-[13px] font-medium bg-neutral-900 text-white px-4 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Blog</h1>
        <p className="text-neutral-500 text-lg mb-12">E-commerce insights, guides, and strategies powered by AI.</p>

        {/* Featured post */}
        <Link href={`/blog/${featured.slug}`} className="group block mb-16">
          <div className="bg-neutral-50 rounded-3xl p-8 sm:p-10 hover:bg-neutral-100 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{featured.category}</span>
              <span className="text-[12px] text-neutral-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readTime}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 group-hover:text-blue-600 transition-colors">{featured.title}</h2>
            <p className="text-neutral-500 leading-relaxed mb-4 max-w-2xl">{featured.excerpt}</p>
            <div className="flex items-center gap-2 text-[13px] text-neutral-400">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(featured.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              <span className="mx-2">·</span>
              {featured.author}
            </div>
          </div>
        </Link>

        {/* Rest */}
        <div className="grid sm:grid-cols-2 gap-6">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <div className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 hover:shadow-lg transition-all h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{post.category}</span>
                  <span className="text-[11px] text-neutral-400">{post.readTime}</span>
                </div>
                <h3 className="text-lg font-bold tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                <p className="text-[14px] text-neutral-500 leading-relaxed flex-1">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-1 text-[13px] font-medium text-blue-600">
                  Read more <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
