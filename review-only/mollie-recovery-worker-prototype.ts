import {decideOrphanRecovery} from "./mollie-orphan-recovery-decision.ts";
import {decideWebhookAction,type OrderState,type ProviderState} from "./mollie-webhook-transition-policy.ts";
import type {ExpectedPayment,ProviderCandidate} from "./mollie-provider-candidate-guard.ts";

// REVIEW ONLY: pure recovery worker decision engine. No network, secrets,
// database access, scheduled tasks, provider writes or payment operations.
export type RecoverySnapshot={
 orderState:OrderState;
 phase:"reserved"|"provider_request_started"|"provider_response_received"|"payment_attached"|"manual_review"|"terminal";
 attachedPaymentId:string|null;
 expected:ExpectedPayment;
 providerLookupComplete:boolean;
 candidates:readonly ProviderCandidate[];
 providerStatus:ProviderState;
 leaseValid:boolean;
};
export type RecoveryStep=
 |{action:"skip";reason:string}
 |{action:"retry";reason:string}
 |{action:"manual_review";reason:string}
 |{action:"cancel_pre_provider";reason:string}
 |{action:"attach_then_verify";paymentId:string}
 |{action:"verify_attached";paymentId:string}
 |{action:"confirm_verified_paid";paymentId:string}
 |{action:"cancel_verified_terminal";paymentId:string};
export function planRecoveryStep(s:RecoverySnapshot):RecoveryStep{
 if(!s.leaseValid)return {action:"skip",reason:"No valid fenced lease"};
 if(s.orderState!=="pending")return {action:"skip",reason:"Order already terminal; verify consistency separately"};
 if(s.phase==="terminal"||s.phase==="manual_review")
  return {action:"manual_review",reason:"Recovery task not eligible for automatic processing"};
 if(s.phase==="reserved"){
  if(s.attachedPaymentId)return {action:"manual_review",reason:"Attached payment conflicts with pre-provider phase"};
  return {action:"cancel_pre_provider",reason:"Durable reserved phase; caller must additionally prove no concurrent provider start"};
 }
 if(s.attachedPaymentId){
  if(s.phase!=="payment_attached")return {action:"manual_review",reason:"Attached ID conflicts with recovery phase"};
  if(s.providerStatus==="unknown")return {action:"retry",reason:"Provider status uncertain"};
  const action=decideWebhookAction(s.orderState,s.providerStatus,true);
  if(action==="confirm")return {action:"confirm_verified_paid",paymentId:s.attachedPaymentId};
  if(action==="cancel")return {action:"cancel_verified_terminal",paymentId:s.attachedPaymentId};
  return {action:"verify_attached",paymentId:s.attachedPaymentId};
 }
 if(s.phase==="payment_attached")return {action:"manual_review",reason:"Attached phase missing payment ID"};
 const d=decideOrphanRecovery(s.expected,s.candidates,null,s.providerLookupComplete);
 if(d.action==="attach_and_verify"&&d.paymentId)
  return {action:"attach_then_verify",paymentId:d.paymentId};
 return {action:d.reason.startsWith("No candidates")?"retry":"manual_review",reason:d.reason};
}
