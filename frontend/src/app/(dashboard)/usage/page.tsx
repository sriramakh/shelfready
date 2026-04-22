"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { formatNumber, formatDate } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/shared/loading-spinner";
import type { UsageCurrent, UsageLogEntry } from "@/types/api";
import { BarChart3, Clock, Zap, TrendingUp, RefreshCw, AlertTriangle } from "lucide-react";

const FEATURE_META: Record<string, { label: string; color: string }> = {
  listing:    { label: "Listings",        color: "#2563eb" },
  image:      { label: "Images",          color: "#7c3aed" },
  photoshoot: { label: "Photoshoot Runs", color: "#a855f7" },
  social:     { label: "Social Posts",    color: "#ec4899" },
  ad:         { label: "Ad Copy",         color: "#f59e0b" },
  research:   { label: "Research",        color: "#10b981" },
  vision:     { label: "Vision Extracts", color: "#0ea5e9" },
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  const days = Math.floor(secs / 86400);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function UsagePage() {
  const { session } = useAuth();
  const [usage, setUsage] = useState<UsageCurrent | null>(null);
  const [history, setHistory] = useState<UsageLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const [u, h] = await Promise.all([
        api.getCurrentUsage(session.access_token) as Promise<UsageCurrent>,
        api.getUsageHistory(session.access_token) as Promise<UsageLogEntry[]>,
      ]);
      setUsage(u);
      setHistory(Array.isArray(h) ? h : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load usage.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardBody className="flex flex-col items-center text-center py-12">
            <AlertTriangle className="h-8 w-8 text-amber-500 mb-3" />
            <h3 className="text-base font-semibold text-secondary mb-1">Couldn't load usage</h3>
            <p className="text-sm text-text-muted mb-4">{error}</p>
            <button onClick={onRefresh} className="text-sm text-primary hover:underline">
              Try again
            </button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const featureEntries = usage ? Object.entries(usage.features) : [];
  const total = usage?.total;
  const totalPct = total && total.limit > 0 ? Math.min(100, Math.round((total.used / total.limit) * 100)) : 0;
  const isUnlimited = total?.limit === -1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-text-muted" />
            Usage
          </h1>
          <p className="text-text-muted mt-1">Monthly quota across all features</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Aggregate */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              This Month
            </h2>
            {total && !isUnlimited && (
              <Badge variant={totalPct > 80 ? "danger" : "primary"}>{totalPct}% used</Badge>
            )}
            {isUnlimited && <Badge variant="primary">Unlimited</Badge>}
          </div>
        </CardHeader>
        <CardBody>
          {total ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">
                    {formatNumber(total.used)}
                    {!isUnlimited && ` of ${formatNumber(total.limit)}`} requests
                  </span>
                  {!isUnlimited && (
                    <span className="text-sm font-medium text-text">
                      {formatNumber(total.remaining)} remaining
                    </span>
                  )}
                </div>
                {!isUnlimited && (
                  <div className="h-3 rounded-full bg-surface-alt overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min(totalPct, 100)}%`,
                        backgroundColor: totalPct > 80 ? "#ef4444" : "#2563eb",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <Stat icon={TrendingUp} label="Plan" value={usage?.plan || "—"} />
                <Stat
                  icon={Zap}
                  label="Monthly Cap"
                  value={isUnlimited ? "Unlimited" : `${formatNumber(total.limit)} requests`}
                />
                <Stat
                  icon={Clock}
                  label="Resets"
                  value={usage?.period_resets_at ? formatDate(usage.period_resets_at) : "—"}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-6">No usage data yet.</p>
          )}
        </CardBody>
      </Card>

      {/* Per-feature breakdown */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary">By Feature</h2>
        </CardHeader>
        <CardBody>
          {featureEntries.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">No feature data yet.</p>
          ) : (
            <div className="space-y-3">
              {featureEntries.map(([key, f]) => {
                const meta = FEATURE_META[key] || { label: key, color: "#64748b" };
                const unlimited = f.limit === -1;
                const pct = unlimited || f.limit === 0 ? 0 : Math.min(100, Math.round((f.used / f.limit) * 100));
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-secondary">{meta.label}</span>
                      <span className="text-text-muted">
                        {formatNumber(f.used)}
                        {!unlimited && ` / ${f.limit === 0 ? "—" : formatNumber(f.limit)}`}
                        {unlimited && " · unlimited"}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${unlimited ? 100 : pct}%`,
                          backgroundColor: unlimited || pct < 80 ? meta.color : "#ef4444",
                          opacity: unlimited ? 0.4 : 1,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Real recent activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary">Recent Activity</h2>
            <span className="text-xs text-text-muted">{history.length} entries</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {history.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">
              No generations recorded yet. Try the Master Suite or any feature tab.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Feature</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Cost</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((log, i) => {
                    const meta = FEATURE_META[log.feature] || { label: log.feature, color: "#64748b" };
                    return (
                      <tr key={i} className="hover:bg-surface-alt/30 transition-colors">
                        <td className="px-6 py-3">
                          <span
                            className="inline-block text-xs font-semibold rounded-md px-2 py-0.5"
                            style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-text-muted capitalize">{log.generation_type}</td>
                        <td className="px-6 py-3 text-right text-text">{log.request_count}</td>
                        <td className="px-6 py-3 text-right text-text-muted" title={log.created_at}>
                          {relTime(log.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-alt p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-text-muted" />
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-lg font-bold text-secondary capitalize truncate" title={value}>{value}</p>
    </div>
  );
}
