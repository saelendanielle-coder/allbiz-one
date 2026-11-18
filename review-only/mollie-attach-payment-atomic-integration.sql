-- Disposable PostgreSQL only. Tests the exact draft attachment RPC.
\set ON_ERROR_STOP on
ALTER TABLE public.allbiz_store_orders ADD COLUMN payment_provider text NOT NULL DEFAULT 'mollie';
ALTER TABLE public.allbiz_store_orders ADD COLUMN mollie_payment_id text;
ALTER TABLE public.allbiz_store_orders ADD COLUMN mollie_return_token_hash text;
CREATE UNIQUE INDEX ON public.allbiz_store_orders(mollie_payment_id) WHERE mollie_payment_id IS NOT NULL;
GRANT SELECT,UPDATE ON public.allbiz_store_orders TO service_role;
GRANT SELECT,UPDATE ON public.allbiz_mollie_store_recovery TO service_role;
GRANT EXECUTE ON FUNCTION public.allbiz_attach_mollie_store_payment(uuid,text,text) TO service_role;
INSERT INTO public.allbiz_store_orders(id,seller_id,status) VALUES
 ('00000000-0000-0000-0000-000000000081','10000000-0000-0000-0000-000000000081','pending'),
 ('00000000-0000-0000-0000-000000000082','10000000-0000-0000-0000-000000000081','pending'),
 ('00000000-0000-0000-0000-000000000083','10000000-0000-0000-0000-000000000081','paid'),
 ('00000000-0000-0000-0000-000000000084','10000000-0000-0000-0000-000000000081','pending');
INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase) VALUES
 ('00000000-0000-0000-0000-000000000081','10000000-0000-0000-0000-000000000081','provider_request_started'),
 ('00000000-0000-0000-0000-000000000082','10000000-0000-0000-0000-000000000081','reserved'),
 ('00000000-0000-0000-0000-000000000083','10000000-0000-0000-0000-000000000081','provider_request_started'),
 ('00000000-0000-0000-0000-000000000084','10000000-0000-0000-0000-000000000081','provider_request_started');
SET ROLE service_role;
DO $$
DECLARE ok boolean; hash text:=repeat('a',64);
BEGIN
 SELECT public.allbiz_attach_mollie_store_payment('00000000-0000-0000-0000-000000000081','tr_Atomic081',hash) INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'Valid attachment rejected';END IF;
 IF (SELECT phase FROM public.allbiz_mollie_store_recovery WHERE order_id='00000000-0000-0000-0000-000000000081')<>'payment_attached'
 OR (SELECT mollie_payment_id FROM public.allbiz_store_orders WHERE id='00000000-0000-0000-0000-000000000081')<>'tr_Atomic081'
 THEN RAISE EXCEPTION 'Order/recovery not attached together';END IF;
 SELECT public.allbiz_attach_mollie_store_payment('00000000-0000-0000-0000-000000000081','tr_Duplicate',hash) INTO ok;
 IF ok THEN RAISE EXCEPTION 'Duplicate attach succeeded';END IF;
 SELECT public.allbiz_attach_mollie_store_payment('00000000-0000-0000-0000-000000000082','tr_Reserved',hash) INTO ok;
 IF ok THEN RAISE EXCEPTION 'Reserved-only attach succeeded';END IF;
 SELECT public.allbiz_attach_mollie_store_payment('00000000-0000-0000-0000-000000000083','tr_Paid',hash) INTO ok;
 IF ok THEN RAISE EXCEPTION 'Paid order attach succeeded';END IF;
 SELECT public.allbiz_attach_mollie_store_payment('00000000-0000-0000-0000-000000000084','invalid',hash) INTO ok;
 IF ok THEN RAISE EXCEPTION 'Invalid provider ID accepted';END IF;
 SELECT public.allbiz_attach_mollie_store_payment('00000000-0000-0000-0000-000000000084','tr_BadHash','invalid') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Invalid return hash accepted';END IF;
 RAISE NOTICE 'PASS attachment, duplicate, wrong phase, paid order, malformed ID/hash';
END $$;
RESET ROLE;
-- Force recovery update to fail AFTER order update. The function must roll back
-- both writes via PostgreSQL subtransaction error handling in the test.
CREATE FUNCTION public.mollie_atomic_reject_recovery_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.order_id='00000000-0000-0000-0000-000000000084'::uuid THEN
  RAISE EXCEPTION 'forced recovery write failure';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER mollie_atomic_reject BEFORE UPDATE ON public.allbiz_mollie_store_recovery
FOR EACH ROW EXECUTE FUNCTION public.mollie_atomic_reject_recovery_update();
SET ROLE service_role;
DO $$
DECLARE failed boolean:=false;
BEGIN
 BEGIN
  PERFORM public.allbiz_attach_mollie_store_payment(
   '00000000-0000-0000-0000-000000000084','tr_Atomic084',repeat('b',64));
 EXCEPTION WHEN raise_exception THEN failed:=true;
 END;
 IF NOT failed THEN RAISE EXCEPTION 'Expected recovery write failure';END IF;
 IF (SELECT mollie_payment_id FROM public.allbiz_store_orders
     WHERE id='00000000-0000-0000-0000-000000000084') IS NOT NULL
 OR (SELECT phase FROM public.allbiz_mollie_store_recovery
     WHERE order_id='00000000-0000-0000-0000-000000000084')<>'provider_request_started'
 THEN RAISE EXCEPTION 'Attachment not rolled back atomically';END IF;
 RAISE NOTICE 'PASS forced recovery failure rolls back order payment attachment';
END $$;
RESET ROLE;
