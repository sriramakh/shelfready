"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { ErrorOrQuota, getQuotaMessage } from "@/components/shared/quota-exceeded";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { FormattedText } from "@/components/shared/formatted-output";
import { HistoryPanel } from "@/components/shared/history-panel";
import {
  Search, Sparkles, ArrowLeft, TrendingUp, Target, DollarSign,
  Lightbulb, AlertTriangle, CheckCircle2, Users, BarChart3, MapPin,
} from "lucide-react";
import Link from "next/link";

interface Competitor {
  name: string;
  strengths?: string;
  weaknesses?: string;
  price_range?: string;
}

interface ResearchResult {
  id: string;
  query: string;
  analysis: string;
  keywords_found: string[];
  competitors: Competitor[];
}

interface AnalysisSection {
  heading: string;
  body: string;
  icon: typeof TrendingUp;
  color: string;
}

const SECTION_ICONS: Record<string, { icon: typeof TrendingUp; color: string }> = {
  "Executive Summary": { icon: Target, color: "blue" },
  "Market Analysis": { icon: TrendingUp, color: "emerald" },
  "Competitive Landscape": { icon: Users, color: "purple" },
  "Pricing Intelligence": { icon: DollarSign, color: "amber" },
  "Recommended Positioning": { icon: MapPin, color: "blue" },
  "Opportunities": { icon: Lightbulb, color: "emerald" },
  "Threats": { icon: AlertTriangle, color: "amber" },
  "Action Items": { icon: CheckCircle2, color: "blue" },
};

function parsePrice(range: string): number | null {
  const nums = range.match(/\d+(\.\d+)?/g);
  if (!nums) return null;
  const parsed = nums.map(Number).filter((n) => n > 0 && n < 10000);
  if (!parsed.length) return null;
  return parsed.reduce((a, b) => a + b, 0) / parsed.length;
}

function medianPrice(competitors: Competitor[]): string | null {
  const prices = competitors
    .map((c) => c.price_range)
    .filter((r): r is string => !!r)
    .map(parsePrice)
    .filter((n): n is number => n != null)
    .sort((a, b) => a - b);
  if (!prices.length) return null;
  const mid = Math.floor(prices.length / 2);
  const med = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  return `$${med < 20 ? med.toFixed(2).replace(/\.?0+$/, "") : Math.round(med)}`;
}

function priceRangeSummary(competitors: Competitor[]): string | null {
  const prices = competitors
    .map((c) => c.price_range)
    .filter((r): r is string => !!r)
    .map(parsePrice)
    .filter((n): n is number => n != null);
  if (!prices.length) return null;
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  if (lo === hi) return null;
  return `$${Math.round(lo)}–$${Math.round(hi)} range`;
}

const STOPWORDS = new Set([
  "the", "and", "with", "from", "that", "this", "have", "they", "their", "some",
  "many", "lack", "lacks", "limited", "poor", "less", "more", "most", "other",
  "often", "such", "than", "into", "onto", "also", "very", "only", "just",
  "like", "over", "under", "about", "against", "between", "through", "being",
  "product", "products", "brand", "brands", "customer", "customers", "user",
  "users", "review", "reviews", "quality", "price", "offer", "offers", "offering",
  "provides", "provide", "providing", "features", "feature",
]);

