-- ============================================================================
-- Migration: 00011_atomic_quota
-- Description: Atomic reserve/release RPC functions for quota enforcement.
--              Prevents the race where two concurrent requests both pass
--              check_quota, both generate, both consume — ending up over the
--              limit. try_consume_quota serializes on (user, feature, period)
--              via pg_advisory_xact_lock and does a count + insert in one txn.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.try_consume_quota(
    p_user_id         UUID,
    p_feature         TEXT,
    p_generation_type TEXT,
    p_cost            INT,
    p_metadata        JSONB,
    p_limit           INT,            -- -1 = unlimited
    p_period_start    TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_used INT;
    new_id       UUID;
BEGIN
    -- Serialize concurrent reservations for this (user, feature, period) bucket.
    -- Advisory locks are lighter than SELECT FOR UPDATE when the bucket may be
    -- empty, and auto-release at transaction end.
    PERFORM pg_advisory_xact_lock(
        hashtext(p_user_id::text || ':' || p_feature || ':' || p_period_start::text)
    );

    SELECT COALESCE(SUM(request_count), 0) INTO current_used
    FROM public.usage_logs
    WHERE user_id = p_user_id
      AND feature = p_feature
      AND created_at >= p_period_start;

    IF p_limit != -1 AND current_used + p_cost > p_limit THEN
        RETURN jsonb_build_object(
            'reserved', FALSE,
            'used',     current_used,
            'limit',    p_limit
        );
    END IF;

    INSERT INTO public.usage_logs (
        user_id, feature, generation_type, request_count, metadata
    ) VALUES (
        p_user_id, p_feature, p_generation_type, p_cost, p_metadata
    )
    RETURNING id INTO new_id;

    RETURN jsonb_build_object(
        'reserved', TRUE,
        'id',       new_id,
        'used',     current_used + p_cost,
        'limit',    p_limit
    );
END;
$$;

-- Release a previously reserved quota slot (used when generation fails after reserve).
CREATE OR REPLACE FUNCTION public.release_quota(
    p_log_id  UUID,
    p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.usage_logs
    WHERE id = p_log_id AND user_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$;

-- The backend uses service_role, which bypasses RLS. Explicit grants make the
-- functions callable via supabase.rpc().
GRANT EXECUTE ON FUNCTION public.try_consume_quota(UUID, TEXT, TEXT, INT, JSONB, INT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_quota(UUID, UUID) TO service_role;
