import {decideVerifiedWebhook,type VerifiedWebhookInput} from "./mollie-webhook-verified-boundary.ts";
const expected={orderId:"order-1",sellerId:"seller-1",organizationId:"org_Valid",amountCents:100,currency:"EUR"};
const candidate={id:"tr_123",metadataOrderId:"order-1",metadataSellerId:"seller-1",organizationId:"org_Valid",amountCents:100,currency:"EUR",mode:"live" as const};
const base:VerifiedWebhookInput={expected,candidate,attachedPaymentId:"tr_123",orderState:"pending",providerStatus:"paid"};
const cases:[string,Partial<VerifiedWebhookInput>,string][]=[
 ["valid paid",{},"confirm"],
 ["valid failed",{providerStatus:"failed"},"cancel"],
 ["valid pending",{providerStatus:"pending"},"wait"],
 ["unknown status",{providerStatus:"unknown"},"manual_review"],
 ["replayed paid",{orderState:"paid"},"ignore"],
 ["missing attachment",{attachedPaymentId:null},"recover_missing_attachment"],
 ["wrong attached payment",{attachedPaymentId:"tr_Other"},"manual_review"],
 ["wrong seller",{candidate:{...candidate,metadataSellerId:"other"}},"manual_review"],
 ["wrong organization",{candidate:{...candidate,organizationId:"org_Other"}},"manual_review"],
 ["wrong order",{candidate:{...candidate,metadataOrderId:"other"}},"manual_review"],
 ["wrong amount",{candidate:{...candidate,amountCents:200}},"manual_review"],
 ["wrong currency",{candidate:{...candidate,currency:"USD"}},"manual_review"],
 ["test-mode payment",{candidate:{...candidate,mode:"test"}},"manual_review"],
 ["unknown mode",{candidate:{...candidate,mode:"unknown"}},"manual_review"],
 ["invalid ID",{candidate:{...candidate,id:"bad"}},"manual_review"]
];
for(const [name,changes,want] of cases){
 const got=decideVerifiedWebhook({...base,...changes}).action;
 if(got!==want)throw Error(name+": expected "+want+", got "+got);
}
console.log("PASS "+cases.length+" verified webhook boundary cases (offline only)");
