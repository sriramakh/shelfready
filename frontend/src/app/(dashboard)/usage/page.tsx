"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { formatNumber, formatDate } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/shared/loading-spinner";
import type { UsageCurrent } from "@/types/api";
import { BarChart3, Clock, Zap, TrendingUp } from "lucide-react";

interface UsageBreakdown {
  feature: string;
  count: number;
  color: string;
  percentage: number;
}

const IS_DEMO =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function UsagePage() {
  const { session } = useAuth();
  const [usage, setUsage] = useState<UsageCurrent | null>(null);
  const [loading, setLoading] = useState(!IS_DEMO);

  useEffect(() => {
    async function fetchUsage() {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      // Skip API calls in demo mode
      if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        setLoading(false);
        return;
      }
      try {
        const data = (await api.getCurrentUsage(
          session.access_token,
        )) as UsageCurrent;
        setUsage(data);
      } catch {
        // Handle silently
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, [session?.access_token]);

  if (loading) return <PageLoader />;

  const usagePercent = usage ? Math.round((usage.used / usage.limit) * 100) : 0;

  // Simulated breakdown data
  const breakdowns: UsageBreakdown[] = [
    { feature: "Listings", count: Math.round((usage?.used || 0) * 0.35), color: "#2563eb", percentage: 35 },
    { feature: "Images", count: Math.round((usage?.used || 0) * 0.25), color: "#7c3aed", percentage: 25 },
    { feature: "Social Posts", count: Math.round((usage?.used || 0) * 0.2), color: "#ec4899", percentage: 20 },
    { feature: "Ad Copy", count: Math.round((usage?.used || 0) * 0.15), color: "#f59e0b", percentage: 15 },
    { feature: "Research", count: Math.round((usage?.used || 0) * 0.05), color: "#10b981", percentage: 5 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-text-muted" />
          Usage
        </h1>
        <p className="text-text-muted mt-1">
          Monitor your API usage and quota consumption
        </p>
      </div>

      {/* Current Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Current Window Usage
            </h2>
            {usage && (
              <Badge variant={usagePercent > 80 ? "danger" : "primary"}>
                {usagePercent}% used
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {usage ? (
            <div className="space-y-4">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">
                    {formatNumber(usage.used)} of {formatNumber(usage.limit)}{" "}
                    requests used
                  </span>
                  <span className="text-sm font-medium text-text">
                    {formatNumber(usage.remaining)} remaining
                  </span>
                </div>
                <div className="h-3 rounded-full bg-surface-alt overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(usagePercent, 100)}%`,
                      backgroundColor:
                        usagePercent > 80 ? "#ef4444" : "#2563eb",
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-lg bg-surface-alt p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-text-muted" />
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                      Plan
                    </p>
                  </div>
                  <p className="text-lg font-bold text-secondary capitalize">
                    {usage.plan}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-alt p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-text-muted" />
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                      Rate Limit
                    </p>
                  </div>
                  <p className="text-lg font-bold text-secondary">
                    {formatNumber(usage.limit)} / 5h
                  </p>
                </div>
                <div className="rounded-lg bg-surface-alt p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-text-muted" />
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                      Resets At
                    </p>
                  </div>
                  <p className="text-lg font-bold text-secondary">
                    {formatDate(usage.window_resets_at)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-text-muted">
                No usage data available yet. Start generating content to see
                your usage.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Usage Breakdown */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary">
            Usage Breakdown by Feature
          </h2>
        </CardHeader>
        <CardBody>
          {usage && usage.used > 0 ? (
            <div className="space-y-4">
              {breakdowns.map((item) => (
                <div key={item.feature} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-text">
                    {item.feature}
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-surface-alt overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-medium text-text">
                      {formatNumber(item.count)}
                    </span>
                    <span className="text-xs text-text-muted ml-1">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-text-muted">
                No usage breakdown data available yet.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent Usage Log */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary">
            Recent Usage Log
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          {usage && usage.used > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                      Action
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                      Feature
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                      Requests
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { action: "Generated listing", feature: "Listings", requests: 15, time: "2 minutes ago" },
                    { action: "Generated image", feature: "Images", requests: 75, time: "15 minutes ago" },
                    { action: "Generated social post", feature: "Social", requests: 10, time: "1 hour ago" },
                    { action: "Generated ad copy", feature: "Ads", requests: 20, time: "2 hours ago" },
                    { action: "Generated listing", feature: "Listings", requests: 15, time: "3 hours ago" },
                  ].map((log, i) => (
                    <tr key={i} className="hover:bg-surface-alt/30 transition-colors">
                      <td className="px-6 py-3 text-sm text-text">
                        {log.action}
                      </td>
                      <td className="px-6 py-3">
                        <Badge>{log.feature}</Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-text-muted">
                        {log.requests}
                      </td>
                      <td className="px-6 py-3 text-sm text-text-muted">
                        {log.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 px-6">
              <p className="text-sm text-text-muted">
                No recent activity to display.
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
