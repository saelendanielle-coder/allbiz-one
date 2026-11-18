# Mollie terminal RPCs — production source audit (read-only, 2026-11-18)

Source: exact current PostgreSQL function definitions queried read-only from Supabase project `woaifabvfqnnunxmhpkc`:
- `public.allbiz_confirm_mollie_store_payment(uuid,text,text,integer,text,text)`
- `public.allbiz_cancel_mollie_store_checkout(uuid,text,text)`

**No production SQL was executed or modified.**

## Verified behavior
- Both functions check `current_user = 'service_role'` and lock the order row `FOR UPDATE`.
- Confirm requires pending Mollie order, matching stored payment ID, merchant organization, amount, currency, and order-line sum; marks paid, assigns fulfillment state and inserts a payment event.
- Cancel requires pending Mollie order and permitted reason; marks cancelled/failed and returns quantities to stock.
- Both return `false` for non-pending orders. A repeated webhook can therefore receive a false return even when an earlier request already completed the intended transition.

## Critical fail-closed gap
The **deployed cancellation RPC** allows cancellation if `o.mollie_payment_id IS NULL`, even if a provider request was already started and Mollie may have created a payment. It does not consult a durable recovery phase. This is the known overselling/stock-restoration risk from checkout v12's unconditional catch. Never call cancellation with a null payment ID unless a durable transaction proves the provider request was not started.

## Required implementation gates
1. Write a full disposable-DB fixture for the exact current confirm/cancel RPC definitions and dependencies (order lines, products, payment events, extensions).
2. Test concurrent paid-vs-failed terminal transitions with separate PostgreSQL sessions and assert exactly one terminal transition; no double stock release or fulfillment.
3. Implement a *draft* cancellation guard that locks recovery state and rejects ambiguous provider-started orders. Test it against the same fixtures; don't weaken provider verification.
4. Reconcile terminal order and recovery row in the same durable transaction or prove a safe retry path.
5. Test webhook's handling of RPC `false` after another worker has finalized; re-read authoritative order status and never report a false success.
6. Assemble complete migrations, Edge Function code, monitoring, rollback, and deploy checklist. Require explicit approval before applying to production.

**Status:** exact production SQL inspected, concrete risk confirmed. Full integration tests and remediation still OPEN. Prior mock tests do not validate these live RPC definitions.
