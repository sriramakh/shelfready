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
