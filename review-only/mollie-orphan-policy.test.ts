import {decideOrphanRecovery as decide} from "./mollie-orphan-policy.ts";
const base={orderStatus:"pending",attachedPaymentId:null as string|null,molliePaymentId:"tr_example",
 merchantVerified:true,orderMetadataMatches:true,amountMatches:true,currencyMatches:true};
const cases:[string,Partial<typeof base>,string][]=[
 ["verified candidate",{},"link_verified_payment_then_reconcile"],
 ["no payment ID",{molliePaymentId:null},"hold_and_investigate"],
 ["wrong merchant",{merchantVerified:false},"hold_and_investigate"],
 ["wrong metadata",{orderMetadataMatches:false},"hold_and_investigate"],
 ["wrong amount",{amountMatches:false},"hold_and_investigate"],
 ["wrong currency",{currencyMatches:false},"hold_and_investigate"],
 ["already attached",{attachedPaymentId:"tr_other"},"hold_and_investigate"],
 ["already paid",{orderStatus:"paid"},"hold_and_investigate"],
 ["already cancelled",{orderStatus:"cancelled"},"hold_and_investigate"]
];
for(const [name,change,expected] of cases){
 const got=decide({...base,...change});
 if(got!==expected)throw Error(name+": "+got+" != "+expected);
 console.log("PASS "+name);
}
console.log("All 9 orphan policy tests passed.");
