# Deployed Mollie store webhook v5: integration audit (review only)

Inspected read-only Supabase Edge Function `allbiz-store-mollie-webhook` version 5 on 2026-11-18. No live edits or payment requests performed.

## Current execution path
1. POST form body, extracts payment id with `URLSearchParams`, validates `tr_` prefix.
2. Looks up a store order **only by an already attached** `mollie_payment_id`. Missing order returns HTTP 200 accepted without recovery.
3. Loads seller merchant connection and decrypts/refreshes seller-scoped OAuth token.
4. GETs Mollie payment by id. Checks payment id, metadata order id, EUR currency and amount cents.
5. For paid: invokes `allbiz_confirm_mollie_store_payment`; for failed/canceled/expired: invokes `allbiz_cancel_mollie_store_checkout`; otherwise acknowledges.

## Concrete gaps requiring integrated remediation
- **Webhook-before-attachment:** when checkout created provider payment but failed before attaching its ID, webhook returns accepted without linking or confirming it. Recovery worker must reconcile merchant-scoped candidates and attach atomically.
- **Identity verification:** code does not check Mollie payment metadata `allbiz_seller_id` against the stored seller ID, or payment `mode` against the expected live mode. Add these checks before any terminal RPC.
- **Status/race:** webhook checks pending status before the provider fetch. Another worker or webhook may finalize in between. Terminal SQL must remain the authority and be idempotent. Confirm/cancel RPCs need concurrent tests using the actual function definitions, not just a mocked order table.
- **Cancellation response:** checks only HTTP success for cancellation, not the RPC boolean return. Must distinguish idempotent already-terminal from unsuccessful cancellation, without retrying unsafe writes.
- **No explicit recovery row transition:** webhook does not update a durable recovery queue on success/terminal status; eventual recovery job must verify order state and close the matching task safely.
- **Response handling:** unknown provider statuses are acknowledged, but no durable retry/alert path is visible in this function. Avoid assuming HTTP 200 alone guarantees eventual reconciliation.

## Next integration test gates
- Mock Mollie HTTP GET and seller credentials without live requests.
- Use disposable PostgreSQL with real (draft) recovery/attachment SQL and eventually the exact confirm/cancel SQL definitions.
- Exercise webhook before attachment, after attachment, duplicate/replayed paid, paid-vs-failed race, provider timeout, mismatched seller, mismatched live mode, and invalid/unknown provider status.
- Assert inventory never restored for an unresolved provider request, no double fulfillment, correct order/recovery consistency and strict merchant scoping.
- Only then prepare reviewed production code and rollback; require explicit approval for production deployment.

**Status:** audit completed; full live-code integration NOT completed. Existing mock terminal tests are not proof that deployed v5 webhook passes these cases.
