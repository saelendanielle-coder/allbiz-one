// Review-only, pure candidate matching; does NOT call Mollie or change orders.
// The caller must obtain candidate fields from a trusted merchant-scoped
// Mollie API response, not from a browser request or unverified webhook payload.
export type ExpectedPayment = {
  orderId: string; sellerId: string; organizationId: string;
  amountCents: number; currency: string;
};
export type ProviderCandidate = {
  id: string; metadataOrderId: string | null; metadataSellerId: string | null;
  organizationId: string | null; amountCents: number; currency: string;
  mode: "live" | "test" | "unknown";
};
export function isVerifiedPaymentCandidate(
  expected: ExpectedPayment, candidate: ProviderCandidate,
): boolean {
  return /^tr_[A-Za-z0-9]+$/.test(candidate.id)
    && expected.orderId.length > 0 && expected.sellerId.length > 0
    && /^org_[A-Za-z0-9]+$/.test(expected.organizationId)
    && Number.isSafeInteger(expected.amountCents) && expected.amountCents > 0
    && candidate.metadataOrderId === expected.orderId
    && candidate.metadataSellerId === expected.sellerId
    && candidate.organizationId === expected.organizationId
    && candidate.amountCents === expected.amountCents
    && candidate.currency === expected.currency
    && expected.currency === "EUR"
    && candidate.mode === "live";
}
export function selectUniqueVerifiedCandidate(
  expected: ExpectedPayment, candidates: readonly ProviderCandidate[],
): ProviderCandidate | null {
  // Even an unrelated extra payment for the same order requires review;
  // do not silently pick one out of multiple results.
  if (candidates.length !== 1) return null;
  return isVerifiedPaymentCandidate(expected, candidates[0]) ? candidates[0] : null;
}
