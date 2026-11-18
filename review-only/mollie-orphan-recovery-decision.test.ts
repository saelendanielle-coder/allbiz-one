import {decideOrphanRecovery} from "./mollie-orphan-recovery-decision.ts";
import type {ExpectedPayment,ProviderCandidate} from "./mollie-provider-candidate-guard.ts";
const expected:ExpectedPayment={orderId:"order-1",sellerId:"seller-1",organizationId:"org_abc123",amountCents:1299,currency:"EUR"};
const good:ProviderCandidate={id:"tr_abc123",metadataOrderId:"order-1",metadataSellerId:"seller-1",organizationId:"org_abc123",amountCents:1299,currency:"EUR",mode:"live"};
const bad=(field:keyof ProviderCandidate,value:ProviderCandidate[keyof ProviderCandidate])=>({...good,[field]:value});
const cases:[string,ProviderCandidate[],string|null,boolean,string][]=[
 ["one valid",[good],null,true,"attach_and_verify"],
 ["no candidates",[],null,true,"manual_review"],
 ["multiple candidates",[good,good],null,true,"manual_review"],
 ["wrong seller",[bad("metadataSellerId","seller-2")],null,true,"manual_review"],
 ["wrong order",[bad("metadataOrderId","order-2")],null,true,"manual_review"],
 ["wrong organization",[bad("organizationId","org_other")],null,true,"manual_review"],
 ["wrong amount",[bad("amountCents",1300)],null,true,"manual_review"],
 ["wrong currency",[bad("currency","USD")],null,true,"manual_review"],
 ["test mode",[bad("mode","test")],null,true,"manual_review"],
 ["unknown mode",[bad("mode","unknown")],null,true,"manual_review"],
 ["invalid ID",[bad("id","bad")],null,true,"manual_review"],
 ["search incomplete",[good],null,false,"manual_review"],
 ["existing attached",[], "tr_existing",true,"already_attached"],
 ["attached despite search failure",[], "tr_existing",false,"already_attached"],
 ["two distinct",[good,bad("id","tr_other")],null,true,"manual_review"]
];
let count=0;
for(const [label,candidates,existing,complete,action] of cases){
 const result=decideOrphanRecovery(expected,candidates,existing,complete);
 if(result.action!==action||result.releaseInventory!==false)throw Error(label);
 if(action==="attach_and_verify"&&result.paymentId!==good.id)throw Error("Wrong payment ID");
 console.log("PASS",label);count++;
}
console.log(`${count} orphan recovery scenarios passed`);