function topGap(competitors: Competitor[]): string | null {
  const counts = new Map<string, number>();
  for (const c of competitors) {
    if (!c.weaknesses) continue;
    const words = c.weaknesses.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
    const seen = new Set<string>();
    for (const w of words) {
      if (STOPWORDS.has(w) || seen.has(w)) continue;
      seen.add(w);
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  if (!counts.size) return null;
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [word, count] = entries[0];
  return count >= 2 ? word : null;
}

function topGapCount(competitors: Competitor[], word: string): number {
  let n = 0;
  for (const c of competitors) {
    if (c.weaknesses?.toLowerCase().includes(word)) n++;
  }
  return n;
}

function scoreKeyword(kw: string): {
  difficulty: "Low" | "Medium" | "High";
  opportunity: "HOT" | "WARM" | "COLD";
} {
  const words = kw.trim().split(/\s+/).length;
  if (words >= 4) return { difficulty: "Low", opportunity: "HOT" };
  if (words === 3) return { difficulty: "Medium", opportunity: "HOT" };
  if (words === 2) return { difficulty: "Medium", opportunity: "WARM" };
  return { difficulty: "High", opportunity: "WARM" };
}

function extractHeadline(analysis: string, competitors: Competitor[]): string {
  const oppMatch = analysis.match(/\*\*Opportunities\*\*:?\s*\n+([\s\S]+?)(?=\n\*\*|$)/i);
  if (oppMatch) {
    const first = oppMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)[0];
    if (first) {
      const cleaned = first
        .replace(/^[-*\d.)\s]+/, "")
        .replace(/\*\*(.+?)\*\*:?/g, "$1")
        .replace(/\[(impact|effort)[^\]]*\]/gi, "")
        .trim()
        .split(/[.:–—]/)[0]
        .trim();
      if (cleaned.length > 5 && cleaned.length < 90) {
        return cleaned.endsWith(".") ? cleaned : `${cleaned}.`;
      }
    }
  }
  return competitors.length
    ? `${competitors.length} competitors analyzed.`
    : "Market snapshot.";
}

