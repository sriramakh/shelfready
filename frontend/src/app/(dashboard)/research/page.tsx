"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { ErrorOrQuota, getQuotaMessage } from "@/components/shared/quota-exceeded";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { FormattedText } from "@/components/shared/formatted-output";
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

  const sections = useMemo(
    () => (result ? parseAnalysisSections(result.analysis) : []),
    [result]
  );

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
        {/* Form (narrow) */}
        <div>
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
              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label="Keywords"
                  value={result.keywords_found.length}
                  icon={TrendingUp}
                  color="emerald"
                />
                <StatCard
                  label="Competitors"
                  value={result.competitors.length}
                  icon={Users}
                  color="purple"
                />
                <StatCard
                  label="Insights"
                  value={sections.length}
                  icon={Lightbulb}
                  color="blue"
                />
              </div>

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

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof TrendingUp;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  };
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-surface-alt p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-secondary leading-none">{value}</p>
        <p className="text-xs text-text-muted mt-1">{label}</p>
      </div>
    </div>
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
