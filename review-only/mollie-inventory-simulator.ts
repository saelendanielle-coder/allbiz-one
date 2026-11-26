// Isolated simulation of order+stock transitions, NOT a live Mollie integration.
import { decideCheckoutFailureAction, type CheckoutPhase } from "./mollie-checkout-failure-policy.ts";
import { planReconciliation, type ReconcileInput } from "./mollie-reconciliation-plan.ts";

type Order = { status: "pending" | "paid" | "cancelled"; paymentId: string | null; reserved: number };
export class FakeStore {
  stock: number;
  order: Order | null = null;
  constructor(stock: number) { this.stock = stock; }
  reserve(qty: number) {
    if (this.order || qty <= 0 || this.stock < qty) throw new Error("Cannot reserve");
    this.stock -= qty;
    this.order = {status:"pending",paymentId:null,reserved:qty};
  }
  fail(phase: CheckoutPhase) {
    const action = decideCheckoutFailureAction(phase);
    if (action === "cancel_unpaid_reservation") this.cancel();
    return action;
  }
  attach(id: string) {
    if (!this.order || this.order.status !== "pending" || this.order.paymentId) return false;
    this.order.paymentId = id;
    return true;
  }
  confirm(id: string) {
    if (!this.order || this.order.status !== "pending" || this.order.paymentId !== id) return false;
    this.order.status = "paid";
    return true;
  }
  cancel() {
    if (!this.order || this.order.status !== "pending") return false;
    this.order.status = "cancelled";
    this.stock += this.order.reserved;
    return true;
  }
  reconcile(input: ReconcileInput, id: string) {
    const action = planReconciliation(input);
    if (action.startsWith("attach_")) {
      if (!this.attach(id)) return "manual_review";
      if (action === "attach_then_confirm") this.confirm(id);
      if (action === "attach_then_cancel") this.cancel();
    }
    return action;
  }
}
