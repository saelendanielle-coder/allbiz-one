#!/usr/bin/env bash
# Isolated PostgreSQL: actual deployed confirmation RPC vs proposed cancellation RPC.
# Both functions already loaded by CI. No Mollie calls or production writes.
set -euo pipefail
SELLER='10000000-0000-0000-0000-000000000301'
PRODUCT='00000000-0000-0000-0000-000000000301'
make_order() {
 local id="$1" payment="$2"
 psql -v ON_ERROR_STOP=1 -q <<SQL
 INSERT INTO public.allbiz_store_orders(id,seller_id,status,payment_provider,mollie_payment_id,mollie_organization_id,amount_total_cents,currency)
 VALUES ('$id','$SELLER','pending','mollie','$payment','org_Race',100,'eur');
 INSERT INTO public.allbiz_mollie_store_recovery(order_id,seller_id,phase)
 VALUES ('$id','$SELLER','payment_attached');
 INSERT INTO public.allbiz_store_order_lines(order_id,product_id,quantity,unit_cents)
 VALUES ('$id','$PRODUCT',1,100);
SQL
}
confirm() {
 local id="$1" payment="$2" delay="$3"
 psql -At -v ON_ERROR_STOP=1 <<SQL
 SET ROLE service_role;
 BEGIN;
 SELECT public.allbiz_confirm_mollie_store_payment('$id','$payment','org_Race',100,'eur','test@example.invalid');
 SELECT pg_sleep($delay);
 COMMIT;
SQL
}
cancel() {
 local id="$1" payment="$2" delay="$3"
 psql -At -v ON_ERROR_STOP=1 <<SQL
 SET ROLE service_role;
 BEGIN;
 SELECT public.allbiz_cancel_mollie_store_checkout('$id','$payment','failed');
 SELECT pg_sleep($delay);
 COMMIT;
SQL
}
a=$(mktemp);b=$(mktemp)
trap 'rm -f "$a" "$b"' EXIT
# Paid wins while cancellation waits on order row lock.
id='00000000-0000-0000-0000-000000000601'
make_order "$id" tr_Race601
before=$(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'")
(confirm "$id" tr_Race601 2 >"$a") & first=$!
sleep 0.3
(cancel "$id" tr_Race601 0 >"$b") & second=$!
wait "$first";wait "$second"
grep -qx 't' "$a" || { echo 'Real confirmation did not succeed';cat "$a";exit 1; }
grep -qx 'f' "$b" || { echo 'Cancellation reversed paid order';cat "$b";exit 1; }
[[ $(psql -Atqc "SELECT status FROM public.allbiz_store_orders WHERE id='$id'") == paid ]]
[[ $(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'") == "$before" ]]
[[ $(psql -Atqc "SELECT count(*) FROM public.allbiz_mollie_store_payment_events WHERE order_id='$id'") == 1 ]]
# Cancel wins; real confirmation waits, then must fail without event.
id='00000000-0000-0000-0000-000000000602'
make_order "$id" tr_Race602
before=$(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'")
(cancel "$id" tr_Race602 2 >"$a") & first=$!
sleep 0.3
(confirm "$id" tr_Race602 0 >"$b") & second=$!
wait "$first";wait "$second"
grep -qx 't' "$a" || { echo 'Cancellation did not succeed';cat "$a";exit 1; }
grep -qx 'f' "$b" || { echo 'Real confirmation reversed cancelled order';cat "$b";exit 1; }
[[ $(psql -Atqc "SELECT status FROM public.allbiz_store_orders WHERE id='$id'") == failed ]]
[[ $(psql -Atqc "SELECT stock FROM public.allbiz_catalog_products WHERE id='$PRODUCT'") -eq $((before+1)) ]]
[[ $(psql -Atqc "SELECT count(*) FROM public.allbiz_mollie_store_payment_events WHERE order_id='$id'") == 0 ]]
echo 'PASS real confirmation RPC versus proposed cancellation RPC in two concurrent sessions'
