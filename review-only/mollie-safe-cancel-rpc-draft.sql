-- REVIEW ONLY: proposed cancellation RPC replacement; NEVER apply to production without approval.
-- Requires review-only allbiz_mollie_store_recovery schema deployed first.
-- Lock order THEN recovery consistently across checkout/webhook/worker.
-- Critical: no null-payment cancellation after provider request started.
BEGIN;
CREATE OR REPLACE FUNCTION public.allbiz_cancel_mollie_store_checkout(
 p_order uuid,p_payment text,p_reason text
) RETURNS boolean LANGUAGE plpgsql SET search_path TO '' AS $function$
DECLARE o public.allbiz_store_orders%rowtype;
 r public.allbiz_mollie_store_recovery%rowtype;
 l record;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Not authorized';END IF;
 IF p_reason NOT IN ('expired','failed','cancelled') THEN RAISE EXCEPTION 'Invalid reason';END IF;
 SELECT * INTO o FROM public.allbiz_store_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR o.status<>'pending' OR o.payment_provider<>'mollie' THEN RETURN false;END IF;
 SELECT * INTO r FROM public.allbiz_mollie_store_recovery WHERE order_id=p_order FOR UPDATE;
 IF NOT FOUND OR r.seller_id<>o.seller_id THEN RETURN false;END IF;
 IF p_payment IS NULL THEN
   -- Safe only if no durable provider request has begun.
   IF o.mollie_payment_id IS NOT NULL OR r.phase<>'reserved' THEN RETURN false;END IF;
 ELSE
   -- This RPC is only called after a trusted, seller-scoped Mollie GET
   -- verified the terminal provider status, amount, order, seller and live mode.
   -- The SQL function cannot independently verify remote provider status.
   IF o.mollie_payment_id IS DISTINCT FROM p_payment OR r.phase<>'payment_attached'
   THEN RETURN false;END IF;
 END IF;
 UPDATE public.allbiz_store_orders SET
 status=CASE WHEN p_reason='failed' THEN 'failed' ELSE 'cancelled' END,
 fulfillment_status=CASE WHEN p_reason='failed' THEN 'failed' ELSE 'cancelled' END
 WHERE id=p_order AND status='pending';
 FOR l IN SELECT product_id,quantity FROM public.allbiz_store_order_lines WHERE order_id=p_order LOOP
  UPDATE public.allbiz_catalog_products SET stock=stock+l.quantity,updated_at=now()
  WHERE id=l.product_id AND stock IS NOT NULL;
 END LOOP;
 UPDATE public.allbiz_mollie_store_recovery SET phase='terminal',
 lease_until=NULL,lease_token=NULL,updated_at=now()
 WHERE order_id=p_order;
 RETURN true;
END $function$;
ROLLBACK;
