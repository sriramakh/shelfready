"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, Sparkles, ArrowLeft } from "lucide-react";
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

export default function ResearchPage() {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);

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
      setError(
        err instanceof Error
          ? err.message
          : "Failed to perform research. You may need a Starter plan or higher.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg p-2 hover:bg-surface-alt transition-colors text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            Competitor Intelligence + Market Insights
          </h1>
          <p className="text-text-muted mt-1">
            Analyze competitors and find market opportunities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Form */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-600" />
              Research Query
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSearch} className="space-y-5">
              <Textarea
                label="What to Research"
                placeholder="e.g., 'Organic baby blankets on Amazon' or 'Top-selling kitchen gadgets under $25'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />

              <Input
                label="Category"
                placeholder="e.g., Baby Products, Home & Kitchen"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? "Researching..." : "Start Research"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {!result && !loading && (
            <EmptyState
              icon={Search}
              title="Start your research"
              description="Enter a product niche or competitor to analyze market trends, keywords, and opportunities."
            />
          )}

          {loading && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                </div>
                <p className="mt-4 text-sm font-medium text-text-muted">
                  Analyzing market data...
                </p>
                <p className="text-xs text-text-muted mt-1">
                  This may take 15-30 seconds
                </p>
              </CardBody>
            </Card>
          )}

          {result && (
            <>
              {/* Analysis */}
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-secondary">
                    Market Analysis
                  </h3>
                  <CopyButton text={result.analysis} />
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                    {result.analysis}
                  </p>
                </CardBody>
              </Card>

              {/* Keywords */}
              {result.keywords_found && result.keywords_found.length > 0 && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary">
                      Top Keywords ({result.keywords_found.length})
                    </h3>
                    <CopyButton text={result.keywords_found.join(", ")} />
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords_found.map((kw, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                        >
                          {typeof kw === "string" ? kw : JSON.stringify(kw)}
                        </span>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Competitors */}
              {result.competitors && result.competitors.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold text-secondary">
                      Competitors ({result.competitors.length})
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      {result.competitors.map((comp, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-secondary">
                              {comp.name}
                            </h4>
                            {comp.price_range && (
                              <span className="text-xs text-text-muted bg-surface-alt px-2 py-0.5 rounded-full">
                                {comp.price_range}
                              </span>
                            )}
                          </div>
                          {comp.strengths && (
                            <p className="text-xs text-text-muted mb-1">
                              <span className="text-emerald-600 font-medium">Strengths:</span>{" "}
                              {comp.strengths}
                            </p>
                          )}
                          {comp.weaknesses && (
                            <p className="text-xs text-text-muted">
                              <span className="text-amber-600 font-medium">Weaknesses:</span>{" "}
                              {comp.weaknesses}
                            </p>
                          )}
                        </div>
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
