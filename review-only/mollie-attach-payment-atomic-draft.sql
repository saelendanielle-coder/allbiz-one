-- REVIEW ONLY: exact replacement candidate for current
-- public.allbiz_attach_mollie_store_payment(uuid,text,text).
-- Do not run against the live Supabase project. Requires recovery schema.
-- Keep signature and boolean return shape of existing RPC.
BEGIN;
CREATE OR REPLACE FUNCTION public.allbiz_attach_mollie_store_payment(
 p_order uuid,p_payment text,p_return_hash text
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $function$
DECLARE v_seller uuid;v_updated integer;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Not authorized';END IF;
 IF p_order IS NULL OR p_payment IS NULL OR p_return_hash IS NULL
 OR p_payment !~ '^tr_[A-Za-z0-9]+$'
 OR p_return_hash !~ '^[a-f0-9]{64}$' THEN RETURN false;END IF;
 -- Lock order and recovery row together before attaching.
 SELECT o.seller_id INTO v_seller
 FROM public.allbiz_store_orders o
 JOIN public.allbiz_mollie_store_recovery r
   ON r.order_id=o.id AND r.seller_id=o.seller_id
 WHERE o.id=p_order AND o.status='pending' AND o.payment_provider='mollie'
   AND o.mollie_payment_id IS NULL AND o.mollie_return_token_hash IS NULL
   AND r.phase IN ('provider_request_started','provider_response_received')
   AND r.lease_token IS NULL AND r.lease_until IS NULL
 FOR UPDATE OF o,r;
 IF NOT FOUND THEN RETURN false;END IF;
 UPDATE public.allbiz_store_orders
 SET mollie_payment_id=p_payment,mollie_return_token_hash=p_return_hash
 WHERE id=p_order AND seller_id=v_seller AND status='pending'
 AND mollie_payment_id IS NULL AND mollie_return_token_hash IS NULL;
 GET DIAGNOSTICS v_updated=ROW_COUNT;
 IF v_updated<>1 THEN RETURN false;END IF;
 UPDATE public.allbiz_mollie_store_recovery
 SET phase='payment_attached',updated_at=now()
 WHERE order_id=p_order AND seller_id=v_seller
 AND phase IN ('provider_request_started','provider_response_received');
 GET DIAGNOSTICS v_updated=ROW_COUNT;
 IF v_updated<>1 THEN RAISE EXCEPTION 'Recovery attachment state mismatch';END IF;
 RETURN true;
END $function$;
ROLLBACK;
-- Integration requirements: verify grants on existing RPC, mock provider
-- payment and webhook races, and test failures rollback BOTH updates.
-- Existing duplicate-attach behavior stays false; no inventory changes.
