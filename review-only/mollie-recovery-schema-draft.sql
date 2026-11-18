-- REVIEW-ONLY DRAFT. DO NOT APPLY TO PRODUCTION.
-- Confirmed from read-only schema: public.allbiz_store_orders.id uuid,
-- seller_id uuid NOT NULL, mollie_payment_id text, status text,
-- checkout_expires_at timestamptz. RLS enabled on orders.
-- Integration must first verify existing foreign keys and ownership invariants.
BEGIN;
CREATE TABLE IF NOT EXISTS public.allbiz_mollie_store_recovery (
  order_id uuid PRIMARY KEY REFERENCES public.allbiz_store_orders(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL,
  phase text NOT NULL CHECK (phase IN (
    'reserved','provider_request_started','provider_response_received',
    'payment_attached','manual_review','terminal'
  )),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_check_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  last_checked_at timestamptz,
  last_error_code text CHECK (char_length(last_error_code) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS allbiz_mollie_recovery_due_idx
 ON public.allbiz_mollie_store_recovery (next_check_at, lease_until)
 WHERE phase NOT IN ('manual_review','terminal');
ALTER TABLE public.allbiz_mollie_store_recovery ENABLE ROW LEVEL SECURITY;
-- Intentionally no anon/authenticated grants or RLS policies.
-- Before deployment: validate seller_id matches the linked order, write
-- service-only SECURITY DEFINER claim/transition RPCs with explicit auth,
-- atomic lease claims, and durable phase write BEFORE the Mollie POST.
-- Existing checkout and expiry paths MUST be patched before scheduling.
ROLLBACK; -- safety: this reference SQL cannot persist schema changes as-is
