"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // e.g. Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="rounded-2xl bg-red-50 p-5 mb-5">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-slate-500 text-center max-w-md mb-6">
        An unexpected error occurred. Please try again or return to the home
        page.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
