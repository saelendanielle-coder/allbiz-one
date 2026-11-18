# Mollie order-expiry: Edge Function inventory (read-only)

## Evidence
The deployed Supabase Edge Function list includes:
- `allbiz-store-mollie-checkout` v12 (webshop payment creation)
- `allbiz-store-mollie-webhook` v5 (webshop payment notification)
- `allbiz-store-checkout` v25 (legacy store checkout)
- `allbiz-store-connect-webhook` v18 (legacy Stripe webhook)
- `allbiz-mollie-cancel` v7 (name alone does not establish whether it cancels subscriptions or webshop orders)
- `allbiz-fulfillment` v16 (name alone does not establish expiry handling)

No Edge Function with an obvious `store-expiry`, `inventory-release` or `order-cleanup` slug was apparent in the returned list. This **does not establish** that no expiry process exists; code inside other functions or an external scheduler may implement it.

## Existing confirmed SQL
- Mollie reservation records `checkout_expires_at` 31 minutes ahead.
- The cancel RPC returns stock for pending orders without checking Mollie payment finality.
- The checkout v12 generic catch can call that RPC after an uncertain provider payment request.

## Further work
Inspect actual contents of `allbiz-mollie-cancel`, `allbiz-fulfillment`, `allbiz-store-checkout`, the website order page, and any externally configured scheduler before drawing conclusions about expiry. Design a reconciliation hold before enabling automatic release.

Read-only inspection; no active code, database or payment changes.
