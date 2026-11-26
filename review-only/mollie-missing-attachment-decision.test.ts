import {decideMissingAttachment} from "./mollie-missing-attachment-decision.ts";
const e={orderId:"o1",sellerId:"s1",organizationId:"org_123",amountCents:100,currency:"EUR"};
const c={id:"tr_123",metadataOrderId:"o1",metadataSellerId:"s1",organizationId:"org_123",amountCents:100,currency:"EUR",mode:"live" as const};
const cases:[string,typeof c[],boolean,string][]=[
 ["valid payment",[c],true,"attach_verified"],
 ["no candidate",[],true,"hold"],
 ["no durable start",[c],false,"hold"],
 ["two candidates",[c,c],true,"manual_review"],
 ["wrong seller",[{...c,metadataSellerId:"s2"}],true,"manual_review"],
 ["wrong order",[{...c,metadataOrderId:"o2"}],true,"manual_review"],
 ["wrong organization",[{...c,organizationId:"org_456"}],true,"manual_review"],
 ["wrong amount",[{...c,amountCents:200}],true,"manual_review"],
 ["wrong currency",[{...c,currency:"USD"}],true,"manual_review"],
 ["test payment",[{...c,mode:"test" as const}],true,"manual_review"],
 ["bad payment ID",[{...c,id:"invalid"}],true,"manual_review"]
];
for(const [name,candidates,started,want] of cases){
 const got=decideMissingAttachment(e,candidates,started).action;
 if(got!==want)throw Error(name+": expected "+want+" got "+got);
}
console.log("PASS "+cases.length+" missing-attachment decisions; no payments or DB changes");
