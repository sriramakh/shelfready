-- ============================================================================
-- Migration: 00003_create_listings
-- Description: Product listings with AI-generated content fields.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.listings (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    platform                TEXT,           -- e.g. amazon, ebay, shopify, etsy
    product_name            TEXT        NOT NULL,
    product_category        TEXT,
    input_details           JSONB       DEFAULT '{}'::JSONB,
    generated_title         TEXT,
    generated_bullets       JSONB       DEFAULT '[]'::JSONB,
    generated_description   TEXT,
    generated_keywords      JSONB       DEFAULT '[]'::JSONB,
    generated_raw           JSONB       DEFAULT '{}'::JSONB,
    is_favorite             BOOLEAN     NOT NULL DEFAULT FALSE,
    status                  TEXT        NOT NULL DEFAULT 'draft',  -- draft, published, archived
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.listings IS 'Product listings with user inputs and AI-generated content.';

-- Composite index for fetching a user''s listings in reverse-chronological order
CREATE INDEX idx_listings_user_created
    ON public.listings (user_id, created_at DESC);

-- Trigger: auto-update updated_at
CREATE TRIGGER set_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_select_own"
    ON public.listings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "listings_insert_own"
    ON public.listings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "listings_update_own"
    ON public.listings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "listings_delete_own"
    ON public.listings
    FOR DELETE
    USING (auth.uid() = user_id);
