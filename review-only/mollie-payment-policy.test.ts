import {decideMollieOrderAction as decide} from "./mollie-payment-policy.ts";
import type {MollieDecision} from "./mollie-payment-policy.ts";
const base:{orderStatus:string;paymentIdMatches:boolean;metadataMatches:boolean;amountMatches:boolean;currencyMatches:boolean;mollieStatus:string|null}={orderStatus:"pending",paymentIdMatches:true,metadataMatches:true,
 amountMatches:true,currencyMatches:true,mollieStatus:"open"};
function check(name:string,input:Partial<typeof base>,expected:MollieDecision){
 const actual=decide({...base,...input});
 if(actual!==expected)throw new Error(name+": expected "+expected+" got "+actual);
 console.log("PASS "+name);
}
check("paid verified",{mollieStatus:"paid"},"confirm_paid");
check("failed verified",{mollieStatus:"failed"},"release_reservation");
check("canceled verified",{mollieStatus:"canceled"},"release_reservation");
check("expired verified",{mollieStatus:"expired"},"release_reservation");
check("open payment",{mollieStatus:"open"},"hold_reservation");
check("authorized payment",{mollieStatus:"authorized"},"hold_reservation");
check("unknown payment",{mollieStatus:"mystery"},"hold_reservation");
check("missing payment status",{mollieStatus:null},"hold_reservation");
check("payment id mismatch",{mollieStatus:"paid",paymentIdMatches:false},"hold_reservation");
check("metadata mismatch",{mollieStatus:"paid",metadataMatches:false},"hold_reservation");
check("amount mismatch",{mollieStatus:"paid",amountMatches:false},"hold_reservation");
check("currency mismatch",{mollieStatus:"paid",currencyMatches:false},"hold_reservation");
check("already finalized",{mollieStatus:"failed",orderStatus:"paid"},"hold_reservation");
console.log("All 13 policy tests passed.");
