import { decideCheckoutFailureAction, type CheckoutPhase } from "./mollie-checkout-failure-policy.ts";
const scenarios: Array<[string, CheckoutPhase, string]> = [
  ["no reservation", "before_reservation", "no_order_to_cancel"],
  ["reserved but provider not called", "reserved_before_provider_request", "cancel_unpaid_reservation"],
  ["provider request timed out", "provider_request_started", "hold_for_reconciliation"],
  ["provider HTTP 5xx or malformed response", "provider_request_started", "hold_for_reconciliation"],
  ["provider payment created but attach failed", "provider_payment_created", "hold_for_reconciliation"],
  ["payment attached but later response failed", "payment_attached", "hold_for_reconciliation"],
];
for (const [name, phase, expected] of scenarios) {
  const actual = decideCheckoutFailureAction(phase);
  if (actual !== expected) throw new Error(`${name}: expected ${expected}, got ${actual}`);
  console.log(`PASS ${name}`);
}
console.log(`${scenarios.length} checkout failure scenarios passed`);
