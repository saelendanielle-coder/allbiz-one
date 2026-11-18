import { isVerifiedPaymentCandidate, selectUniqueVerifiedCandidate, type ExpectedPayment, type ProviderCandidate } from "./mollie-provider-candidate-guard.ts";
const expected: ExpectedPayment = {orderId:"order-1",sellerId:"seller-1",organizationId:"org_ABC123",amountCents:100,currency:"EUR"};
const candidate: ProviderCandidate = {id:"tr_ABC123",metadataOrderId:"order-1",metadataSellerId:"seller-1",organizationId:"org_ABC123",amountCents:100,currency:"EUR",mode:"live"};
const cases: Array<[string,Partial<ProviderCandidate>,boolean]> = [
  ["valid",{},true],
  ["wrong order",{metadataOrderId:"order-2"},false],
  ["missing order",{metadataOrderId:null},false],
  ["wrong seller",{metadataSellerId:"seller-2"},false],
  ["missing seller",{metadataSellerId:null},false],
  ["wrong organization",{organizationId:"org_OTHER"},false],
  ["missing organization",{organizationId:null},false],
  ["wrong amount",{amountCents:101},false],
  ["wrong currency",{currency:"USD"},false],
  ["test payment",{mode:"test"},false],
  ["unknown mode",{mode:"unknown"},false],
  ["invalid payment ID",{id:"other_ABC"},false],
];
let n=0;
for(const [name,patch,want] of cases){
  const actual=isVerifiedPaymentCandidate(expected,{...candidate,...patch});
  if(actual!==want)throw new Error(`${name}: expected ${want}, got ${actual}`);
  console.log("PASS",name);n++;
}
const selections: Array<[string,ProviderCandidate[],boolean]> = [
  ["no candidates",[],false],
  ["one valid candidate",[candidate],true],
  ["two candidates",[candidate,{...candidate,id:"tr_DEF456"}],false],
  ["one invalid candidate",[{...candidate,amountCents:999}],false],
];
for(const [name,arr,want] of selections){
  const actual=selectUniqueVerifiedCandidate(expected,arr)!==null;
  if(actual!==want)throw new Error(`${name}: expected ${want}, got ${actual}`);
  console.log("PASS",name);n++;
}
console.log(`${n} strict candidate validation scenarios passed`);
