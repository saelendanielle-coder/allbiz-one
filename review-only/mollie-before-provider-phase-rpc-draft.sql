-- REVIEW ONLY: prototype before-provider phase transition.
-- Run only after recovery schema draft in isolated database.
-- Checkout reservation RPC must create recovery row in SAME transaction.
-- This function never calls Mollie and never changes inventory.
BEGIN;
CREATE OR REPLACE FUNCTION public.allbiz_mark_mollie_provider_request_started(
 p_order_id uuid,p_seller_id uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE v_updated integer;
BEGIN
 IF current_user <> 'service_role' OR p_order_id IS NULL OR p_seller_id IS NULL
 THEN RETURN false; END IF;
 UPDATE public.allbiz_mollie_store_recovery r
 SET phase='provider_request_started',updated_at=now()
 FROM public.allbiz_store_orders o
 WHERE r.order_id=p_order_id AND o.id=r.order_id
   AND r.seller_id=p_seller_id AND o.seller_id=p_seller_id
   AND o.status='pending'
   AND r.phase='reserved'
   AND r.lease_token IS NULL
   AND r.lease_until IS NULL;
 GET DIAGNOSTICS v_updated=ROW_COUNT;
 RETURN v_updated=1;
END;
$$;
REVOKE ALL ON FUNCTION public.allbiz_mark_mollie_provider_request_started(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allbiz_mark_mollie_provider_request_started(uuid,uuid) TO service_role;
-- Do NOT retry an ambiguous Mollie POST by calling this RPC again:
-- a false result must stop checkout and route to reconciliation.
-- IMPORTANT: record this durable phase BEFORE starting the provider request.
ROLLBACK;
