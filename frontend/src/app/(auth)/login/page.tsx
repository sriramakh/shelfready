"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Logo uses /logo-icon.png image

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) {
        setError(authError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left panel — editorial zine */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary text-[#F5F0E6] relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent 0 12px, rgba(245,240,230,0.3) 12px 13px)",
          }}
        />
        <div className="relative flex flex-col justify-between px-16 py-16 w-full">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="ShelfReady" className="h-9 w-9 rounded bg-white/10 p-1" />
            <span
              className="text-2xl tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ShelfReady
            </span>
          </div>

          <div>
            <p
              className="text-[11px] uppercase tracking-[0.22em] text-[#E3D9C4] mb-6"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Welcome back
            </p>
            <h1
              className="text-5xl leading-[0.95] tracking-[-0.02em] mb-6"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Your shelf,
              <br />
              <em className="text-[#E37447] italic">right where</em>
              <br />
              you left it.
            </h1>
            <p className="text-[#C9BFA8] max-w-sm text-[15px] leading-relaxed">
              Log in to keep generating listings, photoshoots, social posts, ads,
              and market research from one upload.
            </p>
          </div>

          <div
            className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[#A49B8A]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>— SHELFREADY.APP · ISSUE NO. 01</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="ShelfReady" className="h-8 w-8 rounded" />
            <span className="text-xl font-bold text-secondary" style={{ fontFamily: "var(--font-display)" }}>
              ShelfReady
            </span>
          </div>

          <div className="text-center mb-8">
            <p
              className="text-[11px] uppercase tracking-[0.2em] text-text-muted mb-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Sign in
            </p>
            <h2
              className="text-3xl text-secondary tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Welcome back.
            </h2>
            <p className="mt-3 text-sm text-text-muted">
              New to ShelfReady?{" "}
              <Link href="/signup" className="text-primary hover:text-primary-dark font-medium underline underline-offset-2">
                Create an account
              </Link>
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 rounded border border-border bg-[#FAF6EC] px-4 py-3 text-sm font-medium text-text hover:bg-surface-alt transition-colors mb-6 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span
                className="bg-surface px-3 text-[10px] uppercase tracking-[0.2em] text-text-muted"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="mt-1.5 text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs text-text-muted hover:text-primary font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div
                className="rounded border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary-dark"
              >
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-text-muted">
            By signing in, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
