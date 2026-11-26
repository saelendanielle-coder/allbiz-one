// Review-only mock of the checkout sequence. No network, credentials or DB writes.
export type MockOutcome="success"|"timeout"|"http_500"|"malformed"|"attach_failed"|"phase_transition_failed";
export type MockCheckoutState={
 stock:number;order:"none"|"pending"|"paid";phase:"none"|"reserved"|"provider_request_started"|"payment_attached";
 paymentId:string|null;recoveryNeeded:boolean;providerCalls:number;
};
export function simulateMollieCheckout(outcome:MockOutcome):MockCheckoutState {
 const s:MockCheckoutState={stock:2,order:"none",phase:"none",paymentId:null,recoveryNeeded:false,providerCalls:0};
 // Atomic reservation + recovery row, as proposed in review-only SQL.
 s.stock--;s.order="pending";s.phase="reserved";
 if(outcome==="phase_transition_failed"){
   // Provider call forbidden when durable transition failed.
   s.recoveryNeeded=true;
   return s;
 }
 s.phase="provider_request_started";
 s.providerCalls++;
 if(outcome==="timeout"||outcome==="http_500"||outcome==="malformed"){
   // Unknown whether Mollie created a payment; never release stock.
   s.recoveryNeeded=true;return s;
 }
 if(outcome==="attach_failed"){
   // Provider created a payment but local attachment failed.
   s.recoveryNeeded=true;return s;
 }
 s.paymentId="tr_Mocked123";s.phase="payment_attached";
 return s;
}
