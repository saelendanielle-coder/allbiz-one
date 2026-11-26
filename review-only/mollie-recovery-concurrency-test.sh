#!/usr/bin/env bash
# Disposable PostgreSQL only. No Supabase or Mollie connections.
set -euo pipefail
psql -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO public.allbiz_store_orders(id,seller_id,status)
VALUES ('00000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001','pending');
INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase,next_check_at)
VALUES ('00000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001','provider_request_started',now()-interval '1 minute');
SQL
# Session A holds a row lock; session B must skip the locked job immediately.
psql -v ON_ERROR_STOP=1 <<'SQL' >/tmp/mollie-lock-holder.log 2>&1 &
BEGIN;
SELECT order_id FROM public.allbiz_mollie_store_recovery
WHERE order_id='00000000-0000-0000-0000-000000000011' FOR UPDATE;
SELECT pg_sleep(5);
ROLLBACK;
SQL
holder=$!
trap 'kill "$holder" 2>/dev/null || true' EXIT
# Poll pg_locks to confirm the other session holds the row before asserting.
ready=0
for _ in $(seq 1 40); do
  if psql -Atqc "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE query LIKE '%pg_sleep(5)%' AND state='active' AND pid<>pg_backend_pid())" | grep -qx t; then ready=1; break; fi
  sleep 0.1
done
if [[ "$ready" != 1 ]]; then echo 'Lock holder did not start'; exit 1; fi
# PostgreSQL SKIP LOCKED returns zero rows while the lock is held.
count=$(psql -Atqc "SELECT count(*) FROM public.allbiz_claim_mollie_recovery_jobs(10,60)")
if [[ "$count" != 0 ]]; then echo "FAIL: locked job was claimed ($count)"; exit 1; fi
wait "$holder"
trap - EXIT
count=$(psql -Atqc "SELECT count(*) FROM public.allbiz_claim_mollie_recovery_jobs(10,60)")
if [[ "$count" != 1 ]]; then echo "FAIL: unlocked job not claimed ($count)"; exit 1; fi
count=$(psql -Atqc "SELECT count(*) FROM public.allbiz_claim_mollie_recovery_jobs(10,60)")
if [[ "$count" != 0 ]]; then echo "FAIL: duplicate claim after lease ($count)"; exit 1; fi
echo 'PASS concurrent lock skip, post-lock claim, and duplicate lease protection'
