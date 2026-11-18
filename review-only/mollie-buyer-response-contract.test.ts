import {buildBuyerResponse,buyerPageMessage} from "./mollie-buyer-response-contract.ts";
import type {StoreOrderStatus} from "./mollie-buyer-status-policy.ts";
const cases: Array<[StoreOrderStatus,number,boolean]>=[
 ["pending",202,false],["paid",200,true],["fulfilled",200,true],
 ["failed",409,false],["cancelled",409,false],["expired",409,false],
 ["unknown",503,false]
];
let count=0;
for(const [status,http,paid] of cases){
 const response=buildBuyerResponse({status,tokenVerified:true});
 if(response.statusCode!==http||response.body.paid!==paid||response.body.downloadsAllowed!==paid)throw Error("Incorrect buyer response: "+status);
 if(!buyerPageMessage(response))throw Error("No buyer-facing message");
 console.log("PASS",status);count++;
}
for(const order of [null,{status:"paid" as const,tokenVerified:false},{status:"pending" as const,tokenVerified:false}]){
 const response=buildBuyerResponse(order);
 if(response.statusCode!==403||response.body.paid||response.body.downloadsAllowed)throw Error("Unauthorized buyer access");
 console.log("PASS unauthorized");count++;
}
const terminal=buildBuyerResponse({status:"failed",tokenVerified:true});
if(terminal.body.status==="processing")throw Error("Terminal payment displayed as pending");
console.log("PASS terminal failure message");count++;
console.log(`${count} buyer endpoint contract scenarios passed`);
