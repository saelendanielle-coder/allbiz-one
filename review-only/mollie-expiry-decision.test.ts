import {decideExpiry,type ExpiryInput,type ExpiryDecision} from "./mollie-expiry-decision.ts";
const base:ExpiryInput={nowMs:200,expiresAtMs:100,orderStatus:"pending",providerRequestStarted:true,recoveryHold:false,verifiedProviderStatus:null};
const cases:[string,Partial<ExpiryInput>,ExpiryDecision][]=[
 ["unknown provider",{},"hold_for_reconciliation"],
 ["provider pending",{verifiedProviderStatus:"pending"},"hold_for_reconciliation"],
 ["provider open",{verifiedProviderStatus:"open"},"hold_for_reconciliation"],
 ["provider authorized",{verifiedProviderStatus:"authorized"},"hold_for_reconciliation"],
 ["provider unknown",{verifiedProviderStatus:"unknown"},"hold_for_reconciliation"],
 ["provider paid",{verifiedProviderStatus:"paid"},"confirm_paid"],
 ["provider failed",{verifiedProviderStatus:"failed"},"cancel_verified_terminal"],
 ["provider canceled",{verifiedProviderStatus:"canceled"},"cancel_verified_terminal"],
 ["provider expired",{verifiedProviderStatus:"expired"},"cancel_verified_terminal"],
 ["recovery hold",{recoveryHold:true,verifiedProviderStatus:"expired"},"hold_for_reconciliation"],
 ["no provider ever started",{providerRequestStarted:false},"cancel_before_provider"],
 ["not due",{nowMs:50},"not_due"],
 ["not due paid",{nowMs:50,verifiedProviderStatus:"paid"},"confirm_paid"],
 ["not due failed",{nowMs:50,verifiedProviderStatus:"failed"},"not_due"],
 ["invalid now",{nowMs:NaN},"hold_for_reconciliation"],
 ["invalid expiry",{expiresAtMs:NaN},"hold_for_reconciliation"],
 ["already paid",{orderStatus:"paid"},"already_terminal"],
 ["already fulfilled",{orderStatus:"fulfilled"},"already_terminal"],
 ["already failed",{orderStatus:"failed"},"already_terminal"],
 ["already cancelled",{orderStatus:"cancelled"},"already_terminal"],
 ["already expired",{orderStatus:"expired"},"already_terminal"],
 ["no provider but hold",{providerRequestStarted:false,recoveryHold:true},"hold_for_reconciliation"],
 ["no provider yet not due",{providerRequestStarted:false,nowMs:50},"not_due"]
];
let passed=0;
for(const [label,changes,expected] of cases){
 const actual=decideExpiry({...base,...changes});
 if(actual!==expected)throw Error(label+": expected "+expected+" got "+actual);
 console.log("PASS",label);passed++;
}
console.log(`${passed} expiry scenarios passed`);
