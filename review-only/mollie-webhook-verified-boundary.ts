import {isVerifiedPaymentCandidate,type ExpectedPayment,type ProviderCandidate} from "./mollie-provider-candidate-guard.ts";
import {decideWebhookAction,type OrderState,type ProviderState} from "./mollie-webhook-transition-policy.ts";

// Review-only verification boundary for a server-fetched Mollie payment.
// The webhook POST id alone is untrusted. No network, DB or payment calls here.
export type VerifiedWebhookInput={
 expected:ExpectedPayment;
 attachedPaymentId:string|null;
 candidate:ProviderCandidate;
 orderState:OrderState;
 providerStatus:ProviderState;
};
export type VerifiedWebhookDecision=
 |{action:"manual_review";reason:string}
 |{action:"recover_missing_attachment";reason:string}
 |{action:"confirm"|"cancel"|"wait"|"ignore";paymentId:string};
export function decideVerifiedWebhook(x:VerifiedWebhookInput):VerifiedWebhookDecision{
 if(!isVerifiedPaymentCandidate(x.expected,x.candidate))
  return {action:"manual_review",reason:"Seller, organization, order, amount, currency, mode or payment ID mismatch"};
 if(x.attachedPaymentId===null)
  return {action:"recover_missing_attachment",reason:"Provider payment verified but order has no attached payment ID; do not finalize yet"};
 if(x.attachedPaymentId!==x.candidate.id)
  return {action:"manual_review",reason:"Provider payment ID differs from order attachment"};
 const action=decideWebhookAction(x.orderState,x.providerStatus,true);
 if(action==="manual_review")return {action:"manual_review",reason:"Unknown provider status"};
 return {action,paymentId:x.candidate.id};
}
