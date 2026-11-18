-- Execute in disposable CI DB after cancellation fixtures and exact live confirm SQL loaded.
\set ON_ERROR_STOP on
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS mollie_organization_id text;
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS amount_total_cents integer;
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS buyer_email text;
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS purchase_expires_at timestamptz;
ALTER TABLE public.allbiz_store_orders ADD COLUMN IF NOT EXISTS download_token_hash text;
ALTER TABLE public.allbiz_store_order_lines ADD COLUMN IF NOT EXISTS unit_cents integer DEFAULT 100;
ALTER TABLE public.allbiz_store_order_lines ADD COLUMN IF NOT EXISTS digital_file_path text;
CREATE TABLE IF NOT EXISTS public.allbiz_mollie_store_payment_events(
 mollie_payment_id text PRIMARY KEY,order_id uuid,event_status text,processed_at timestamptz);
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT EXECUTE ON FUNCTION extensions.gen_random_bytes(integer),extensions.digest(text,text) TO service_role;
GRANT INSERT,UPDATE,SELECT ON public.allbiz_mollie_store_payment_events TO service_role;
GRANT EXECUTE ON FUNCTION public.allbiz_confirm_mollie_store_payment(uuid,text,text,integer,text,text) TO service_role;
INSERT INTO public.allbiz_store_orders(id,seller_id,status,payment_provider,mollie_payment_id,mollie_organization_id,amount_total_cents,currency)
VALUES
 ('00000000-0000-0000-0000-000000000501','10000000-0000-0000-0000-000000000301','pending','mollie','tr_Exact501','org_Exact501',100,'eur'),
 ('00000000-0000-0000-0000-000000000502','10000000-0000-0000-0000-000000000301','pending','mollie','tr_Exact502','org_Exact502',100,'eur');
INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase)
VALUES
 ('00000000-0000-0000-0000-000000000501','10000000-0000-0000-0000-000000000301','payment_attached'),
 ('00000000-0000-0000-0000-000000000502','10000000-0000-0000-0000-000000000301','payment_attached');
INSERT INTO public.allbiz_store_order_lines(order_id,product_id,quantity,unit_cents,digital_file_path)
VALUES
 ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000301',1,100,'private/digital.pdf'),
 ('00000000-0000-0000-0000-000000000502','00000000-0000-0000-0000-000000000301',1,100,NULL);
SET ROLE service_role;
DO $$
DECLARE ok boolean; before_stock integer;
BEGIN
 SELECT public.allbiz_confirm_mollie_store_payment('00000000-0000-0000-0000-000000000501','tr_Wrong','org_Exact501',100,'eur','buyer@example.invalid') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Wrong payment accepted';END IF;
 SELECT public.allbiz_confirm_mollie_store_payment('00000000-0000-0000-0000-000000000501','tr_Exact501','org_Exact501',101,'eur','buyer@example.invalid') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Wrong amount accepted';END IF;
 SELECT public.allbiz_confirm_mollie_store_payment('00000000-0000-0000-0000-000000000501','tr_Exact501','org_Exact501',100,'eur','buyer@example.invalid') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'Valid digital confirmation rejected';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.allbiz_store_orders WHERE id='00000000-0000-0000-0000-000000000501'
 AND status='paid' AND fulfillment_status='digital_ready' AND length(download_token_hash)=64 AND paid_at IS NOT NULL)
 THEN RAISE EXCEPTION 'Digital fulfillment invariant failed';END IF;
 SELECT public.allbiz_cancel_mollie_store_checkout('00000000-0000-0000-0000-000000000501','tr_Exact501','failed') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Cancelled paid order';END IF;
 SELECT public.allbiz_confirm_mollie_store_payment('00000000-0000-0000-0000-000000000501','tr_Exact501','org_Exact501',100,'eur','buyer@example.invalid') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Duplicate confirmation accepted';END IF;
 SELECT stock INTO before_stock FROM public.allbiz_catalog_products WHERE id='00000000-0000-0000-0000-000000000301';
 SELECT public.allbiz_cancel_mollie_store_checkout('00000000-0000-0000-0000-000000000502','tr_Exact502','failed') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'Valid cancellation rejected';END IF;
 SELECT public.allbiz_confirm_mollie_store_payment('00000000-0000-0000-0000-000000000502','tr_Exact502','org_Exact502',100,'eur','buyer@example.invalid') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Confirmed cancelled order';END IF;
 IF (SELECT stock FROM public.allbiz_catalog_products WHERE id='00000000-0000-0000-0000-000000000301')<>before_stock+1
 THEN RAISE EXCEPTION 'Stock incorrect after cancel-first';END IF;
 RAISE NOTICE 'PASS exact live confirmation RPC versus proposed cancellation, digital/amount/duplicate checks';
END $$;
RESET ROLE;
