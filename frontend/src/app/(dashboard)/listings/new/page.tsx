"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { cn, sanitizeHtml } from "@/lib/utils";
import { PLATFORMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ErrorOrQuota, getQuotaMessage } from "@/components/shared/quota-exceeded";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import type { ListingGenerateRequest, ListingResponse } from "@/types/api";
import { Sparkles, FileText, ArrowLeft, Eye, Code } from "lucide-react";
import Link from "next/link";

interface ListingSummary {
  id: string;
  platform: string;
  product_name: string;
  generated_title?: string;
  created_at?: string;
}

type Platform = keyof typeof PLATFORMS;

const platformEntries = Object.entries(PLATFORMS) as [
  Platform,
  (typeof PLATFORMS)[Platform],
][];

export default function NewListingPage() {
  const { session } = useAuth();
  const [platform, setPlatform] = useState<Platform>("amazon");
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ListingResponse | null>(null);
  const [descView, setDescView] = useState<"preview" | "html">("preview");
  const [history, setHistory] = useState<ListingSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Load recent listings on mount
  useEffect(() => {
    if (!session?.access_token) return;
    (async () => {
      try {
        const data = await api.getListings(session.access_token, 1) as ListingSummary[] | { items: ListingSummary[] };
        const items = Array.isArray(data) ? data : (data.items || []);
        setHistory(items);
        if (!result && items.length > 0) {
          // Load full data for the most recent
          const full = await api.getListing(items[0].id, session.access_token) as ListingResponse;
          setResult(full);
        }
      } catch {
        // silent
      } finally {
        setHistoryLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const loadFromHistory = async (id: string) => {
    if (!session?.access_token) return;
    try {
      const full = await api.getListing(id, session.access_token) as ListingResponse;
      setResult(full);
    } catch {}
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const payload: ListingGenerateRequest = {
        platform,
        product_name: productName,
        product_details: productDetails,
        target_audience: targetAudience || undefined,
        category: category || undefined,
      };

      const data = (await api.generateListing(
        payload,
        session.access_token,
      )) as ListingResponse;

      setResult(data);
      // Prepend to history
      setHistory((h) => [
        {
          id: data.id,
          platform: data.platform,
          product_name: data.product_name,
          generated_title: data.generated_title,
          created_at: (data as { created_at?: string }).created_at,
        },
        ...h.filter((x) => x.id !== data.id),
      ]);
    } catch (err) {
      const quota = getQuotaMessage(err);
      setError(
        quota || (err instanceof Error ? err.message : "Failed to generate listing. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/listings"
          className="rounded-lg p-2 hover:bg-surface-alt dark:hover:bg-white/5 transition-colors text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            Generate New Listing
          </h1>
          <p className="text-text-muted mt-0.5 text-sm">
            Describe your product and let AI create an optimized listing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* Form + History */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-4 lg:pr-1">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Product Details
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Platform selector */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Platform
                </label>
                <div className="flex gap-2">
                  {platformEntries.map(([key, plat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlatform(key)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                        platform === key
                          ? "border-transparent shadow-sm"
                          : "border-border bg-white text-text-muted hover:bg-surface-alt",
                      )}
                      style={
                        platform === key
                          ? {
                              backgroundColor: `${plat.color}15`,
                              color: plat.color,
                              borderColor: `${plat.color}40`,
                            }
                          : undefined
                      }
                    >
                      {plat.name}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Product Name"
                placeholder="e.g., Organic Cotton Baby Blanket"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />

              <Textarea
                label="Product Details"
                placeholder="Describe your product including materials, features, sizes, colors, and any unique selling points..."
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                required
              />

              <Input
                label="Target Audience"
                placeholder="e.g., New parents, eco-conscious shoppers"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />

              <Input
                label="Category"
                placeholder="e.g., Baby Products, Home & Kitchen"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />

              {error && <ErrorOrQuota error={error} />}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? "Generating..." : "Generate Listing"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <HistoryPanel
          items={history.map((l) => ({
            id: l.id,
            label: l.product_name,
            subtitle: l.generated_title || l.platform,
            timestamp: l.created_at,
          }))}
          activeId={result?.id}
          loading={historyLoading}
          onSelect={loadFromHistory}
          title="Recent Listings"
          emptyText="No listings yet. Generate your first one above."
          accentColor="primary"
        />
        </div>

        {/* Results */}
        <div className="space-y-4 min-w-0">
          {!result && !loading && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-24 text-center">
                <div className="rounded-2xl bg-surface-alt dark:bg-white/5 p-4 mb-4">
                  <Sparkles className="h-8 w-8 text-text-muted" />
                </div>
                <h3 className="text-base font-semibold text-secondary mb-1">
                  Your listing will appear here
                </h3>
                <p className="text-sm text-text-muted max-w-xs">
                  Fill out the form and click Generate to create your optimized
                  product listing.
                </p>
              </CardBody>
            </Card>
          )}

          {loading && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-24">
                <div className="h-14 w-14 rounded-full border-4 border-surface-alt dark:border-white/10 border-t-primary animate-spin" />
                <p className="mt-5 text-sm font-semibold text-secondary">
                  AI is crafting your listing...
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Typically 10-15 seconds
                </p>
              </CardBody>
            </Card>
          )}

          {result && (
            <>
              {/* Top row: Title (2/3) + Keywords (1/3) */}
              <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-secondary">
                        Optimized Title
                      </h3>
                      <Badge
                        style={{
                          backgroundColor: `${PLATFORMS[platform].color}15`,
                          color: PLATFORMS[platform].color,
                        }}
                      >
                        {PLATFORMS[platform].name}
                      </Badge>
                      <span className="text-[10px] text-text-muted">
                        {result.generated_title.length} chars
                      </span>
                    </div>
                    <CopyButton text={result.generated_title} />
                  </CardHeader>
                  <CardBody>
                    <p className="text-base font-semibold text-secondary leading-snug">
                      {result.generated_title}
                    </p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary">
                      Keywords ({result.generated_keywords.length})
                    </h3>
                    <CopyButton
                      text={result.generated_keywords.join(", ")}
                    />
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-wrap gap-1.5">
                      {result.generated_keywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Middle row: Bullet Points + Description side-by-side on xl */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Bullet Points */}
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary">
                      Bullet Points ({result.generated_bullets.length})
                    </h3>
                    <CopyButton
                      text={result.generated_bullets.join("\n")}
                    />
                  </CardHeader>
                  <CardBody>
                    <ul className="space-y-3">
                      {result.generated_bullets.map((bullet, i) => (
                        <li
                          key={i}
                          className="flex gap-3 text-sm text-text leading-relaxed"
                        >
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="flex-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary">
                      Description
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => setDescView("preview")}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 font-medium transition-colors cursor-pointer",
                            descView === "preview"
                              ? "bg-primary text-white"
                              : "bg-white dark:bg-surface text-text-muted hover:bg-surface-alt dark:hover:bg-white/5",
                          )}
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setDescView("html")}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 font-medium transition-colors cursor-pointer",
                            descView === "html"
                              ? "bg-primary text-white"
                              : "bg-white dark:bg-surface text-text-muted hover:bg-surface-alt dark:hover:bg-white/5",
                          )}
                        >
                          <Code className="h-3 w-3" />
                          HTML
                        </button>
                      </div>
                      <CopyButton text={result.generated_description} />
                    </div>
                  </CardHeader>
                  <CardBody>
                    {descView === "preview" ? (
                      <div className="rounded-lg border border-border bg-white dark:bg-surface p-4">
                        <p className="text-[10px] text-text-muted mb-3 font-semibold uppercase tracking-wider">
                          {PLATFORMS[platform].name} Preview
                        </p>
                        <div
                          className="text-sm text-text leading-relaxed [&_b]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1 [&_li]:text-sm [&_p]:my-2"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(result.generated_description),
                          }}
                        />
                      </div>
                    ) : (
                      <pre className="rounded-lg bg-slate-900 text-slate-100 p-4 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words font-mono">
                        {result.generated_description}
                      </pre>
                    )}
                  </CardBody>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
