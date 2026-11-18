import {decideExpiry,type ExpiryInput} from "./mollie-expiry-decision.ts";
import {decideOrphanRecovery} from "./mollie-orphan-recovery-decision.ts";
import type {ExpectedPayment,ProviderCandidate} from "./mollie-provider-candidate-guard.ts";
// Offline worker orchestration prototype. No credentials, DB, HTTP or stock writes.
export type WorkerInput={expiry:ExpiryInput;expected:ExpectedPayment;attachedPaymentId:string|null;providerSearchComplete:boolean;candidates:readonly ProviderCandidate[]};
export type WorkerAction=
 |{kind:"skip";reason:string}
 |{kind:"hold";reason:string}
 |{kind:"manual_review";reason:string}
 |{kind:"verify_attached_payment";paymentId:string}
 |{kind:"attach_then_verify";paymentId:string}
 |{kind:"confirm_verified_paid"}
 |{kind:"cancel_verified_terminal"}
 |{kind:"cancel_never_started"};
export function planMollieExpiryWork(input:WorkerInput):WorkerAction{
 const decision=decideExpiry(input.expiry);
 if(decision==="already_terminal"||decision==="not_due")return {kind:"skip",reason:decision};
 if(decision==="confirm_paid")return {kind:"confirm_verified_paid"};
 if(decision==="cancel_verified_terminal")return {kind:"cancel_verified_terminal"};
 if(decision==="cancel_before_provider")return {kind:"cancel_never_started"};
 if(input.expiry.recoveryHold)return {kind:"hold",reason:"Recovery hold requires operator or safe reconciliation"};
 if(input.attachedPaymentId)return {kind:"verify_attached_payment",paymentId:input.attachedPaymentId};
 if(!input.expiry.providerRequestStarted)return {kind:"manual_review",reason:"Inconsistent reservation phase; no automatic release"};
 const recovery=decideOrphanRecovery(input.expected,input.candidates,null,input.providerSearchComplete);
 if(recovery.action==="attach_and_verify"&&recovery.paymentId)return {kind:"attach_then_verify",paymentId:recovery.paymentId};
 return {kind:"manual_review",reason:recovery.reason};
}
