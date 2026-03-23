"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Check } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Supabase sends the user here with a session already set via the recovery link
  // We just need to let them set a new password

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
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

          {success ? (
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-secondary mb-2">
                Password updated
              </h2>
              <p className="text-text-muted">
                Redirecting you to the dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-secondary">
                  Set new password
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="New password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirm new password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Update Password
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-text-muted">
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
