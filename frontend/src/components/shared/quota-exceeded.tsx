"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

const QUOTA_KEYWORDS = ["limit reached", "not available on the Free plan", "Upgrade to Starter", "Free plan limit"];

export function QuotaExceededBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Zap className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900 mb-1">Limit Reached</p>
          <p className="text-sm text-amber-700 leading-relaxed">{message}</p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-lg transition-colors"
          >
            Upgrade your plan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if an error is a quota exceeded error.
 * Returns the user-friendly message if so, null otherwise.
 */
export function getQuotaMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  const msg = err.message;

  // ApiError stringifies the backend detail object as the message
  // Backend returns: {"error":"quota_exceeded","message":"Monthly limit reached..."}
  try {
    const parsed = JSON.parse(msg);
    if (parsed?.error === "quota_exceeded") {
      return parsed.message || "You've reached your plan limit.";
    }
    // Nested detail (from some error wrappers)
    if (parsed?.detail?.error === "quota_exceeded") {
      return parsed.detail.message || "You've reached your plan limit.";
    }
  } catch {
    // Not JSON
  }

  // Fallback: check raw string
  if (msg.includes("quota_exceeded") || msg.includes("Monthly limit") || msg.includes("Free plan limit") || msg.includes("not available on the Free plan")) {
    return msg;
  }

  return null;
}

/**
 * Check if an error string looks like a quota message.
 */
export function isQuotaError(errorStr: string): boolean {
  return QUOTA_KEYWORDS.some((kw) => errorStr.includes(kw));
}

/**
 * Renders either QuotaExceededBanner or a red error div based on the error message.
 */
export function ErrorOrQuota({ error }: { error: string }) {
  if (isQuotaError(error)) {
    return <QuotaExceededBanner message={error} />;
  }
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {error}
    </div>
  );
}
