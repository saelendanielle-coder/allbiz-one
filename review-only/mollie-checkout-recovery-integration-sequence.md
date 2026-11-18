# Checkout v12 → durable recovery integration patch sequence (review only)

## Observed production behavior
The deployed checkout reserves stock, calls Mollie `/v2/payments`, attaches the payment ID, and uses a generic catch that can cancel the reservation with a null payment ID. This risks stock release when Mollie has created a payment but attachment failed. **This file is not a deployed fix.**

## Required transactional sequence
1. **Reserve order** with existing reservation RPC, keeping order pending and stock held.
2. **Persist recovery row** with seller/order identity and phase `reserved` in the same database transaction as reservation. The current reservation RPC must be extended atomically; a separate best-effort insert is insufficient.
3. Before the first external Mollie POST, atomically transition recovery phase `reserved → provider_request_started`. Require seller/order ownership and pending status; refuse checkout if this durable transition fails.
4. POST to Mollie using the stable order-derived idempotency key; never generate a new key on retry.
5. On a valid provider response, store payment ID and recovery phase in one transaction. The existing attach RPC must be extended atomically, verifying seller/order/payment association.
6. **On timeout, 5xx, malformed response or failed attachment:** never cancel/release stock. Record retry/manual-review and return an uncertain-status message telling the buyer not to pay again.
7. Only cancel a reservation when a transactionally durable `reserved` phase proves the provider request was never initiated. Even then, account for concurrent checkout invocations and retry attempts.
8. Webhook must verify trusted merchant context, seller/order metadata, amount/currency, payment mode, and attached ID. If attachment missing, queue reconciliation instead of silently accepting as completed.
9. Recovery worker uses fenced leases and merchant-scoped provider verification; terminal order RPCs must be idempotent under webhook races.
10. Expiry scheduler must not cancel held/uncertain orders solely because 31 minutes elapsed.

## Rollout gates
- Do not deploy until an isolated test database verifies atomic reservation+recovery insert and before-POST phase transition.
- Mock Mollie success, timeout, 5xx, malformed JSON, missing attachment, webhook-before-attach, provider paid after local expiry, and worker crash.
- Confirm rollback path, existing subscriptions unaffected, storefront and buyer downloads unchanged for paid orders.
- Obtain explicit approval for production Supabase migration, checkout Edge Function deployment, webhook deployment and expiry scheduler.

## Implementation note
The current review-only SQL drafts contain claim/finish functions and a recovery table. They **do not yet implement** the required atomic reservation+recovery insert or provider-request phase transition. Do not treat their successful CI as end-to-end payment safety.
