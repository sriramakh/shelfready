"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setEmailSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-secondary">ShelfReady</span>
          </div>

          {emailSent ? (
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <svg
                  className="h-8 w-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-secondary mb-2">
                Check your email
              </h2>
              <p className="text-text-muted mb-2">
                We&apos;ve sent a password reset link to
              </p>
              <p className="text-primary font-semibold mb-6">{email}</p>
              <p className="text-sm text-text-muted mb-6">
                Click the link in the email to set a new password.
                <br />
                Don&apos;t see it? Check your spam folder.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  Try a different email
                </button>
                <p className="text-xs text-text-muted">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-secondary">
                  Forgot your password?
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  Send Reset Link
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-text-muted">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
