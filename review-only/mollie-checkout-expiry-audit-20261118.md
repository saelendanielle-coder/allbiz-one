# Checkout expiry investigation — read-only (2026-11-18)

## Observed
- `allbiz_reserve_mollie_store_checkout` reserves inventory immediately and sets `checkout_expires_at = now() + interval '31 minutes'`.
- The inspected `allbiz_cancel_mollie_store_checkout` restores inventory for pending Mollie orders, but **does not** itself check the expiry timestamp or query Mollie.
- Searching the SQL routine bodies in the `public` and `allbiz_private` schemas found no separate Mollie expiry worker or cancellation caller; the checkout's generic catch is a known caller.
- `to_regclass('cron.job')` returned null for the inspected database connection, and no triggers on `public.allbiz_store_orders` were returned by the information_schema query.
- These results do **not** prove no expiry worker exists: external schedulers, Edge Functions, other schemas, or application code could still manage expiry.

## Risks and next review
1. Do not implement a naive `checkout_expires_at < now()` stock release. A provider payment can exist while the ID is not attached, or can complete late.
2. Search Edge Functions, GitHub code and external scheduler configuration for order expiry/cleanup jobs.
3. Implement durable reconciliation hold + operator-visible queue before any automatic expiry release.
4. Before releasing stock, prove provider-side finality for the **exact** merchant/order/payment and handle ambiguous or missing provider results conservatively.
5. Design a bounded operational process for reservations that remain unresolved, with alerts and manual review rather than silent permanent holds.
6. Test concurrency among webhook, expiry worker, and recovery worker with row locks and single terminal transition.
7. Do not deploy or run real payments without explicit approval.

No live database, inventory or payment state was changed by this inspection.
