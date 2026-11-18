// Review-only: validate a candidate Mollie payment before linking it to an order.
// Pure function: no API calls, database writes, or live payment operations.
export type RecoveryDecision = "link_verified_payment" | "manual_review";
export type RecoveryCandidate = {
  paymentId: string | null;
  paymentStatus: string | null;
  orderIdMatches: boolean;
  merchantIdMatches: boolean;
  mollieOrganizationMatches: boolean;
  amountMatches: boolean;
  currencyMatches: boolean;
};
export function decideRecovery(candidates: RecoveryCandidate[]): RecoveryDecision {
  // Zero or multiple candidates must never be linked automatically.
  if (candidates.length !== 1) return "manual_review";
  const c = candidates[0];
  if (!c.paymentId || !c.orderIdMatches || !c.merchantIdMatches ||
      !c.mollieOrganizationMatches || !c.amountMatches || !c.currencyMatches)
    return "manual_review";
  // Do not link unknown or unrecognized payment states.
  if (!["open", "pending", "authorized", "paid", "failed", "canceled", "expired"].includes(c.paymentStatus ?? ""))
    return "manual_review";
  return "link_verified_payment";
}