function parseAnalysisSections(analysis: string): AnalysisSection[] {
  if (!analysis) return [];

  const sections: AnalysisSection[] = [];
  const lines = analysis.split("\n");
  let currentHeading = "";
  let currentBody: string[] = [];

  const flush = () => {
    if (currentHeading && currentBody.length > 0) {
      const meta = SECTION_ICONS[currentHeading] || { icon: BarChart3, color: "emerald" };
      sections.push({
        heading: currentHeading,
        body: currentBody.join("\n").trim(),
        icon: meta.icon,
        color: meta.color,
      });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const headerMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/) || trimmed.match(/^##\s+(.+?)\s*$/);
    if (headerMatch) {
      flush();
      currentHeading = headerMatch[1].trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  flush();

  // If no sections were parsed, treat whole text as single section
  if (sections.length === 0 && analysis.trim()) {
    sections.push({
      heading: "Analysis",
      body: analysis,
      icon: BarChart3,
      color: "emerald",
    });
  }

  return sections;
}

export default function ResearchPage() {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [history, setHistory] = useState<ResearchResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const sections = useMemo(
    () => (result ? parseAnalysisSections(result.analysis) : []),
    [result]
  );

  // Load history on mount + after each new generation
  useEffect(() => {
    if (!session?.access_token) return;
    (async () => {
      try {
        const data = (await api.getResearchHistory(session.access_token)) as {
          items?: ResearchResult[];
        } | ResearchResult[];
        const items: ResearchResult[] = Array.isArray(data) ? data : (data.items || []);
        setHistory(items);
        // If no active result, show most recent
        if (!result && items.length > 0) {
          setResult(items[0]);
        }
      } catch {
        // silent - may be empty
      } finally {
        setHistoryLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const data = (await api.searchResearch(
        { query, category: category || undefined },
        session.access_token,
      )) as ResearchResult;

      setResult(data);
      // Prepend to history
      setHistory((h) => [data, ...h.filter((x) => x.id !== data.id)]);
    } catch (err) {
      const quotaMsg = getQuotaMessage(err);
      setError(
        quotaMsg || (err instanceof Error ? err.message : "Failed to perform research. You may need a Starter plan or higher."),
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
          href="/dashboard"
          className="rounded-lg p-2 hover:bg-surface-alt dark:hover:bg-white/5 transition-colors text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-secondary">
            Competitor Intelligence &amp; Market Insights
          </h1>
          <p className="text-text-muted mt-0.5 text-sm">
            Live competitive analysis, keyword gaps, pricing intelligence, and actionable recommendations
          </p>
        </div>
      </div>

      {/* Main 2-column layout: narrow form, wide results */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* Form (narrow) + History */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader>
              <h2 className="text-base font-semibold text-secondary flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-600" />
                Research Query
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSearch} className="space-y-4">
                <Textarea
                  label="What to Research"
                  placeholder="e.g., 'Organic baby blankets on Amazon' or 'Top-selling kitchen gadgets under $25'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={5}
                  required
                />

                <Input
                  label="Category (optional)"
                  placeholder="e.g., Baby Products"
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
                  {loading ? "Researching..." : "Start Research"}
                </Button>

                <p className="text-[11px] text-text-muted leading-relaxed">
                  Multi-pass pipeline: 11 parallel searches → structured data extraction → strategic analysis. Takes ~1-2 minutes.
                </p>
              </form>
            </CardBody>
          </Card>

          {/* History */}
          <HistoryPanel
            items={history.map((r) => ({
              id: r.id,
              label: r.query,
              subtitle: `${r.competitors?.length || 0} competitors · ${r.keywords_found?.length || 0} keywords`,
              timestamp: (r as { created_at?: string }).created_at,
            }))}
            activeId={result?.id}
            loading={historyLoading}
            onSelect={(id) => {
              const found = history.find((r) => r.id === id);
              if (found) setResult(found);
            }}
            title="Past Research"
            emptyText="No research yet. Start your first query above."
            accentColor="emerald"
          />
        </div>

        {/* Results (wide) */}
        <div className="space-y-4 min-w-0">
          {!result && !loading && (
            <EmptyState
              icon={Search}
              title="Start your competitive intelligence"
              description="Enter a product niche or competitor to get market analysis, keyword gaps, pricing intelligence, and prioritized opportunities."
            />
          )}

          {loading && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-24">
                <div className="h-14 w-14 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                <p className="mt-5 text-sm font-semibold text-secondary">
                  Analyzing market data...
                </p>
                <div className="mt-3 space-y-1.5 text-xs text-text-muted text-center max-w-xs">
                  <p>⟳ Running 11 parallel searches</p>
                  <p>⟳ Extracting competitors and pricing</p>
                  <p>⟳ Generating strategic insights</p>
                </div>
              </CardBody>
            </Card>
          )}

          {result && (
            <>
              <ExecutiveSummary result={result} />

              {/* Analysis sections grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((s, i) => (
                  <SectionCard key={i} section={s} />
                ))}
              </div>

              {/* Competitors grid */}
              {result.competitors && result.competitors.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold text-secondary flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      Competitor Profiles ({result.competitors.length})
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {result.competitors.map((comp, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border dark:bg-surface p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-secondary leading-tight">
                              {comp.name}
                            </h4>
                            {comp.price_range && (
                              <span className="text-[10px] font-semibold text-text-muted bg-surface-alt dark:bg-white/5 px-2 py-0.5 rounded flex-shrink-0">
                                {comp.price_range}
                              </span>
                            )}
                          </div>
                          {comp.strengths && (
                            <div className="mb-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
                                Strengths
                              </p>
                              <p className="text-xs text-text leading-relaxed">
                                {comp.strengths}
                              </p>
                            </div>
                          )}
                          {comp.weaknesses && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-0.5">
                                Weaknesses
                              </p>
                              <p className="text-xs text-text leading-relaxed">
                                {comp.weaknesses}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Keywords */}
              {result.keywords_found && result.keywords_found.length > 0 && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Keyword Opportunities ({result.keywords_found.length})
                    </h3>
                    <CopyButton text={result.keywords_found.join(", ")} />
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywords_found.map((kw, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                        >
                          {typeof kw === "string" ? kw : JSON.stringify(kw)}
                        </span>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ExecutiveSummary({ result }: { result: ResearchResult }) {
  const competitors = result.competitors || [];
  const keywords = result.keywords_found || [];

  const median = medianPrice(competitors);
  const priceSpread = priceRangeSummary(competitors);
  const gap = topGap(competitors);
  const gapCount = gap ? topGapCount(competitors, gap) : 0;
  const headline = extractHeadline(result.analysis, competitors);

  const scored = keywords
    .map((kw) => (typeof kw === "string" ? kw : JSON.stringify(kw)))
    .filter((kw) => kw.length >= 2)
    .slice(0, 8)
    .map((kw) => ({ kw, ...scoreKeyword(kw) }));

  return (
    <Card>
      <CardBody className="p-5 md:p-6">
        {/* Top meta line */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-4">
          <span>Research · {result.query.slice(0, 60)}{result.query.length > 60 ? "…" : ""}</span>
          <span>
            {competitors.length} Competitors · {keywords.length} Keywords
          </span>
        </div>

        <div className="h-px bg-border mb-5" />

        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-bold text-secondary tracking-tight mb-5 leading-tight">
          {headline}
        </h2>

        {/* KPI tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <KPI
            label="Median Price"
            value={median ?? "—"}
            hint={priceSpread ?? (median ? "Based on listed prices" : "No pricing data")}
            tone="emerald"
            icon={DollarSign}
          />
          <KPI
            label="Competitors"
            value={String(competitors.length)}
            hint={`${competitors.filter((c) => c.weaknesses).length} with known weaknesses`}
            tone="purple"
            icon={Users}
          />
          <KPI
            label="Top Unmet Need"
            value={gap ?? "—"}
            hint={gap ? `${gapCount} competitor${gapCount === 1 ? "" : "s"} cited` : "No pattern detected"}
            tone="amber"
            icon={Lightbulb}
          />
        </div>

        {/* Keyword opportunity table */}
        {scored.length > 0 && (
          <div>
            <div className="grid grid-cols-[1fr_80px_100px_90px] gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted pb-2 border-b border-border">
              <span>Keyword</span>
              <span className="text-right">Length</span>
              <span>Difficulty</span>
              <span>Opportunity</span>
            </div>
            {scored.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_100px_90px] gap-3 py-3 border-b border-border/50 items-center text-sm"
              >
                <span className="text-secondary font-medium truncate">{row.kw}</span>
                <span className="text-right text-text-muted text-xs">
                  {row.kw.split(/\s+/).length}w
                </span>
                <span className="text-text text-xs">{row.difficulty}</span>
                <span>
                  <OpportunityBadge level={row.opportunity} />
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function KPI({
  label,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "emerald" | "purple" | "amber" | "blue";
  icon: typeof TrendingUp;
}) {
  const tones: Record<string, { text: string; bg: string; ring: string }> = {
    emerald: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", ring: "ring-emerald-100 dark:ring-emerald-900/40" },
    purple: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30", ring: "ring-purple-100 dark:ring-purple-900/40" },
    amber: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", ring: "ring-amber-100 dark:ring-amber-900/40" },
    blue: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", ring: "ring-blue-100 dark:ring-blue-900/40" },
  };
  const c = tones[tone];
  return (
    <div className={`rounded-xl border border-border p-4 ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
          {label}
        </p>
        <Icon className={`h-3.5 w-3.5 ${c.text}`} />
      </div>
      <p className={`text-3xl font-bold ${c.text} leading-tight tracking-tight truncate`}>
        {value}
      </p>
      <p className="text-[11px] text-text-muted mt-1.5 leading-snug">{hint}</p>
    </div>
  );
}

function OpportunityBadge({ level }: { level: "HOT" | "WARM" | "COLD" }) {
  const styles: Record<string, string> = {
    HOT: "bg-red-600 text-white dark:bg-red-500",
    WARM: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    COLD: "bg-surface-alt text-text-muted",
  };
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider ${styles[level]}`}>
      {level}
    </span>
  );
}

function SectionCard({ section }: { section: AnalysisSection }) {
  const Icon = section.icon;
  const colors: Record<string, { text: string; bg: string; border: string }> = {
    emerald: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900/50" },
    blue: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/50" },
    purple: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900/50" },
    amber: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/50" },
  };
  const c = colors[section.color] || colors.emerald;

  return (
    <Card className="h-full">
      <CardBody>
        <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
              <Icon className={`h-4 w-4 ${c.text}`} />
            </div>
            <h3 className="text-sm font-bold text-secondary">{section.heading}</h3>
          </div>
          <CopyButton text={section.body} />
        </div>
        <FormattedText text={section.body} accentColor={section.color} />
      </CardBody>
    </Card>
  );
}
