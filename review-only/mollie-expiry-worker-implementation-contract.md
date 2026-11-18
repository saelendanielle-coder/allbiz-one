# Mollie expiry worker — implementation contract (review only)

## Critical precondition
Current `allbiz_store_orders.checkout_expires_at` is set 31 minutes after reservation. It is a **review trigger**, not proof that Mollie has expired or failed. The deployed checkout v12 generic catch may release stock after an uncertain provider request. Do not deploy an expiry worker until checkout's catch is fail-closed and recovery state is durable.

## Proposed durable state (migration DRAFT — not applied)
A dedicated table `allbiz_mollie_store_recovery` should have:
- `order_id uuid PRIMARY KEY REFERENCES public.allbiz_store_orders(id)`
- `seller_id uuid NOT NULL`
- `phase text NOT NULL CHECK (phase IN ('reserved','provider_request_started','provider_response_received','payment_attached','manual_review','terminal'))`
- `attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0)`
- `next_check_at timestamptz NOT NULL DEFAULT now()`
- `last_checked_at timestamptz`
- `last_error_code text` (short sanitized code, no tokens)
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Before adopting, inspect existing schema, foreign keys, constraints, RLS and service-role grants. Define seller/organization ownership invariants. Avoid exposing recovery rows to public clients.

## Safe worker flow
1. A scheduler with authenticated service identity selects a small batch of due pending Mollie orders and recovery rows. Use row locks / `FOR UPDATE SKIP LOCKED` or a bounded atomic claim; never allow concurrent workers to release the same inventory.
2. If the provider request **never started** and a durable pre-request phase proves it, the worker may cancel through a transaction-safe RPC; otherwise retain a hold.
3. For an attached payment ID, obtain the merchant-scoped OAuth token and query Mollie. Verify provider ID, order metadata, seller, organization, amount, currency, and live mode. Do not trust webhook payload status alone.
4. If verified paid, confirm via idempotent RPC; if verified failed/canceled/expired, cancel via idempotent RPC. For open/pending/authorized/unknown or provider outage, retain stock hold and schedule retry.
5. If payment ID is absent but request may have started, search using the *same merchant scope* and exact order identity. Exactly one fully verified candidate may be atomically attached, then its status re-fetched. Zero, multiple, mismatched or incomplete search results go to manual review. **Zero results do not prove nonpayment.**
6. Record audit outcomes without tokens, payment details or customer PII. Apply exponential backoff and operational alerts. Manual review must be visible to an authorized operator.
7. Never execute a real payment or subscription cancellation from this worker. Never release stock solely on the 31-minute timestamp.

## Failure and race acceptance
- Worker crashes after claim: lease expires and work resumes without duplicate inventory effects.
- Webhook confirms while worker runs: database lock and terminal-state checks prevent rollback of paid order.
- Provider times out: retry; no release.
- Webhook before payment attachment: recovery path resolves or escalates; no false success.
- Provider reports paid after local expiry: payment must not be discarded; manual incident review if inconsistent.
- Merchant token expired: refresh or retry; no release.
- A malicious or unrelated payment candidate: reject.
- Duplicate worker, webhook and client refresh: idempotent transitions.
- Every release must be auditable and linked to a verified terminal provider state or durable proof no provider call began.

## Release sequence
1. Create an isolated test database and mocked Mollie provider.
2. Add recovery table and atomic claim/transition RPCs; validate permissions/RLS.
3. Patch checkout v12 to record provider-request phase *before* external POST, fail closed and queue recovery.
4. Patch webhook to recover unattached IDs safely and validate metadata/mode.
5. Add worker, run race/timeout tests and end-to-end buyer page tests.
6. Verify all CI and rollback plan, then seek explicit approval before any production deployment.

This document is a specification, **not a production fix**. No database migration or Edge Function deployment has been made.
