-- ============================================================================
-- Migration: 00008_create_research_sessions
-- Description: Competitor and keyword research sessions with cached results.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.research_sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    query           TEXT        NOT NULL,
    search_results  JSONB       DEFAULT '[]'::JSONB,
    analysis        TEXT,
    keywords_found  JSONB       DEFAULT '[]'::JSONB,
    competitors     JSONB       DEFAULT '[]'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.research_sessions IS 'Saved competitor/keyword research sessions.';

-- Index for fetching a user''s research sessions
CREATE INDEX idx_research_sessions_user_created
    ON public.research_sessions (user_id, created_at DESC);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "research_sessions_select_own"
    ON public.research_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "research_sessions_insert_own"
    ON public.research_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "research_sessions_update_own"
    ON public.research_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "research_sessions_delete_own"
    ON public.research_sessions
    FOR DELETE
    USING (auth.uid() = user_id);
