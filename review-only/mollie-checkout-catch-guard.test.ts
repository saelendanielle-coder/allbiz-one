import {decideCheckoutCatch,type CheckoutPhase} from "./mollie-checkout-catch-guard.ts";
const phases:CheckoutPhase[]=["before_reservation","reserved_no_provider_call","provider_request_started","provider_payment_received","payment_attached"];
let count=0;
for(const phase of phases){
 for(const hasOrder of [false,true]){
  const d=decideCheckoutCatch(phase,hasOrder);
  if(!hasOrder&&(d.action!=="no_order"||d.restoreStockAutomatically||d.needsDurableRecovery))throw Error("No-order failure");
  if(hasOrder&&phase==="reserved_no_provider_call"&&(d.action!=="cancel_reservation"||!d.restoreStockAutomatically||d.needsDurableRecovery))throw Error("Safe cancellation failure");
  if(hasOrder&&phase!=="reserved_no_provider_call"&&(d.action!=="hold_for_reconciliation"||d.restoreStockAutomatically||!d.needsDurableRecovery))throw Error("Unsafe provider phase: "+phase);
  if(!d.customerMessage.includes("Betaal niet opnieuw"))throw Error("Missing buyer warning");
  console.log("PASS",phase,hasOrder);count++;
 }
}
for(const phase of ["provider_request_started","provider_payment_received","payment_attached"] as CheckoutPhase[]){
 const d=decideCheckoutCatch(phase,true);
 if(d.restoreStockAutomatically)throw Error("Oversell risk");
 console.log("PASS inventory hold",phase);count++;
}
console.log(`${count} checkout catch guard scenarios passed`);
