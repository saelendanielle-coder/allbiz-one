#!/usr/bin/env bash
# Disposable PostgreSQL only. Concurrent webhook/worker attachment race.
set -euo pipefail
psql -v ON_ERROR_STOP=1 <<'SQL'
DROP TRIGGER IF EXISTS mollie_atomic_reject ON public.allbiz_mollie_store_recovery;
INSERT INTO public.allbiz_store_orders(id,seller_id,status)
VALUES ('00000000-0000-0000-0000-000000000092','10000000-0000-0000-0000-000000000092','pending');
INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase)
VALUES ('00000000-0000-0000-0000-000000000092','10000000-0000-0000-0000-000000000092','provider_request_started');
SQL
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
# The worker holds the order row lock while attaching the payment.
(
psql -v ON_ERROR_STOP=1 -At <<'SQL'
BEGIN;
SET LOCAL ROLE service_role;
SELECT public.allbiz_attach_mollie_store_payment(
'00000000-0000-0000-0000-000000000092','tr_Worker092',repeat('a',64));
SELECT pg_sleep(2);
COMMIT;
SQL
) >"$tmp/worker" 2>"$tmp/worker.err" &
worker=$!
sleep 0.4
# A competing webhook-like attachment attempt must not overwrite it.
(
psql -v ON_ERROR_STOP=1 -At <<'SQL'
BEGIN;
SET LOCAL ROLE service_role;
SELECT public.allbiz_attach_mollie_store_payment(
'00000000-0000-0000-0000-000000000092','tr_Webhook092',repeat('b',64));
COMMIT;
SQL
) >"$tmp/webhook" 2>"$tmp/webhook.err" &
webhook=$!
wait "$worker"
wait "$webhook"
grep -qx 't' "$tmp/worker" || { cat "$tmp/worker.err"; cat "$tmp/worker"; exit 1; }
grep -qx 'f' "$tmp/webhook" || { cat "$tmp/webhook.err"; cat "$tmp/webhook"; exit 1; }
psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
 IF (SELECT mollie_payment_id FROM public.allbiz_store_orders
 WHERE id='00000000-0000-0000-0000-000000000092') <> 'tr_Worker092'
 OR (SELECT phase FROM public.allbiz_mollie_store_recovery
 WHERE order_id='00000000-0000-0000-0000-000000000092') <> 'payment_attached'
 THEN RAISE EXCEPTION 'Concurrent attachment corrupted order/recovery'; END IF;
 RAISE NOTICE 'PASS worker/webhook-like attachment race: one winner, consistent order and recovery';
END $$;
SQL
