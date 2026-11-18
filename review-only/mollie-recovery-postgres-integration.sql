-- Run ONLY against an ephemeral PostgreSQL database in CI.
\set ON_ERROR_STOP on
-- CI prepares stub roles and order table before loading the drafts.
INSERT INTO public.allbiz_store_orders VALUES
 ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','pending'),
 ('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','paid'),
 ('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','pending');
INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase,next_check_at)
VALUES
 ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','provider_request_started',now()-interval '5 minutes'),
 ('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','payment_attached',now()-interval '5 minutes'),
 ('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','provider_request_started',now()-interval '5 minutes');
DO $$
DECLARE v_token uuid;v_count int;v_ok boolean;
BEGIN
 SELECT count(*) INTO v_count FROM public.allbiz_claim_mollie_recovery_jobs(10,60);
 IF v_count<>1 THEN RAISE EXCEPTION 'Expected one eligible pending, seller-matched claim, got %',v_count; END IF;
 SELECT lease_token INTO v_token FROM public.allbiz_mollie_store_recovery WHERE order_id='00000000-0000-0000-0000-000000000001';
 IF v_token IS NULL THEN RAISE EXCEPTION 'Claim token missing'; END IF;
 SELECT count(*) INTO v_count FROM public.allbiz_claim_mollie_recovery_jobs(10,60);
 IF v_count<>0 THEN RAISE EXCEPTION 'Double claim allowed'; END IF;
 SELECT public.allbiz_finish_mollie_recovery_claim('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000099','retry') INTO v_ok;
 IF v_ok THEN RAISE EXCEPTION 'Stale token accepted'; END IF;
 SELECT public.allbiz_finish_mollie_recovery_claim('00000000-0000-0000-0000-000000000001',v_token,'retry','temporary_provider_error') INTO v_ok;
 IF NOT v_ok THEN RAISE EXCEPTION 'Valid retry rejected'; END IF;
 SELECT public.allbiz_finish_mollie_recovery_claim('00000000-0000-0000-0000-000000000001',v_token,'retry') INTO v_ok;
 IF v_ok THEN RAISE EXCEPTION 'Duplicate completion accepted'; END IF;
 SELECT count(*) INTO v_count FROM public.allbiz_claim_mollie_recovery_jobs(10,60);
 IF v_count<>0 THEN RAISE EXCEPTION 'Backoff not respected'; END IF;
 RAISE NOTICE 'PASS isolated SQL claim, ownership, lease, stale token, completion and backoff tests';
END $$;
