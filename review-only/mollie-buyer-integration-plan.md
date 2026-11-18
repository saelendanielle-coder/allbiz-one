# Buyer status integration patch plan (review-only)

Target files (not modified):
- Supabase Edge Function `allbiz-paid-download` v23, action `mollie_buyer`.
- GitHub `bestelling.html`, Mollie branch `checkMollie()`.

## Backend changes required
1. Keep existing return-token hash validation and paid download authorization unchanged.
2. After verifying buyer token, return:
   - `200 {paid:true,status:"paid",...}` for paid/fulfilled, with existing download handling.
   - `202 {paid:false,status:"processing",message:"Je betaling wordt gecontroleerd. Betaal niet opnieuw."}` for pending.
   - `409 {paid:false,status:"not_paid",reason:"failed"|"cancelled"|"expired",message:"..."}` for terminal nonpaid states.
   - `503` for provider/database uncertainty; do not invent a terminal status.
3. Do not treat `checkout_expires_at` alone as proof of terminal payment status; only persisted, provider-verified terminal states qualify.
4. Never return download URLs for any nonpaid state.
5. Keep unrecognized statuses fail-closed and log an operational error without payment secrets.

## Buyer page changes required
1. Read response body only as text/data, never inject it as HTML.
2. On 202, show the existing retry guidance and bounded polling.
3. On 409 with `status:"not_paid"`, stop polling; show the server's safe terminal explanation and contact guidance.
4. On 503/network errors, show an uncertainty message: **do not pay again**, retry status later.
5. On 200 paid, preserve existing item rendering, download links, and shipment status.
6. Preserve sessionStorage token and history.replaceState URL scrubbing.

## Release gates
- Run all 129 existing review-only scenarios and add endpoint/page integration tests with mocked HTTP responses.
- Check real function behavior on a test environment before touching live functions.
- Resolve the critical checkout v12 catch/cancel issue and orphan-payment recovery before enabling live store checkout.
- Deploy only after explicit authorization, with rollback and monitoring.

This is a review-only integration plan. It does not alter production.
