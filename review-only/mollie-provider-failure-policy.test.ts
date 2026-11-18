import {classifyProviderFailure,type ProviderAttemptResult} from "./mollie-provider-failure-policy.ts";
const cases:ProviderAttemptResult[]=[
 {kind:"not_started"},
 {kind:"http_response",status:400,validPaymentId:false},
 {kind:"http_response",status:409,validPaymentId:false},
 {kind:"http_response",status:500,validPaymentId:false},
 {kind:"http_response",status:200,validPaymentId:false},
 {kind:"http_response",status:201,validPaymentId:true},
 {kind:"network_timeout"},{kind:"network_error"},
 {kind:"malformed_response"},{kind:"attachment_failed"},{kind:"unknown"}
];
let passed=0;
for(const c of cases){
 const r=classifyProviderFailure(c);
 const safe=c.kind==="not_started";
 if(r.canRestoreStock!==safe || r.requireRecovery===safe ||
    r.action!==(safe?"cancel_only_if_durable_not_started":"hold_and_reconcile"))
   throw Error("Unsafe provider failure policy: "+JSON.stringify(c));
 if(!r.message.includes("Betaal niet opnieuw"))throw Error("Missing warning");
 passed++;
}
console.log("PASS "+passed+" provider failure scenarios");
