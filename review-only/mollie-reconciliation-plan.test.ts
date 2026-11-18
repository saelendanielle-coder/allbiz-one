import { planReconciliation, type ReconcileInput, type ReconcileAction } from "./mollie-reconciliation-plan.ts";
const base: ReconcileInput = {
  orderPending: true, attachedPaymentId: null, providerLookup: "one",
  verifiedCandidate: true, candidateStatus: "paid",
};
const cases: Array<[string, Partial<ReconcileInput>, ReconcileAction]> = [
  ["verified paid", {}, "attach_then_confirm"],
  ["verified failed", {candidateStatus:"failed"}, "attach_then_cancel"],
  ["verified canceled", {candidateStatus:"canceled"}, "attach_then_cancel"],
  ["verified expired", {candidateStatus:"expired"}, "attach_then_cancel"],
  ["open", {candidateStatus:"open"}, "attach_and_wait"],
  ["pending", {candidateStatus:"pending"}, "attach_and_wait"],
  ["authorized", {candidateStatus:"authorized"}, "attach_and_wait"],
  ["provider unavailable", {providerLookup:"unavailable"}, "manual_review"],
  ["no candidate", {providerLookup:"zero"}, "hold_reservation"],
  ["multiple candidates", {providerLookup:"multiple"}, "manual_review"],
  ["candidate mismatch", {verifiedCandidate:false}, "manual_review"],
  ["unknown status", {candidateStatus:"unknown"}, "manual_review"],
  ["already attached", {attachedPaymentId:"tr_existing"}, "manual_review"],
  ["not pending", {orderPending:false}, "manual_review"],
];
for (const [name, patch, expected] of cases) {
  const actual = planReconciliation({...base,...patch});
  if (actual !== expected) throw new Error(`${name}: ${actual} !== ${expected}`);
  console.log("PASS", name);
}
console.log(`${cases.length} reconciliation policy scenarios passed`);
