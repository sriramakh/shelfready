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
