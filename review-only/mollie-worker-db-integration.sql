-- Review-only worker/database integration, ephemeral PostgreSQL only.
\set ON_ERROR_STOP on
INSERT INTO public.allbiz_store_orders(id,seller_id,status) VALUES
 ('00000000-0000-0000-0000-000000000091','10000000-0000-0000-0000-000000000091','pending');
INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase,next_check_at)
VALUES ('00000000-0000-0000-0000-000000000091',
 '10000000-0000-0000-0000-000000000091','provider_request_started',now()-interval '1 minute');
-- Keep this test independent of the other fixture rows.
UPDATE public.allbiz_mollie_store_recovery
SET next_check_at=now()+interval '1 day'
WHERE order_id<>'00000000-0000-0000-0000-000000000091'::uuid
AND phase NOT IN ('terminal','manual_review');
DO $$
DECLARE t uuid;ok boolean;n int;
BEGIN
 SELECT count(*) INTO n FROM public.allbiz_claim_mollie_recovery_jobs(1,60);
 IF n<>1 THEN RAISE EXCEPTION 'Worker failed to claim exactly one task';END IF;
 SELECT lease_token INTO t FROM public.allbiz_mollie_store_recovery
 WHERE order_id='00000000-0000-0000-0000-000000000091';
 IF t IS NULL THEN RAISE EXCEPTION 'Worker lease token absent';END IF;
 SELECT public.allbiz_finish_mollie_recovery_claim(
 '00000000-0000-0000-0000-000000000091',
 '00000000-0000-0000-0000-000000000099','manual_review') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Invalid lease accepted';END IF;
 SELECT public.allbiz_finish_mollie_recovery_claim(
 '00000000-0000-0000-0000-000000000091',t,'retry','provider_timeout') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'Valid worker retry rejected';END IF;
 IF EXISTS(SELECT 1 FROM public.allbiz_mollie_store_recovery
 WHERE order_id='00000000-0000-0000-0000-000000000091'
 AND (lease_token IS NOT NULL OR lease_until IS NOT NULL OR next_check_at<=now()
 OR last_error_code<>'provider_timeout')) THEN
 RAISE EXCEPTION 'Worker retry did not release lease/back off';END IF;
 SELECT public.allbiz_finish_mollie_recovery_claim(
 '00000000-0000-0000-0000-000000000091',t,'terminal') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Stale worker completed after lease release';END IF;
 IF (SELECT status FROM public.allbiz_store_orders
 WHERE id='00000000-0000-0000-0000-000000000091')<>'pending'
 THEN RAISE EXCEPTION 'Worker incorrectly mutated order';END IF;
 IF (SELECT phase FROM public.allbiz_mollie_store_recovery
 WHERE order_id='00000000-0000-0000-0000-000000000091')<>'provider_request_started'
 THEN RAISE EXCEPTION 'Retry incorrectly marked recovery terminal';END IF;
 RAISE NOTICE 'PASS worker DB claim, fencing, retry, lease release, order preservation';
END $$;
