# Mollie recovery worker implementation gates (review only)

This is not deployed. Passing policy and isolated database tests does not prove production checkout safety.

## Trusted inputs
- Claim a pending order's durable recovery row using a service-role-only fenced lease and PostgreSQL row locking.
- Load seller, merchant organization, amount, currency, mode, attached payment ID and phase from the database, not from the browser.
- Fetch provider payments only using the seller's server-side Mollie OAuth credentials. Never expose tokens or payment return hashes.
- A zero-result or incomplete provider search cannot prove no payment exists.

## Required sequence
1. Claim due recovery job atomically, with a unique lease token.
2. If the order is terminal, verify consistency before finishing the recovery job; do not alter inventory.
3. If the phase proves provider POST never started, allow only guarded pre-provider cancellation. Expiry alone is not proof.
4. Otherwise hold inventory. Fetch the attached payment or search for exactly one candidate matching order, seller, organization, amount, currency and live mode.
5. Zero, multiple, invalid or uncertain candidates require manual review or retry; never release stock.
6. Attach the unique verified payment and update recovery phase atomically. Re-fetch authoritative payment status after attachment.
7. Confirm paid orders using the existing idempotent terminal RPC. Cancel only verified failed/canceled/expired payments. Wait on open/pending/authorized.
8. On timeout, worker crash, stale lease or database error: keep stock held and retry with backoff or manual review.
9. Webhook and worker must safely race; replay cannot double-restore inventory or double-fulfill.
10. Mark recovery terminal only after checking the order and recovery state agree.

## Before production
- Implement worker Edge Function and protected scheduler. This document implements neither.
- Integrate and test real reservation, attachment, webhook and expiry functions together in a disposable database.
- Mock webhook-before-attachment, late paid events, duplicate candidates, crashes, lease expiry and concurrent worker/webhook.
- Verify merchant permissions, RLS, logging, monitoring, manual resolution and rollback.
- Obtain explicit approval before production SQL, Edge Function, scheduler or real-payment changes.
