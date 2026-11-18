#!/usr/bin/env bash
# REVIEW-ONLY: confirmation is a deliberately minimal order-lock simulator.
# Cancellation is the actual proposed SQL draft loaded by workflow.
# NOT a test of deployed confirmation RPC or Mollie network verification.
set -euo pipefail
PRODUCT='00000000-0000-0000-0000-000000000301'
SELLER='10000000-0000-0000-0000-000000000301'
make_order() {
 local id="$1" payment="$2"
 psql -v ON_ERROR_STOP=1 -q <<SQL
 INSERT INTO public.allbiz_store_orders(id,seller_id,status,payment_provider,mollie_payment_id)
 VALUES ('$id','$SELLER','pending','mollie','$payment');
 INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase)
 VALUES ('$id','$SELLER','payment_attached');
 INSERT INTO public.allbiz_store_order_lines VALUES ('$id','$PRODUCT',1);
SQL
}
confirm() {
 local id="$1"
 psql -At -v ON_ERROR_STOP=1 <<SQL
 SET ROLE service_role;
 BEGIN;
 WITH changed AS (
  UPDATE public.allbiz_store_orders
  SET status='paid',fulfillment_status='awaiting_dispatch'
  WHERE id='$id' AND status='pending' AND payment_provider='mollie'
  RETURNING id
 )
 SELECT count(*)=1 FROM changed;
 SELECT pg_sleep(2);
 COMMIT;
SQL
}
cancel() {
 local id="$1" payment="$2"
 psql -At -v ON_ERROR_STOP=1 <<SQL
 SET ROLE service_role;
 SELECT public.allbiz_cancel_mollie_store_checkout('$id','$payment','failed');
SQL
}
a=$(mktemp);b=$(mktemp)
trap 'rm -f "$a" "$b"' EXIT
# Confirmation wins, delayed cancellation must fail and stock remain unchanged.
id='00000000-0000-0000-0000-000000000401'
make_order "$id" tr_Race401
before=$(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'")
(confirm "$id" >"$a") & first=$!
sleep .3
(cancel "$id" tr_Race401 >"$b") & second=$!
wait "$first";wait "$second"
grep -qx 't' "$a" || { echo 'Confirmation simulator failed';cat "$a";exit 1; }
grep -qx 'f' "$b" || { echo 'Cancellation after paid was accepted';cat "$b";exit 1; }
[[ $(psql -Atqc "SELECT status FROM public.allbiz_store_orders WHERE id='$id'") == paid ]]
[[ $(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'") == "$before" ]]
# Cancellation wins, delayed confirmation must fail and stock restored once.
id='00000000-0000-0000-0000-000000000402'
make_order "$id" tr_Race402
before=$(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'")
(
 psql -At -v ON_ERROR_STOP=1 <<SQL >"$a"
 SET ROLE service_role;
 BEGIN;
 SELECT public.allbiz_cancel_mollie_store_checkout('$id','tr_Race402','failed');
 SELECT pg_sleep(2);
 COMMIT;
SQL
) & first=$!
sleep .3
(confirm "$id" >"$b") & second=$!
wait "$first";wait "$second"
grep -qx 't' "$a" || { echo 'Cancellation failed';cat "$a";exit 1; }
grep -qx 'f' "$b" || { echo 'Confirmation after cancelled was accepted';cat "$b";exit 1; }
[[ $(psql -Atqc "SELECT status FROM public.allbiz_store_orders WHERE id='$id'") == failed ]]
[[ $(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'") -eq $((before+1)) ]]
echo 'PASS simulated confirmation/cancellation races: paid not reversed; cancelled not paid; stock restored once'
