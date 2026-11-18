# Review-only audit: live Supabase Mollie webshop functions (2026-11-18)

Source inspected directly in Supabase (read-only):
- `allbiz-store-mollie-checkout`, deployed version 12.
- `allbiz-store-mollie-webhook`, deployed version 5.
- `allbiz-mollie-webhook` handles subscriptions, **not** webshop orders.

## Confirmed checkout risk
In `allbiz-store-mollie-checkout`, the catch handler calls
`allbiz_cancel_mollie_store_checkout({p_order: order,p_payment:null,p_reason:"cancelled"})`
for **any** exception after an order is reserved. This includes failures **after**
Mollie successfully creates a payment but before `allbiz_attach_mollie_store_payment`
succeeds. The outcome of the cancellation RPC was not inspected here, so actual
stock release is **not proven**, but the call is unsafe without reconciliation.

## Confirmed webhook limitation
`allbiz-store-mollie-webhook` looks up orders by an **already attached**
`mollie_payment_id`. If attaching the ID fails, the webhook cannot locate
that order and returns `accepted:true`; it cannot automatically recover this case.
It verifies Mollie order metadata, amount, currency and the seller's stored
organization connection before updating. The webhook is unauthenticated at the
HTTP layer, but fetches payment status from Mollie using merchant credentials.

## Required safe remediation (not deployed)
1. Track whether Mollie payment creation may have succeeded; once uncertain,
   never call stock-release cancellation from the generic catch block.
2. Persist an auditable `reconciliation_required` state or equivalent, and
   reconcile using the merchant-scoped Mollie API, exact order metadata,
   organization, amount and currency.
3. Only attach a unique, verified candidate using an atomic, authorization-
   checked database operation, then process verified payment status.
4. Verify the SQL RPC implementations, RLS/privileges, unique constraints and
   concurrent/replayed webhook behavior before any deployment.
5. Use mocked tests for success, timeout, provider 5xx, DB attachment failure,
   zero/multiple candidates, mismatched merchant and replay; no live payments.
6. Deploy only after independent review, a rollback plan, and explicit approval.

No Supabase function or database was changed by this audit.

## Read-only SQL RPC inspection (2026-11-18)
The live `public.allbiz_cancel_mollie_store_checkout` function:
- Locks the order row (`FOR UPDATE`) and only proceeds for a pending Mollie order.
- Rejects a mismatched non-null stored payment ID, **but allows** `p_payment:null` when the stored payment ID is null.
- Marks the order failed/cancelled and **increments product stock for each order line**.
Therefore, the generic checkout catch after a Mollie payment creation/attach failure can indeed release stock for an externally created payment whose ID is not attached.

The live `allbiz_reserve_mollie_store_checkout` function decrements stock within its transaction when reserving, before external payment creation. The `allbiz_attach_mollie_store_payment` RPC only attaches an ID if pending and null. `allbiz_confirm_mollie_store_payment` locks the order and checks provider/order/amount/currency fields before confirming. None of these alone makes the generic catch safe.

Further SQL review needed: unique indexes on payment ID and payment event, database grants and RLS, behavior when a payment arrives after the order expires, and safe reconciliation permissions.

**Do not deploy a catch-only fix without a durable recovery path and verified inventory lifecycle.**

## Read-only uniqueness and RPC privileges audit
- Unique partial index `allbiz_store_orders_mollie_payment_unique` on non-null `mollie_payment_id` prevents attaching the same ID to multiple orders.
- Unique index `allbiz_mollie_store_payment_events_unique` on `mollie_payment_id` prevents duplicate payment event rows. This does **not**, by itself, prove all webhook side effects are idempotent.
- All four webshop Mollie RPCs inspected are SECURITY INVOKER (`prosecdef=false`), with explicit EXECUTE grants to `postgres` and `service_role`; not to anon/authenticated in the inspected ACL.
- Remaining priority: prevent generic checkout catch from calling stock-release RPC after provider request may have begun, and add durable recovery path.
- No schema, RPC, or live function changes made.
