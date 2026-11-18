-- REVIEW-ONLY proposed replacement; do NOT apply to production.
-- Must be deployed only together with durable reservation + recovery creation,
-- pre-provider phase transition, webhook verification and recovery worker.
-- Orders without a recovery row are deliberately NOT cancelled automatically.
CREATE OR REPLACE FUNCTION public.allbiz_cancel_mollie_store_checkout(
 p_order uuid,p_payment text,p_reason text
) RETURNS boolean LANGUAGE plpgsql SET search_path TO '' AS $function$
DECLARE o public.allbiz_store_orders%ROWTYPE;
        r public.allbiz_mollie_store_recovery%ROWTYPE;
        l record;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Not authorized';END IF;
 IF p_reason NOT IN ('expired','failed','cancelled') THEN RAISE EXCEPTION 'Invalid reason';END IF;
 SELECT * INTO o FROM public.allbiz_store_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR o.status<>'pending' OR o.payment_provider<>'mollie' THEN RETURN false;END IF;
 SELECT * INTO r FROM public.allbiz_mollie_store_recovery WHERE order_id=p_order FOR UPDATE;
 IF NOT FOUND OR r.seller_id<>o.seller_id THEN RETURN false;END IF;
 IF p_payment IS NULL THEN
   -- Provider request must NEVER have started. Reserved is a durable state.
   IF r.phase<>'reserved' OR o.mollie_payment_id IS NOT NULL THEN RETURN false;END IF;
 ELSE
   -- Caller must independently verify provider terminal status, seller, amount,
   -- organization and live mode before invoking this RPC.
   IF o.mollie_payment_id IS DISTINCT FROM p_payment OR r.phase<>'payment_attached'
   THEN RETURN false;END IF;
 END IF;
 UPDATE public.allbiz_store_orders
 SET status=CASE WHEN p_reason='failed' THEN 'failed' ELSE 'cancelled' END,
 fulfillment_status=CASE WHEN p_reason='failed' THEN 'failed' ELSE 'cancelled' END
 WHERE id=p_order;
 FOR l IN SELECT product_id,quantity FROM public.allbiz_store_order_lines WHERE order_id=p_order LOOP
   UPDATE public.allbiz_catalog_products SET stock=stock+l.quantity,updated_at=now()
   WHERE id=l.product_id AND stock IS NOT NULL;
 END LOOP;
 UPDATE public.allbiz_mollie_store_recovery
 SET phase='terminal',lease_until=NULL,lease_token=NULL,updated_at=now()
 WHERE order_id=p_order;
 RETURN true;
END $function$;

-- REVIEW NOTE: This is a fail-closed draft, not ready to deploy.
-- A verified provider failure can arrive while phase=provider_request_started
-- but payment attachment is missing. Reconcile/attach atomically first.
-- A stale worker must not call this after lease ownership is lost.
-- Requires exact-SQL disposable DB tests and complete deployment/rollback plan.
