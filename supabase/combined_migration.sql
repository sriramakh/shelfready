-- ============================================================================
-- Migration: 00001_create_profiles
-- Description: Extends auth.users with app-specific profile data.
--              Auto-creates a profile row whenever a new user signs up.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email           TEXT        NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,
    stripe_customer_id TEXT    UNIQUE,
    current_plan    TEXT        NOT NULL DEFAULT 'free',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'App-specific user profile data, one row per auth.users entry.';

-- Trigger: auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: auto-create a profile when a new user signs up via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
-- ============================================================================
-- Migration: 00002_create_subscriptions
-- Description: Mirrors Stripe subscription state for local queries and
--              quota checks. Updated exclusively via the Stripe webhook handler.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    stripe_subscription_id  TEXT        NOT NULL UNIQUE,
    stripe_price_id         TEXT,
    plan_tier               TEXT        NOT NULL,
    status                  TEXT        NOT NULL,  -- e.g. active, canceled, past_due, trialing
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    cancel_at_period_end    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.subscriptions IS 'Local mirror of Stripe subscriptions. Managed by webhook handler.';

-- Indexes for common query patterns
CREATE INDEX idx_subscriptions_user_id
    ON public.subscriptions (user_id);

CREATE INDEX idx_subscriptions_stripe_sub_id
    ON public.subscriptions (stripe_subscription_id);

-- Trigger: auto-update updated_at
CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Row-Level Security
-- ============================================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "subscriptions_select_own"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only the service role (webhook handler) can insert subscriptions.
-- service_role bypasses RLS by default, so no explicit INSERT policy is needed
-- for authenticated users. We intentionally omit an INSERT policy for
-- the authenticated role to prevent client-side subscription creation.

-- Only the service role can update subscriptions.
-- Same rationale: service_role bypasses RLS; no UPDATE policy for authenticated.
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
-- ============================================================================
-- Migration: 00009_rls_policies
-- Description: Comprehensive RLS policy verification and any supplemental
--              policies not already defined in per-table migrations.
--
-- Each table migration (00001-00008) already enables RLS and creates its own
-- policies. This migration serves as a safety net to ensure RLS is enabled
-- on every application table and documents the full policy matrix.
-- ============================================================================

-- ============================================================================
-- Ensure RLS is enabled on every table (idempotent)
-- ============================================================================
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_copies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sessions  ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policy Matrix (reference documentation)
-- ============================================================================
--
-- Table               | SELECT         | INSERT         | UPDATE         | DELETE
-- --------------------|----------------|----------------|----------------|----------------
-- profiles            | own (id)       | trigger only   | own (id)       | --
-- subscriptions       | own (user_id)  | service_role   | service_role   | --
-- listings            | own (user_id)  | own (user_id)  | own (user_id)  | own (user_id)
-- generated_images    | own (user_id)  | own (user_id)  | --             | own (user_id)
-- social_posts        | own (user_id)  | own (user_id)  | own (user_id)  | own (user_id)
-- ad_copies           | own (user_id)  | own (user_id)  | own (user_id)  | own (user_id)
-- usage_logs          | own (user_id)  | service_role   | --             | --
-- research_sessions   | own (user_id)  | own (user_id)  | own (user_id)  | own (user_id)
--
-- "own" = auth.uid() = <column>
-- "service_role" = bypasses RLS; no authenticated-role policy exists
-- "trigger only" = profiles are created by the handle_new_user() trigger
-- "--" = no policy (operation denied for authenticated users)
-- ============================================================================
-- ============================================================================
-- Migration: 00010_create_storage_bucket
-- Description: Creates the storage bucket for generated images and sets up
--              storage-level RLS policies for upload and public read access.
-- ============================================================================

-- Create the bucket (public = true allows unauthenticated reads via public URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Policies
-- ============================================================================

-- Authenticated users can upload files into their own folder.
-- Folder structure: generated-images/<user_uuid>/<filename>
CREATE POLICY "storage_images_insert_own"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'generated-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- Authenticated users can update (overwrite) their own files.
CREATE POLICY "storage_images_update_own"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'generated-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    )
    WITH CHECK (
        bucket_id = 'generated-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- Authenticated users can delete their own files.
CREATE POLICY "storage_images_delete_own"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'generated-images'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- Public read access for all generated images (the bucket is public).
CREATE POLICY "storage_images_select_public"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'generated-images');
