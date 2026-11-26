-- REVIEW ONLY: transaction rolled back. Requires schema draft lease_token.
BEGIN;
CREATE OR REPLACE FUNCTION public.allbiz_claim_mollie_recovery_jobs(
 p_limit integer DEFAULT 10,p_lease_seconds integer DEFAULT 60
)
RETURNS TABLE(order_id uuid,seller_id uuid,phase text,attempts integer,lease_until timestamptz,lease_token uuid)
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
 WITH candidates AS MATERIALIZED (
   SELECT r.order_id
   FROM public.allbiz_mollie_store_recovery r
   JOIN public.allbiz_store_orders o ON o.id=r.order_id
   WHERE r.phase IN ('reserved','provider_request_started','provider_response_received','payment_attached')
     AND o.status='pending' AND o.seller_id=r.seller_id
     AND r.next_check_at<=now()
     AND (r.lease_until IS NULL OR r.lease_until<=now())
     AND r.attempts<8
   ORDER BY r.next_check_at,r.order_id
   LIMIT LEAST(GREATEST(COALESCE(p_limit,0),0),50)
   FOR UPDATE OF r SKIP LOCKED
 )
 UPDATE public.allbiz_mollie_store_recovery r
 SET attempts=r.attempts+1,
     lease_until=now()+make_interval(secs=>LEAST(GREATEST(COALESCE(p_lease_seconds,60),10),600)),
     lease_token=gen_random_uuid(),
     last_checked_at=now(),updated_at=now()
 FROM candidates c WHERE r.order_id=c.order_id
 RETURNING r.order_id,r.seller_id,r.phase,r.attempts,r.lease_until,r.lease_token;
$$;
REVOKE ALL ON FUNCTION public.allbiz_claim_mollie_recovery_jobs(integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allbiz_claim_mollie_recovery_jobs(integer,integer) TO service_role;
-- Each claim receives a new token. Worker completion must compare token
-- AND lease_until > now() to reject stale worker results.
-- Needs isolated database concurrency tests before deployment.
ROLLBACK;
