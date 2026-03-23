-- ============================================================================
-- Migration: 00004_create_images
-- Description: Generated images stored in Supabase Storage with metadata.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.generated_images (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    listing_id      UUID        REFERENCES public.listings (id) ON DELETE SET NULL,
    prompt          TEXT,
    storage_path    TEXT        NOT NULL,
    public_url      TEXT,
    aspect_ratio    TEXT        NOT NULL DEFAULT '1:1',
    image_type      TEXT,           -- e.g. product, lifestyle, infographic, hero
    metadata        JSONB       DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.generated_images IS 'Records of AI-generated images with storage references.';

-- Composite index for fetching a user''s images in reverse-chronological order
CREATE INDEX idx_images_user_created
    ON public.generated_images (user_id, created_at DESC);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "images_select_own"
    ON public.generated_images
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "images_insert_own"
    ON public.generated_images
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "images_delete_own"
    ON public.generated_images
    FOR DELETE
    USING (auth.uid() = user_id);
