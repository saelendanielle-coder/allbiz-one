-- REVIEW ONLY. Depends on recovery schema and claim drafts.
-- Fenced completion: an expired or replaced worker cannot commit a result.
-- This RPC only schedules retries/manual review; it never changes orders,
-- provider payments or stock.
BEGIN;
CREATE OR REPLACE FUNCTION public.allbiz_finish_mollie_recovery_claim(
 p_order_id uuid,p_lease_token uuid,p_outcome text,p_error_code text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE v_updated integer;
BEGIN
 IF p_order_id IS NULL OR p_lease_token IS NULL
    OR p_outcome NOT IN ('retry','manual_review','terminal') THEN
   RETURN false;
 END IF;
 UPDATE public.allbiz_mollie_store_recovery r
 SET phase=CASE WHEN p_outcome='manual_review' THEN 'manual_review'
                WHEN p_outcome='terminal' THEN 'terminal'
                ELSE r.phase END,
     next_check_at=CASE WHEN p_outcome='retry'
       THEN now()+make_interval(secs=>LEAST(3600,30*power(2,LEAST(r.attempts,7)))::integer)
       ELSE r.next_check_at END,
     lease_token=NULL,lease_until=NULL,
     last_error_code=LEFT(p_error_code,80),updated_at=now()
 WHERE r.order_id=p_order_id
   AND r.lease_token=p_lease_token
   AND r.lease_until>now()
   AND r.phase NOT IN ('terminal','manual_review');
 GET DIAGNOSTICS v_updated=ROW_COUNT;
 RETURN v_updated=1;
END;
$$;
REVOKE ALL ON FUNCTION public.allbiz_finish_mollie_recovery_claim(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allbiz_finish_mollie_recovery_claim(uuid,uuid,text,text) TO service_role;
-- NOTE: terminal outcome must only be called after a separate verified,
-- idempotent order-state RPC; add DB-level invariant before production.
-- Never pass provider secrets or PII as p_error_code.
ROLLBACK;
