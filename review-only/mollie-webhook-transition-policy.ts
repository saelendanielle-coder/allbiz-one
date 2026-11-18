// Pure, review-only webhook event transition guard. No payment or database calls.
// Provider status must be fetched server-side with merchant credentials first.
export type OrderState = "pending" | "paid" | "cancelled" | "failed";
export type ProviderState = "paid" | "failed" | "canceled" | "expired" | "open" | "pending" | "authorized" | "unknown";
export type WebhookAction = "confirm" | "cancel" | "wait" | "ignore" | "manual_review";
export function decideWebhookAction(
  order: OrderState, provider: ProviderState, paymentIdMatches: boolean,
): WebhookAction {
  if (!paymentIdMatches) return "manual_review";
  // Terminal orders never re-run stock or fulfillment effects on webhook replay.
  if (order !== "pending") return "ignore";
  if (provider === "paid") return "confirm";
  if (provider === "failed" || provider === "canceled" || provider === "expired") return "cancel";
  if (provider === "unknown") return "manual_review";
  return "wait";
}
// This does not prove idempotency of the deployed SQL or webhook; those need
// integration testing with transaction locks, retries and competing requests.
