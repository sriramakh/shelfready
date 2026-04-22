"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, X, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/constants";

const QUOTA_KEYWORDS = [
  "limit reached",
  "not available on the Free plan",
  "Upgrade to Starter",
  "Free plan limit",
  "Monthly",
];

/**
 * Check if an error is a quota exceeded error.
 * Returns the user-friendly message if so, null otherwise.
 */
export function getQuotaMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  const msg = err.message;

  // ApiError stringifies the backend detail object as the message.
  // Backend returns: {"error":"quota_exceeded","message":"Monthly limit reached..."}
  try {
    const parsed = JSON.parse(msg);
    if (parsed?.error === "quota_exceeded") {
      return parsed.message || "You've reached your plan limit.";
    }
    if (parsed?.detail?.error === "quota_exceeded") {
      return parsed.detail.message || "You've reached your plan limit.";
    }
  } catch {
    // Not JSON — fall through to string checks.
  }

  if (
    msg.includes("quota_exceeded") ||
    msg.includes("Monthly limit") ||
    msg.includes("Free plan limit") ||
    msg.includes("not available on the Free plan")
  ) {
    return msg;
  }

  return null;
}

/**
 * Check if an error string looks like a quota message.
 */
export function isQuotaError(errorStr: string): boolean {
  if (!errorStr) return false;
  return (
    errorStr.includes("quota_exceeded") ||
    QUOTA_KEYWORDS.some((kw) => errorStr.includes(kw))
  );
}

/**
 * Extract a clean user-facing message from a raw error string. Handles three
 * shapes: (a) a plain message — returned as-is; (b) a stringified backend
 * payload like '{"error":"quota_exceeded","message":"..."}' — returns the
 * message field; (c) a FastAPI-wrapped '{"detail":{...}}' — returns
 * detail.message.
 */
export function cleanErrorMessage(raw: string): string {
  if (!raw) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (parsed?.detail?.message) return String(parsed.detail.message);
    if (parsed?.message) return String(parsed.message);
  } catch {
    // Not JSON — fall through.
  }
  return raw;
}

/**
 * Fixed-position modal overlay surfaced when quota is exceeded. Blocks the
 * page until the user dismisses or clicks Upgrade. Backdrop click + Escape
 * also dismiss. The component owns its own dismissed state so parents don't
 * need to manage it, but parents can optionally pass onDismiss to clear
 * their own error state when the modal closes.
 */
export function QuotaExceededModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEscape);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quota-modal-title"
        className="relative bg-white dark:bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-border"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-alt transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 id="quota-modal-title" className="text-lg font-bold text-secondary">
              Plan limit reached
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Upgrade to keep generating
            </p>
          </div>
        </div>

        <p className="text-sm text-text mb-6 leading-relaxed">{message}</p>

        <div className="rounded-lg bg-gradient-to-r from-primary/5 to-blue-500/5 border border-primary/20 p-3 mb-5 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-text leading-relaxed">
            Starter plan is ${PLANS.starter.priceMonthly}/mo and unlocks {PLANS.starter.maxListings} listings,{" "}
            {PLANS.starter.maxImages} images, {PLANS.starter.maxPhotoshoots} photoshoots, social, ads, and research each month.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/billing"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary to-blue-700 hover:from-primary/90 hover:to-blue-700/90 text-white font-semibold px-4 py-2.5 rounded-lg transition-all shadow-md shadow-primary/20"
          >
            View plans <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={onClose}
            className="sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-border text-text hover:bg-surface-alt transition-colors font-medium"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline banner — kept for places that want a non-blocking notice
 * (e.g. card-level warnings). Most callers should prefer the modal via
 * ErrorOrQuota below.
 */
export function QuotaExceededBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
          <Zap className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
            Limit reached
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
            {message}
          </p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 px-4 py-2 rounded-lg transition-colors"
          >
            Upgrade your plan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Shared error surface: shows the blocking quota modal for quota errors,
 * inline red banner otherwise. Parents pass a string error and don't need
 * to manage modal state — the component handles dismissal internally.
 *
 * Parents may optionally pass onDismiss to clear their own error state
 * when the modal closes.
 */
export function ErrorOrQuota({
  error,
  onDismiss,
}: {
  error: string;
  onDismiss?: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when a new error comes in.
  useEffect(() => {
    setDismissed(false);
  }, [error]);

  if (!error) return null;

  // Extract a clean human message if the error is a stringified JSON payload
  // (happens when pages forward raw fetch errors without parsing them).
  const display = cleanErrorMessage(error);
  const quota = isQuotaError(error) || isQuotaError(display);

  if (quota && !dismissed) {
    return (
      <QuotaExceededModal
        message={display}
        onClose={() => {
          setDismissed(true);
          onDismiss?.();
        }}
      />
    );
  }

  if (quota && dismissed) {
    return (
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
        <span>{display}</span>
        <Link href="/billing" className="font-semibold hover:underline whitespace-nowrap">
          Upgrade →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-400">
      {display}
    </div>
  );
}
