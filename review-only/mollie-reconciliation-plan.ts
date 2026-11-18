// Review-only recovery plan. No provider requests, DB writes, or payment operations.
// Every candidate must be verified by a server-side Mollie API call using the
// connected seller's OAuth token, never by client-provided payment details.
export type ReconcileInput = {
  orderPending: boolean;
  attachedPaymentId: string | null;
  providerLookup: "unavailable" | "zero" | "one" | "multiple";
  verifiedCandidate: boolean;
  candidateStatus: "paid" | "failed" | "canceled" | "expired" | "open" | "pending" | "authorized" | "unknown";
};
export type ReconcileAction =
  | "manual_review"
  | "hold_reservation"
  | "attach_then_confirm"
  | "attach_then_cancel"
  | "attach_and_wait";
export function planReconciliation(x: ReconcileInput): ReconcileAction {
  if (!x.orderPending || x.attachedPaymentId) return "manual_review";
  if (x.providerLookup === "unavailable" || x.providerLookup === "multiple") return "manual_review";
  // No result is not evidence of absence: eventual consistency, pagination,
  // token/organization mismatches and network failures can hide a payment.
  if (x.providerLookup === "zero") return "hold_reservation";
  if (!x.verifiedCandidate || x.candidateStatus === "unknown") return "manual_review";
  if (x.candidateStatus === "paid") return "attach_then_confirm";
  if (["failed", "canceled", "expired"].includes(x.candidateStatus)) return "attach_then_cancel";
  return "attach_and_wait";
}
// IMPORTANT: actions are recommendations only. Any eventual implementation
// must atomically attach the verified ID before changing order or inventory,
// enforce seller+organization+metadata+amount+currency matching and unique IDs,
// and re-fetch the authoritative provider status before finalization.
