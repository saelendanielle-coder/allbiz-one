import {classifyProviderFailure,type ProviderAttemptResult} from "./mollie-provider-failure-policy.ts";
import {decideCheckoutCatch,type CheckoutPhase} from "./mollie-checkout-catch-guard.ts";

// Review-only cross-policy invariants. No external calls.
const uncertain:ProviderAttemptResult[]=[
 {kind:"network_timeout"},{kind:"network_error"},
 {kind:"malformed_response"},{kind:"attachment_failed"},{kind:"unknown"},
 {kind:"http_response",status:400,validPaymentId:false},
 {kind:"http_response",status:500,validPaymentId:false},
 {kind:"http_response",status:201,validPaymentId:true}
];
const started:CheckoutPhase[]=[
 "provider_request_started","provider_payment_received","payment_attached"
];
let count=0;
for(const phase of started){
 for(const result of uncertain){
  const a=classifyProviderFailure(result);
  const b=decideCheckoutCatch(phase,true);
  if(a.canRestoreStock || !a.requireRecovery || b.restoreStockAutomatically ||
     !b.needsDurableRecovery || b.action!=="hold_for_reconciliation"){
    throw Error("Unsafe checkout/provider combination: "+phase+" / "+result.kind);
  }
  count++;
 }
}
// Cancellation is only a candidate when durable state confirms provider
// was never started. Never infer this merely from a failed HTTP response.
const notStarted=classifyProviderFailure({kind:"not_started"});
const reserved=decideCheckoutCatch("reserved_no_provider_call",true);
if(!notStarted.canRestoreStock || reserved.action!=="cancel_reservation"){
 throw Error("Pre-provider cancellation policy mismatch");
}
console.log("PASS "+(count+1)+" cross-policy checkout safety invariants");
