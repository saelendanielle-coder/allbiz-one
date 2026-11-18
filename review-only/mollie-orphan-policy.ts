// Review-only: orphaned Mollie payments cannot be safely released by age alone.
// A payment may have been created by Mollie even when attaching its ID to the order failed.
// The result of this function is advisory, never an instruction to cancel stock directly.
export type OrphanAction="hold_and_investigate"|"link_verified_payment_then_reconcile";
export function decideOrphanRecovery(input:{
 orderStatus:string;attachedPaymentId:string|null;
 molliePaymentId:string|null;merchantVerified:boolean;
 orderMetadataMatches:boolean;amountMatches:boolean;currencyMatches:boolean;
}):OrphanAction{
 if(input.orderStatus!=="pending"||input.attachedPaymentId)return "hold_and_investigate";
 if(!input.molliePaymentId||!input.merchantVerified||!input.orderMetadataMatches||
    !input.amountMatches||!input.currencyMatches)return "hold_and_investigate";
 return "link_verified_payment_then_reconcile";
}
// Operator must authenticate to Mollie on the server, identify payments by exact
// merchant + order metadata, and verify there is exactly one matching payment.
// The verified payment ID must be attached atomically via an authorized DB operation
// before existing status reconciliation is attempted. Never cancel on zero results,
// a timeout, an API error, or ambiguous multiple matches.
