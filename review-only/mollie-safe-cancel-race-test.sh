#!/usr/bin/env bash
# Review-only race test using the actual proposed cancellation SQL already loaded
# by mollie-recovery-postgres-integration.yml. No production access.
set -euo pipefail
ORDER='00000000-0000-0000-0000-000000000304'
PRODUCT='00000000-0000-0000-0000-000000000301'
before=$(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'")
a=$(mktemp);b=$(mktemp)
trap 'rm -f "$a" "$b"' EXIT
(
 psql -At -v ON_ERROR_STOP=1 <<SQL >"$a"
SET ROLE service_role;
BEGIN;
SELECT public.allbiz_cancel_mollie_store_checkout('$ORDER','tr_Valid304','failed');
SELECT pg_sleep(2);
COMMIT;
SQL
) &
pid=$!
sleep 0.3
(
 psql -At -v ON_ERROR_STOP=1 <<SQL >"$b"
SET ROLE service_role;
SELECT public.allbiz_cancel_mollie_store_checkout('$ORDER','tr_Valid304','failed');
SQL
) &
pid2=$!
wait "$pid"
wait "$pid2"
grep -qx 't' "$a" || { echo 'First cancellation did not succeed';cat "$a";exit 1; }
grep -qx 'f' "$b" || { echo 'Competing cancellation was not rejected';cat "$b";exit 1; }
after=$(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'")
[[ "$after" -eq $((before+1)) ]] || { echo "Stock restored wrong amount: $before -> $after";exit 1; }
psql -Atqc "SELECT status||':'||phase FROM public.allbiz_store_orders o JOIN public.allbiz_mollie_store_recovery r ON r.order_id=o.id WHERE o.id='$ORDER'" | grep -qx 'failed:terminal'
echo 'PASS concurrent cancellation: one winner, one rejected, stock restored once'
