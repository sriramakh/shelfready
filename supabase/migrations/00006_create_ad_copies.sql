-- ============================================================================
-- Migration: 00006_create_ad_copies
-- Description: Ad copy variants for paid advertising platforms.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ad_copies (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    listing_id      UUID        REFERENCES public.listings (id) ON DELETE SET NULL,
    ad_platform     TEXT        NOT NULL,   -- e.g. google_ads, meta_ads, amazon_ppc, tiktok_ads
    headline        TEXT,
    primary_text    TEXT,
    description     TEXT,
    cta             TEXT,
    variant_label   TEXT,           -- e.g. A, B, Control, Emotional, Urgency
    target_audience TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ad_copies IS 'AI-generated ad copy variants for multiple ad platforms.';

-- Index for fetching a user''s ad copies
CREATE INDEX idx_ad_copies_user_created
    ON public.ad_copies (user_id, created_at DESC);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.ad_copies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_copies_select_own"
    ON public.ad_copies
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "ad_copies_insert_own"
    ON public.ad_copies
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ad_copies_update_own"
    ON public.ad_copies
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ad_copies_delete_own"
    ON public.ad_copies
    FOR DELETE
    USING (auth.uid() = user_id);
