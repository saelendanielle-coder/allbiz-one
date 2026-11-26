# Read-only deployed function inspection: expiry and cancellation

Inspected actual Supabase Edge Function source, not just function names, on 2026-11-18.

| Function | Deployed version | What its code does | Mollie store expiry? |
|---|---:|---|---|
| `allbiz-mollie-cancel` | 7 | Authenticated user cancels an entry in `allbiz_mollie_subscriptions`; calls Mollie customer/subscription DELETE; updates subscription status only after provider confirmation. | No |
| `allbiz-fulfillment` | 16 | Seller changes store order fulfillment to shipped or delivered; updates tracking/status. | No |
| `allbiz-store-checkout` | 25 | Legacy Stripe checkout: creates a Stripe Checkout Session with a 30-minute expiry and cancels its own reservation in catch. | No Mollie expiry handling |

**Finding:** None of these three deployed functions is a Mollie webshop expiry worker. This narrows the search but does not rule out external scheduling, other Edge Functions or website logic. In particular, do not modify subscription cancellation or legacy Stripe functions as a substitute for fixing Mollie.

**Next engineering work:** inspect Mollie store webhook and order-status endpoint; identify whether there is a durable pending-payment recovery state; design and test an expiry worker with verified provider finality, merchant-scoped matching, transaction locks, bounded manual review and no automatic release on ambiguous results.

**Production safety:** no deployments, SQL writes, API payments, or inventory changes were performed.
