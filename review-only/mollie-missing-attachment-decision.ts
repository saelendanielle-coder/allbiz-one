import {selectUniqueVerifiedCandidate,type ExpectedPayment,type ProviderCandidate} from "./mollie-provider-candidate-guard.ts";

// Review-only: decide what to do when provider payment exists but the order
// has no attached payment ID. Never cancel/restore stock on ambiguous results.
export type MissingAttachmentDecision=
 |{action:"hold";reason:string}
 |{action:"manual_review";reason:string}
 |{action:"attach_verified";paymentId:string};
export function decideMissingAttachment(
 expected:ExpectedPayment, candidates:readonly ProviderCandidate[],
 providerRequestDurablyStarted:boolean,
):MissingAttachmentDecision{
 if(!providerRequestDurablyStarted)return {action:"hold",reason:"Durable provider-start phase not proven"};
 if(candidates.length===0)return {action:"hold",reason:"No provider payment found; absence is not proof of no payment"};
 if(candidates.length!==1)return {action:"manual_review",reason:"Ambiguous provider payment candidates"};
 const payment=selectUniqueVerifiedCandidate(expected,candidates);
 if(!payment)return {action:"manual_review",reason:"Provider candidate identity or mode mismatch"};
 return {action:"attach_verified",paymentId:payment.id};
}
