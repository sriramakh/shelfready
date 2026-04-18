"use client";

import React from "react";
import { Clock, ChevronRight } from "lucide-react";

interface HistoryItem {
  id: string;
  label: string;
  subtitle?: string;
  timestamp?: string;
}

interface Props {
  items: HistoryItem[];
  activeId?: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  title?: string;
  emptyText?: string;
  accentColor?: string;
}

export function HistoryPanel({
  items,
  activeId,
  loading,
  onSelect,
  title = "Recent Generations",
  emptyText = "No past generations yet",
  accentColor = "primary",
}: Props) {
  const colorMap: Record<string, string> = {
    primary: "text-primary",
    emerald: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
    pink: "text-pink-600 dark:text-pink-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  const accent = colorMap[accentColor] || colorMap.primary;

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-surface-alt overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`h-3.5 w-3.5 ${accent}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
            {title}
          </h3>
        </div>
        {items.length > 0 && (
          <span className="text-[10px] text-text-muted font-medium">{items.length}</span>
        )}
      </div>

      {loading && (
        <div className="p-4 text-center">
          <div className="h-4 w-4 mx-auto rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="p-4 text-xs text-text-muted text-center">{emptyText}</p>
      )}

      {!loading && items.length > 0 && (
        <div className="max-h-[500px] overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full text-left px-4 py-2.5 border-b border-border/50 last:border-0 transition-colors cursor-pointer group flex items-center gap-2 ${
                activeId === item.id
                  ? "bg-primary/5 dark:bg-primary/10"
                  : "hover:bg-surface-alt dark:hover:bg-white/5"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-secondary truncate">
                  {item.label}
                </p>
                {item.subtitle && (
                  <p className="text-[10px] text-text-muted truncate mt-0.5">
                    {item.subtitle}
                  </p>
                )}
                {item.timestamp && (
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {formatRelative(item.timestamp)}
                  </p>
                )}
              </div>
              <ChevronRight
                className={`h-3 w-3 flex-shrink-0 transition-transform ${
                  activeId === item.id ? accent : "text-text-muted/30 group-hover:text-text-muted"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelative(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}
