// Review-only checkout failure policy. No network, database, or payment actions.
// Provider requests can succeed even if the response times out or the local attach fails.
export type CheckoutPhase =
  | "before_reservation" | "reserved_before_provider_request"
  | "provider_request_started" | "provider_payment_created"
  | "payment_attached";
export type CheckoutFailureAction =
  | "no_order_to_cancel" | "cancel_unpaid_reservation" | "hold_for_reconciliation";
export function decideCheckoutFailureAction(phase: CheckoutPhase): CheckoutFailureAction {
  if (phase === "before_reservation") return "no_order_to_cancel";
  if (phase === "reserved_before_provider_request") return "cancel_unpaid_reservation";
  return "hold_for_reconciliation";
}
// A timeout, HTTP 5xx, malformed provider response, or DB attach failure after
// the provider request started must NEVER trigger an unverified stock release.
// This policy is not a substitute for a durable reconciliation state or SQL review.
