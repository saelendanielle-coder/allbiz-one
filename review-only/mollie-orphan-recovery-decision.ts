import {selectUniqueVerifiedCandidate,type ExpectedPayment,type ProviderCandidate} from "./mollie-provider-candidate-guard.ts";
// Review-only recovery decision. It never performs API calls or stock writes.
// A provider search that returns zero items is NOT proof no payment exists.
export type RecoveryDecision={action:"attach_and_verify"|"manual_review"|"already_attached";releaseInventory:false;reason:string;paymentId?:string};
export function decideOrphanRecovery(expected:ExpectedPayment,candidates:readonly ProviderCandidate[],existingPaymentId:string|null,providerSearchComplete:boolean):RecoveryDecision{
 if(existingPaymentId)return {action:"already_attached",releaseInventory:false,reason:"Existing payment ID must be checked by webhook/reconciliation",paymentId:existingPaymentId};
 if(!providerSearchComplete)return {action:"manual_review",releaseInventory:false,reason:"Provider search incomplete or uncertain"};
 const match=selectUniqueVerifiedCandidate(expected,candidates);
 if(match)return {action:"attach_and_verify",releaseInventory:false,reason:"One fully matched candidate; verify provider status after atomic attach",paymentId:match.id};
 return {action:"manual_review",releaseInventory:false,reason:candidates.length===0?"No candidates does not prove payment absence":"Ambiguous or mismatched candidates"};
}
