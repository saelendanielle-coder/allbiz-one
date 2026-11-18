import {mapMollieBuyerStatus,type StoreOrderStatus} from "./mollie-buyer-status-policy.ts";
const cases: Array<[StoreOrderStatus,number,string,boolean]> = [
 ["pending",202,"processing",false],["paid",200,"paid",true],
 ["fulfilled",200,"paid",true],["failed",409,"not_paid",false],
 ["cancelled",409,"not_paid",false],["expired",409,"not_paid",false],
 ["unknown",503,"unavailable",false],
];
for(const [state,httpStatus,result,downloads] of cases){
 const actual=mapMollieBuyerStatus(state);
 if(actual.httpStatus!==httpStatus||actual.state!==result||actual.allowDownloads!==downloads)throw Error("Wrong mapping: "+state);
 if(!actual.message||actual.message.length<15)throw Error("Missing explanation: "+state);
 console.log("PASS",state);
}
for(const state of ["pending","failed","cancelled","expired","unknown"] as StoreOrderStatus[]){
 const actual=mapMollieBuyerStatus(state);
 if(actual.allowDownloads)throw Error("Unauthorized downloads: "+state);
 if(!/betaal|betaling|betaalstatus/i.test(actual.message))throw Error("Missing payment guidance: "+state);
 console.log("PASS payment guidance",state);
}
for(const state of ["failed","cancelled","expired"] as StoreOrderStatus[]){
 const actual=mapMollieBuyerStatus(state);
 if(actual.httpStatus===202)throw Error("Terminal order still processing: "+state);
 console.log("PASS terminal not pending",state);
}
console.log("15 buyer status scenarios passed");
