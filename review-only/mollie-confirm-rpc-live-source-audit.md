# Review-only: live confirmation RPC audit (2026-11-18)

Source: read-only pg_get_functiondef('public.allbiz_confirm_mollie_store_payment(uuid,text,text,integer,text,text)'::regprocedure) on Supabase project woaifabvfqnnunxmhpkc. No production mutations.

## Confirmed behavior
- Requires current_user = service_role and valid tr_ / org_ IDs, EUR currency and positive amount.
- Locks the order row FOR UPDATE. Requires pending Mollie order, exact attached payment ID, organization, amount, currency and order-line sum.
- Detects digital_file_path on order lines; generates random download token and stores SHA-256 hash, sets digital_ready; otherwise awaiting_dispatch.
- Marks order paid, sets paid_at, purchase_expires_at (+30 days), buyer_email and inserts/upserts allbiz_mollie_store_payment_events.
- Does NOT lock or update a durable allbiz_mollie_store_recovery row, because that table is only a draft.

## Important deployment gates
1. Actual confirmation RPC must be tested in disposable PostgreSQL with the actual proposed cancellation RPC; prior bidirectional race test used a simplified confirmation simulator, not the live function.
2. Provider verification MUST happen before the RPC: provider payment status paid, live mode, seller identity, organization, amount/currency, order metadata, attached payment ID.
3. Add atomic recovery terminal-state update when confirming paid, with consistent order-then-recovery locking. Decide what to do if recovery row is missing or in manual_review.
4. Inspect event upsert: on conflict by payment ID it overwrites order_id; require an explicit immutable payment-to-order ownership invariant and test mismatch rejection.
5. Confirm generated digital download token is actually retrievable via supported buyer flow; current RPC stores only its hash and never returns plaintext token. Do not claim a new digital token is delivered.
6. Verify privileges, RLS, existing constraints and rollback strategy before any live migration.

## Status
Read-only audit only. No deployed code or real payments changed.
