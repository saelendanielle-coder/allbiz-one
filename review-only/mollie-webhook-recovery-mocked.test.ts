import {simulateMollieCheckout} from "./mollie-checkout-mocked-flow.ts";
import {decideWebhookAction} from "./mollie-webhook-transition-policy.ts";
import {decideOrphanRecovery} from "./mollie-orphan-recovery-decision.ts";
import type {ExpectedPayment,ProviderCandidate} from "./mollie-provider-candidate-guard.ts";

// Review-only cross-module scenarios. No real Mollie requests, database or payments.
const expected:ExpectedPayment={orderId:"order-1",sellerId:"seller-1",organizationId:"org_Mocked",amountCents:100,currency:"EUR"};
const valid:ProviderCandidate={id:"tr_Mocked123",metadataOrderId:expected.orderId,metadataSellerId:expected.sellerId,organizationId:expected.organizationId,amountCents:100,currency:"EUR",mode:"live"};
let n=0;
function check(ok:boolean,message:string){if(!ok)throw Error(message);n++;}

// Webhook arrives before attachment: cannot confirm or release stock.
const orphan=simulateMollieCheckout("attach_failed");
check(orphan.stock===1&&orphan.paymentId===null&&orphan.recoveryNeeded,"Orphan payment must hold stock");
check(decideWebhookAction("pending","paid",false)==="manual_review","Unattached webhook must not confirm");

// Empty or incomplete provider search cannot justify inventory release.
for(const complete of [false,true]){
 const decision=decideOrphanRecovery(expected,[],null,complete);
 check(decision.action==="manual_review"&&!decision.releaseInventory,"Empty provider search must hold inventory");
}
// A unique fully matched candidate may be attached, but still needs provider status verification.
const recovered=decideOrphanRecovery(expected,[valid],null,true);
check(recovered.action==="attach_and_verify"&&recovered.paymentId===valid.id&&!recovered.releaseInventory,"Verified candidate not selected safely");
// Any conflicting candidate must require manual review.
const ambiguous=decideOrphanRecovery(expected,[valid,{...valid,id:"tr_Another"}],null,true);
check(ambiguous.action==="manual_review"&&!ambiguous.releaseInventory,"Multiple candidates cannot auto-attach");
const wrongSeller=decideOrphanRecovery(expected,[{...valid,metadataSellerId:"other"}],null,true);
check(wrongSeller.action==="manual_review","Wrong seller must not auto-attach");
// After verified attachment, a paid webhook can confirm once, replay must be ignored.
check(decideWebhookAction("pending","paid",true)==="confirm","Verified paid event must confirm");
check(decideWebhookAction("paid","paid",true)==="ignore","Paid webhook replay must be ignored");
// Pending/unknown provider status cannot mark order paid or cancel stock.
check(decideWebhookAction("pending","pending",true)==="wait","Pending provider must wait");
check(decideWebhookAction("pending","unknown",true)==="manual_review","Unknown provider must require review");
// Checkout timeout is ambiguous even when the webhook arrives after local expiry.
const timeout=simulateMollieCheckout("timeout");
check(timeout.stock===1&&timeout.recoveryNeeded,"Timeout must preserve stock before reconciliation");
check(decideWebhookAction("pending","paid",false)==="manual_review","Late paid webhook without attachment needs reconciliation");
console.log("PASS "+n+" mocked webhook/recovery cross-module assertions (no live payments)");
