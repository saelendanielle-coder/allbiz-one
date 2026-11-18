-- Disposable PostgreSQL ONLY. Requires existing recovery fixture and
-- review-only/mollie-safe-cancel-rpc-draft.sql loaded (without BEGIN/ROLLBACK).
\set ON_ERROR_STOP on
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'mollie';
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS mollie_payment_id text;
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS fulfillment_status text;
CREATE TABLE IF NOT EXISTS public.allbiz_catalog_products(
 id uuid PRIMARY KEY,stock integer,updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.allbiz_store_order_lines(
 order_id uuid,product_id uuid,quantity integer NOT NULL);
GRANT SELECT,UPDATE ON public.allbiz_store_orders,public.allbiz_mollie_store_recovery,public.allbiz_catalog_products TO service_role;
GRANT SELECT ON public.allbiz_store_order_lines TO service_role;
GRANT EXECUTE ON FUNCTION public.allbiz_cancel_mollie_store_checkout(uuid,text,text) TO service_role;
INSERT INTO public.allbiz_catalog_products(id,stock)
VALUES ('00000000-0000-0000-0000-000000000301',0);
INSERT INTO public.allbiz_store_orders(id,seller_id,status,payment_provider,mollie_payment_id)
VALUES
 ('00000000-0000-0000-0000-000000000302','10000000-0000-0000-0000-000000000301','pending','mollie',NULL),
 ('00000000-0000-0000-0000-000000000303','10000000-0000-0000-0000-000000000301','pending','mollie',NULL),
 ('00000000-0000-0000-0000-000000000304','10000000-0000-0000-0000-000000000301','pending','mollie','tr_Valid304'),
 ('00000000-0000-0000-0000-000000000305','10000000-0000-0000-0000-000000000301','pending','mollie','tr_Valid305');
INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase) VALUES
 ('00000000-0000-0000-0000-000000000302','10000000-0000-0000-0000-000000000301','reserved'),
 ('00000000-0000-0000-0000-000000000303','10000000-0000-0000-0000-000000000301','provider_request_started'),
 ('00000000-0000-0000-0000-000000000304','10000000-0000-0000-0000-000000000301','payment_attached'),
 ('00000000-0000-0000-0000-000000000305','10000000-0000-0000-0000-000000000301','payment_attached');
INSERT INTO public.allbiz_store_order_lines VALUES
 ('00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000301',1),
 ('00000000-0000-0000-0000-000000000303','00000000-0000-0000-0000-000000000301',1),
 ('00000000-0000-0000-0000-000000000304','00000000-0000-0000-0000-000000000301',1),
 ('00000000-0000-0000-0000-000000000305','00000000-0000-0000-0000-000000000301',1);
SET ROLE service_role;
DO $$
DECLARE ok boolean;
BEGIN
 SELECT public.allbiz_cancel_mollie_store_checkout('00000000-0000-0000-0000-000000000303',NULL,'cancelled') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Unsafe cancellation after provider start';END IF;
 SELECT public.allbiz_cancel_mollie_store_checkout('00000000-0000-0000-0000-000000000304',NULL,'cancelled') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Unsafe null cancellation for attached payment';END IF;
 SELECT public.allbiz_cancel_mollie_store_checkout('00000000-0000-0000-0000-000000000304','tr_Wrong','failed') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Wrong payment accepted';END IF;
 SELECT public.allbiz_cancel_mollie_store_checkout('00000000-0000-0000-0000-000000000302',NULL,'cancelled') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'Reserved cancellation rejected';END IF;
 SELECT public.allbiz_cancel_mollie_store_checkout('00000000-0000-0000-0000-000000000302',NULL,'cancelled') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Duplicate cancellation accepted';END IF;
 SELECT public.allbiz_cancel_mollie_store_checkout('00000000-0000-0000-0000-000000000305','tr_Valid305','failed') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'Attached verified payment cancellation rejected';END IF;
 IF (SELECT stock FROM public.allbiz_catalog_products WHERE id='00000000-0000-0000-0000-000000000301')<>2
 THEN RAISE EXCEPTION 'Stock restoration not exactly twice';END IF;
 IF EXISTS(SELECT 1 FROM public.allbiz_store_orders
 WHERE id IN ('00000000-0000-0000-0000-000000000303','00000000-0000-0000-0000-000000000304') AND status<>'pending')
 THEN RAISE EXCEPTION 'Ambiguous payment order mutated';END IF;
 IF EXISTS(SELECT 1 FROM public.allbiz_mollie_store_recovery
 WHERE order_id IN ('00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000305') AND phase<>'terminal')
 THEN RAISE EXCEPTION 'Terminal recovery not atomically updated';END IF;
 RAISE NOTICE 'PASS actual proposed SQL cancellation: provider ambiguity blocked, duplicate rejected, stock restored only for safe terminal transitions';
END $$;
RESET ROLE;
