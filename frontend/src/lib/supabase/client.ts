import { createBrowserClient } from "@supabase/ssr";

const IS_DEMO =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

let _client: ReturnType<typeof createBrowserClient> | null = null;

// Stub that prevents any network requests in demo mode
const _demoStub = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ data: { session: null, user: null }, error: null }),
    signUp: () => Promise.resolve({ data: { session: null, user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithOAuth: () => Promise.resolve({ data: { url: "/dashboard" }, error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
  }),
} as unknown as ReturnType<typeof createBrowserClient>;

export function createClient() {
  if (IS_DEMO) {
    return _demoStub;
  }
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}
