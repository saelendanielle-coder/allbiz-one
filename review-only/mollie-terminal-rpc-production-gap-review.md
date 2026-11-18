# Mollie checkout: review of actual terminal SQL RPCs (2026-11-18)

Read-only inspected deployed public functions `allbiz_confirm_mollie_store_payment` and `allbiz_cancel_mollie_store_checkout` using pg_get_functiondef. No SQL writes or payments.

## Verified production behavior
- Both use `SELECT ... FOR UPDATE` on the order and reject non-pending orders. This serializes terminal updates for a single order.
- Confirm requires attached payment ID, merchant organization, exact amount/currency and matching order line total; marks paid, sets digital token when applicable, and inserts a payment event.
- Cancel accepts a null `p_payment` **if stored `mollie_payment_id` is null**, then changes order to failed/cancelled and increments inventory for all stock-tracked lines. This is unsafe after a provider request might have succeeded without attachment.
- Neither terminal function updates a durable `allbiz_mollie_store_recovery` row, because that recovery table exists only in the review-only proposal.

## Required safe change before deployment
1. Never call cancellation with a null payment reference once durable `provider_request_started` is recorded. Check recovery phase under the same order/recovery locks. Require authoritative provider verification for terminal outcomes; missing attachment remains on hold.
2. For a verified failed/canceled/expired payment, check seller-scoped provider ID, metadata seller/order, live mode, organization, amount and currency before cancellation. Preserve atomic stock restoration.
3. For a verified paid payment, attach ID and confirm using consistent transactional locking; close recovery row atomically or with a fenced follow-up.
4. Replayed webhook or competing worker must never double-increment stock, reissue a digital token or duplicate fulfillment.
5. Add integration tests using actual SQL function definitions in disposable PostgreSQL, not just simplified mock terminal tables. Test null-payment cancellation after started phase, concurrent paid/failed, duplicate paid, mismatch, and rollback on event failure.

## Decision
**BLOCK production deployment** until checkout catch, terminal RPCs, webhook and recovery worker are updated as one coherent release with rollback plan and end-to-end integration tests. Current isolated tests do not prove production safety.

No changes to deployed Supabase, active website, or live Mollie.
