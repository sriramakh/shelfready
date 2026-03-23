-- ============================================================================
-- Migration: 00005_create_social_posts
-- Description: Social media posts generated from listings.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.social_posts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    listing_id      UUID        REFERENCES public.listings (id) ON DELETE SET NULL,
    platform        TEXT        NOT NULL,   -- e.g. instagram, facebook, twitter, tiktok, pinterest
    caption         TEXT,
    hashtags        JSONB       DEFAULT '[]'::JSONB,
    image_id        UUID        REFERENCES public.generated_images (id) ON DELETE SET NULL,
    cta_text        TEXT,
    status          TEXT        NOT NULL DEFAULT 'draft',  -- draft, scheduled, published
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.social_posts IS 'AI-generated social media posts tied to listings.';

-- Index for fetching a user''s posts
CREATE INDEX idx_social_posts_user_created
    ON public.social_posts (user_id, created_at DESC);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts_select_own"
    ON public.social_posts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "social_posts_insert_own"
    ON public.social_posts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "social_posts_update_own"
    ON public.social_posts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "social_posts_delete_own"
    ON public.social_posts
    FOR DELETE
    USING (auth.uid() = user_id);
