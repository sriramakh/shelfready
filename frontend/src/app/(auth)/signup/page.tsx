"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

const benefits = [
  "5 product listings per month",
  "5 AI images (lifetime)",
  "Social posts & ad creatives",
  "No credit card required",
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // If email confirmation is required, user won't have a session yet
      if (data?.user && !data.session) {
        setEmailSent(true);
        return;
      }

      // If no confirmation required (shouldn't happen now but handle it)
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      setError(err instanceof Error ? err.message : "Google sign-up failed. Please try again.");
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
            <span className="text-2xl tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
              ShelfReady
            </span>
          </div>

          <div>
            <p
              className="text-[11px] uppercase tracking-[0.22em] text-[#E3D9C4] mb-6"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Create account
            </p>
            <h1
              className="text-5xl leading-[0.95] tracking-[-0.02em] mb-6"
              style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
            >
              Start selling <em className="text-[#E37447] italic">smarter.</em>
            </h1>
            <p className="text-[#C9BFA8] max-w-sm text-[15px] leading-relaxed mb-8">
              Free to start. No credit card. Generate your first listing,
              photoshoot, and ad in the time it takes to pour coffee.
            </p>
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-[#C9BFA8]">
                  <Check className="h-4 w-4 text-[#E37447] flex-shrink-0" />
                  <span className="text-[14px]">{benefit}</span>
                </li>
              ))}
            </ul>
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

          {emailSent ? (
            <div className="text-center py-8">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/30">
                <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p
                className="text-[11px] uppercase tracking-[0.2em] text-text-muted mb-3"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Almost there
              </p>
              <h2
                className="text-3xl text-secondary tracking-[-0.02em] mb-3"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
              >
                Check your email.
              </h2>
              <p className="text-text-muted text-sm mb-1">We sent a confirmation link to</p>
              <p className="text-primary font-semibold mb-6">{email}</p>
              <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
                Click the link in the email to activate your account. Don&apos;t see
                it? Check your spam folder.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  Use a different email
                </button>
                <p className="text-xs text-text-muted">
                  Already confirmed?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <p
                  className="text-[11px] uppercase tracking-[0.2em] text-text-muted mb-3"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Create account
                </p>
                <h2
                  className="text-3xl text-secondary tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                >
                  Kick the tires — free.
                </h2>
                <p className="mt-3 text-sm text-text-muted">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:text-primary-dark font-medium underline underline-offset-2">
                    Sign in
                  </Link>
                </p>
              </div>

              <button
                onClick={handleGoogleSignup}
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

              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  label="Full name"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  hint="Must be at least 8 characters"
                  required
                  minLength={8}
                />

                {error && (
                  <div className="rounded border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary-dark">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Create account
                </Button>
              </form>

              <p className="mt-8 text-center text-xs text-text-muted">
                By creating an account, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
