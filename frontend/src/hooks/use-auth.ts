"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export const IS_DEMO =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@shelfready.app",
  user_metadata: { full_name: "Demo User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

const DEMO_SESSION = {
  access_token: "demo-token",
  refresh_token: "demo-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user: DEMO_USER,
} as unknown as Session;

export function useAuth() {
  const [user, setUser] = useState<User | null>(IS_DEMO ? DEMO_USER : null);
  const [session, setSession] = useState<Session | null>(
    IS_DEMO ? DEMO_SESSION : null,
  );
  const [loading, setLoading] = useState(!IS_DEMO);

  useEffect(() => {
    if (IS_DEMO) return;

    const supabase = createClient();

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (IS_DEMO) return;
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut, isDemo: IS_DEMO };
}
