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
