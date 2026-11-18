-- REVIEW ONLY. Never execute against the active Supabase project.
-- Depends on review-only/mollie-recovery-schema-draft.sql.
-- Prototype atomic lease claim; it does NOT settle payments or release stock.
-- Service role is the only intended caller. Recheck ownership and schema first.
BEGIN;
CREATE OR REPLACE FUNCTION public.allbiz_claim_mollie_recovery_jobs(
  p_limit integer DEFAULT 10,
  p_lease_seconds integer DEFAULT 60
)
RETURNS TABLE(order_id uuid, seller_id uuid, phase text, attempts integer, lease_until timestamptz)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH candidates AS MATERIALIZED (
    SELECT r.order_id
    FROM public.allbiz_mollie_store_recovery AS r
    JOIN public.allbiz_store_orders AS o ON o.id = r.order_id
    WHERE r.phase IN ('reserved','provider_request_started','provider_response_received','payment_attached')
      AND o.status = 'pending'
      AND o.seller_id = r.seller_id
      AND r.next_check_at <= now()
      AND (r.lease_until IS NULL OR r.lease_until <= now())
      AND r.attempts < 8
    ORDER BY r.next_check_at, r.order_id
    LIMIT LEAST(GREATEST(p_limit, 0), 50)
    FOR UPDATE OF r SKIP LOCKED
  )
  UPDATE public.allbiz_mollie_store_recovery AS r
  SET attempts = r.attempts + 1,
      lease_until = now() + make_interval(secs => LEAST(GREATEST(p_lease_seconds, 10), 600)),
      last_checked_at = now(),
      updated_at = now()
  FROM candidates AS c
  WHERE r.order_id = c.order_id
  RETURNING r.order_id,r.seller_id,r.phase,r.attempts,r.lease_until;
$$;
REVOKE ALL ON FUNCTION public.allbiz_claim_mollie_recovery_jobs(integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.allbiz_claim_mollie_recovery_jobs(integer,integer) TO service_role;
-- Further requirements before any deployment:
-- 1. Service role must have table permissions and RLS access.
-- 2. Add completion/lease-token CAS RPC to stop stale workers from finishing.
-- 3. Add a durable before-provider-request transition in checkout.
-- 4. Add retry/manual-review transitions; never expire merely by timestamp.
-- 5. Test against an isolated database with concurrent workers and webhook races.
ROLLBACK;
