-- REVIEW-ONLY DRAFT. DO NOT APPLY TO PRODUCTION.
-- Existing orders id and seller_id are uuid. No production changes.
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
  lease_token uuid,
  last_checked_at timestamptz,
  last_error_code text CHECK (char_length(last_error_code) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recovery_lease_pair CHECK ((lease_until IS NULL) = (lease_token IS NULL))
);
CREATE INDEX IF NOT EXISTS allbiz_mollie_recovery_due_idx
 ON public.allbiz_mollie_store_recovery (next_check_at, lease_until)
 WHERE phase NOT IN ('manual_review','terminal');
ALTER TABLE public.allbiz_mollie_store_recovery ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.allbiz_mollie_store_recovery FROM PUBLIC, anon, authenticated;
-- Do not expose recovery rows to public clients. Before deployment:
-- verify schema, seller ownership, service-role permissions and RLS;
-- write durable phase BEFORE external Mollie POST; patch unsafe checkout catch;
-- test webhook/worker races and backoff against isolated database.
ROLLBACK;
