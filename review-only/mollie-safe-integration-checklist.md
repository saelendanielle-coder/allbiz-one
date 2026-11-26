# Mollie webshop: safe integration checklist (review-only)

## Verified as of 2026-11-18
- GitHub Actions runs for checkout safety, recovery ownership, checkout failure and reconciliation plan completed successfully on the isolated branch (55 policy scenarios total).
- Live Supabase SQL read-only inspection: RLS is enabled on `allbiz_store_orders`, `allbiz_store_order_lines`, `allbiz_catalog_products`, `allbiz_mollie_store_payment_events`, `allbiz_mollie_merchant_connections`.
- Unique indexes protect non-null `allbiz_store_orders.mollie_payment_id` and `allbiz_mollie_store_payment_events.mollie_payment_id`.
- Checkout version 12 has a generic catch that may call stock-release cancellation after provider payment creation. This is **not fixed** by the policy tests.

## Implementation sequence (not executed)
1. Capture baseline deployed function versions and SQL definitions and prepare rollback artifacts; do not expose credentials.
2. Add a durable order reconciliation state and authorized server-side recovery operation. A zero-match provider lookup must never authorize stock release.
3. Change checkout failure handling: only cancel reservation if the provider payment request was **definitely not started**; otherwise hold and log for recovery. Provider HTTP error, timeout, malformed response and DB attach error all count as uncertain.
4. Reconcile provider payments using seller-scoped OAuth and verify exact order ID, seller ID, organization, amount and currency; require exactly one candidate.
5. Atomically attach verified ID with DB uniqueness and order locking, then re-fetch provider status before confirming or cancelling.
6. Check webhook retries and concurrent recovery; a duplicate event must not double-update stock or order fulfillment.
7. Add integration tests using mocked provider responses and isolated test DB (no live payments); verify no stock release after uncertain provider result.
8. Review database access, RLS policies and migration rollback; get explicit approval before deploying any active function or SQL change.

## Release gates
- All automated tests pass; no real payments used during tests.
- No outstanding ambiguous orders; reconciliation paths documented and operator-visible.
- Existing storefront and subscription payment flows regression-tested.
- User approval required before any live deployment or activation.

No live code, schema, inventory or payments changed in this review.
