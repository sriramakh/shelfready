-- ============================================================================
-- Migration: 00007_create_usage_logs
-- Description: Usage tracking for quota management. This is a CRITICAL table
--              for enforcing plan-based rate limits via sliding window queries.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usage_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    generation_type TEXT        NOT NULL,   -- e.g. listing, image, social_post, ad_copy, research
    request_count   INTEGER     NOT NULL DEFAULT 1,
    feature         TEXT,                   -- finer-grained feature label
    metadata        JSONB       DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.usage_logs IS 'Per-request usage logs for quota enforcement via sliding window.';

-- Primary lookup: per-user queries sorted by time (most recent first)
CREATE INDEX idx_usage_user_time
    ON public.usage_logs (user_id, created_at DESC);

-- Composite index for sliding-window quota checks.
-- Queries filter by user_id + created_at range, so this covers the hot path.
CREATE INDEX idx_usage_window
    ON public.usage_logs (user_id, created_at, generation_type);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage history
CREATE POLICY "usage_logs_select_own"
    ON public.usage_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only the service role (server-side API routes) inserts usage logs.
-- service_role bypasses RLS by default; no INSERT policy for authenticated users
-- prevents clients from fabricating usage records.
