# Proposed checkout v12 catch remediation — review only

This document is based on a read-only inspection of the currently deployed `allbiz-store-mollie-checkout` v12 source. **It is not a deployable replacement.**

## Exact unsafe point

The checkout creates a reservation, POSTs `/v2/payments` with an order-derived idempotency key, attaches the returned payment ID, then has a generic catch handler which calls `allbiz_cancel_mollie_store_checkout(p_order, null, 'cancelled')` for every error. The SQL RPC actually restores stock if the order is pending and its payment ID is null. A provider timeout or failed attachment can therefore release stock even when a payment exists at Mollie.

## Minimal code shape to develop and test

Initialize `let paymentRequestStarted = false;` beside the `order` variable.

Set `paymentRequestStarted = true` **immediately before** the `fetch('https://api.mollie.com/v2/payments', ...)` call. Do not reset it on 4xx, 5xx, network errors, malformed JSON, or failed DB attachment.

In catch:
```ts
if (order && !paymentRequestStarted) {
  // Safe only if no earlier provider payment request exists for this order.
  // Cancel through the existing authorized RPC, check and log RPC errors.
} else if (order) {
  // Do not cancel or restore stock.
  // Persist an operator-visible recovery-required record (must be implemented).
  // Log only non-sensitive order reference and phase.
}
return respond({ error: "De betaling wordt gecontroleerd. Probeer niet opnieuw te betalen voordat de status bekend is." }, 503);
```

This prevents one dangerous stock release, **but is not sufficient for production**: an order may expire, the customer may retry, and the payment ID may remain unattached. A durable recovery queue, safe expiry policy, and server-side provider reconciliation must be built first. A zero-result payment search must not be interpreted as proof that no payment exists.

## Integration acceptance criteria

1. Provider call never started -> reservation may be cancelled and stock restored once.
2. Provider call started + network timeout -> order remains held and recovery record persists.
3. Provider HTTP 5xx -> held for reconciliation.
4. Provider response malformed -> held for reconciliation.
5. Provider payment created + DB attach failed -> held for reconciliation.
6. Recovery finds exactly one verified payment matching order/seller/organization/amount/currency/live mode -> atomically attach ID and re-fetch provider status.
7. No or multiple candidates -> manual review; no automatic stock release.
8. Repeated webhook and recovery races -> exactly one terminal state transition, stock restored at most once.
9. Expiry worker must respect recovery holds and not release stock for uncertain provider requests.
10. No test should contact the live Mollie API or use live payment credentials.

## Rollout requirements

Use a separate test database and mocked provider, check existing order expiry jobs and RPCs, test subscriptions and storefront regressions, and prepare rollback. No active Supabase deployment without explicit user approval.
