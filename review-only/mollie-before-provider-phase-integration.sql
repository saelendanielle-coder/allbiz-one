-- Disposable PostgreSQL only. The recovery schema and phase RPC must be loaded first.
INSERT INTO public.allbiz_store_orders(id,seller_id,status)
VALUES
('00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','pending'),
('00000000-0000-0000-0000-000000000022','10000000-0000-0000-0000-000000000001','paid');
INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase)
VALUES
('00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','reserved'),
('00000000-0000-0000-0000-000000000022','10000000-0000-0000-0000-000000000001','reserved');
DO $$
DECLARE ok boolean;v_phase text;
BEGIN
 -- In this disposable DB current_user is postgres, so no caller may mark
 -- a request as started; production service-role test follows below.
 SELECT public.allbiz_mark_mollie_provider_request_started(
 '00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Unauthorized caller accepted';END IF;
END $$;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT,UPDATE ON public.allbiz_mollie_store_recovery TO service_role;
GRANT SELECT ON public.allbiz_store_orders TO service_role;
SET ROLE service_role;
DO $$
DECLARE ok boolean;
BEGIN
 SELECT public.allbiz_mark_mollie_provider_request_started(
 '00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'Valid transition rejected'; END IF;
 SELECT public.allbiz_mark_mollie_provider_request_started(
 '00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Duplicate transition accepted'; END IF;
 SELECT public.allbiz_mark_mollie_provider_request_started(
 '00000000-0000-0000-0000-000000000022','10000000-0000-0000-0000-000000000001') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Paid order transitioned'; END IF;
 SELECT public.allbiz_mark_mollie_provider_request_started(
 '00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000002') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Wrong seller accepted'; END IF;
 RAISE NOTICE 'PASS before-provider-call phase transitions';
END $$;
RESET ROLE;
