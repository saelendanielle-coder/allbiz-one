import {simulateMollieCheckout,type MockOutcome} from "./mollie-checkout-mocked-flow.ts";
const outcomes:MockOutcome[]=["success","timeout","http_500","malformed","attach_failed","phase_transition_failed"];
let passed=0;
for(const outcome of outcomes){
 const s=simulateMollieCheckout(outcome);
 if(s.stock!==1||s.order!=="pending")throw Error("Reservation lost: "+outcome);
 if(outcome==="success"){
  if(s.phase!=="payment_attached"||s.paymentId!=="tr_Mocked123"||s.recoveryNeeded||s.providerCalls!==1)
   throw Error("Successful provider attachment incorrect");
 }else{
  if(s.phase==="payment_attached"||s.paymentId!==null||!s.recoveryNeeded)
   throw Error("Uncertain payment was treated as completed: "+outcome);
  if(s.providerCalls!==(outcome==="phase_transition_failed"?0:1))
   throw Error("Provider called without durable phase: "+outcome);
 }
 passed++;
}
console.log("PASS "+passed+" mocked checkout flow scenarios; no live payments");
