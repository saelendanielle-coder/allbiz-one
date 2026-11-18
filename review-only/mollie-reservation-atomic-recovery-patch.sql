-- REVIEW ONLY. Proposed single-transaction reservation + recovery registration.
-- This is a patch to the EXISTING public.allbiz_reserve_mollie_store_checkout
-- body, NOT a replacement for its validation, stock locks, or order creation.
-- Insert immediately after existing allbiz_store_order_lines INSERT and
-- BEFORE the function returns its JSON. PostgreSQL function body runs as one
-- transaction; failure of this insert rolls back the order and stock update.
--
-- BEGIN PATCH (inside existing plpgsql function)
INSERT INTO public.allbiz_mollie_store_recovery (
 order_id,seller_id,phase,next_check_at
) VALUES (
 oid,p_seller,'reserved',now()
);
-- END PATCH
--
-- Deployment prerequisites:
-- 1. Recovery table and permissions must already exist.
-- 2. Existing function runs as service_role and must have INSERT permission.
-- 3. Preserve every existing check, owner exception, product lock, stock
--    adjustment, order lines, expiry timestamp and return shape.
-- 4. BEFORE calling Mollie, require successful
--    allbiz_mark_mollie_provider_request_started(oid,p_seller).
-- 5. On uncertain provider result NEVER call null-ID cancellation.
-- 6. Reconcile provider ID and webhook races before any stock release.
-- 7. Test a deliberately rejected recovery insert to confirm that both
--    order creation and inventory decrement roll back atomically.
-- This reference file is not executable as a standalone migration.
