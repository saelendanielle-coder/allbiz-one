# Mollie webhook + buyer status audit (read-only)

Inspected deployed `allbiz-store-mollie-webhook` v5 and `allbiz-paid-download` v23, and the GitHub branch's `bestelling.html`.

## Verified behavior
1. Webhook receives a payment ID and searches `allbiz_store_orders` by **attached** `mollie_payment_id`. If no order matches, it returns `{accepted:true}` without recovering an unattached provider payment.
2. If a pending order matches, it fetches the provider payment and verifies payment ID, metadata order ID, EUR amount and cents. It does **not explicitly compare** `metadata.allbiz_seller_id` to the order's seller, nor `p.mode` to `live` in this function. The merchant OAuth connection is scoped to the stored seller and organization.
3. Paid status calls `allbiz_confirm_mollie_store_payment`; failed/canceled/expired calls `allbiz_cancel_mollie_store_checkout`. Open/pending statuses do nothing.
4. The buyer page `bestelling.html` stores a return token in sessionStorage, removes it from the visible URL, and polls `allbiz-paid-download` on a 202 response (up to nine requests, 3.5 seconds apart), with a manual refresh button.
5. The `mollie_buyer` branch of `allbiz-paid-download` responds with HTTP 202 for any order state other than paid or fulfilled. Thus a cancelled/failed order can appear indefinitely as “payment still processing” on the buyer page, rather than a terminal failure message.
6. Buyer status polling is **read-only**; it does not itself recover a missing Mollie payment ID or reconcile a webhook that arrived before attachment.

## Needed before production
- Implement server-side reconciliation for an unattached provider payment, with strict seller/organization/order/amount/currency/mode verification and an operator-visible queue.
- Add explicit webhook metadata seller and live-mode checks (after confirming provider response semantics).
- Return a distinct terminal buyer status for cancelled/failed/expired orders; show clear retry/support guidance without initiating a second payment automatically.
- Test webhook-before-attach, attach failure, duplicate webhooks, failed payments, expired payments and delayed paid notifications.
- Preserve existing token handling and digital download authorization; do not put credentials or raw payment details into URLs or logs.

No live function, payment, stock, or website was modified.
