import {planMollieExpiryWork,type WorkerInput} from "./mollie-expiry-worker-planner.ts";
const candidate={id:"tr_valid123",metadataOrderId:"order-1",metadataSellerId:"seller-1",organizationId:"org_abc123",amountCents:1299,currency:"EUR",mode:"live" as const};
const base:WorkerInput={expiry:{nowMs:200,expiresAtMs:100,orderStatus:"pending",providerRequestStarted:true,recoveryHold:false,verifiedProviderStatus:null},expected:{orderId:"order-1",sellerId:"seller-1",organizationId:"org_abc123",amountCents:1299,currency:"EUR"},attachedPaymentId:null,providerSearchComplete:false,candidates:[]};
const scenarios:[string,Partial<WorkerInput>,string][]=[
 ["unknown payment",{},"manual_review"],
 ["single verified candidate",{providerSearchComplete:true,candidates:[candidate]},"attach_then_verify"],
 ["no candidates",{providerSearchComplete:true},"manual_review"],
 ["duplicate candidates",{providerSearchComplete:true,candidates:[candidate,candidate]},"manual_review"],
 ["wrong merchant",{providerSearchComplete:true,candidates:[{...candidate,organizationId:"org_other"}]},"manual_review"],
 ["attached payment",{attachedPaymentId:"tr_attached"},"verify_attached_payment"],
 ["hold attached",{attachedPaymentId:"tr_attached",expiry:{...base.expiry,recoveryHold:true}},"hold"],
 ["verified paid",{expiry:{...base.expiry,verifiedProviderStatus:"paid"}},"confirm_verified_paid"],
 ["verified failed",{expiry:{...base.expiry,verifiedProviderStatus:"failed"}},"cancel_verified_terminal"],
 ["verified canceled",{expiry:{...base.expiry,verifiedProviderStatus:"canceled"}},"cancel_verified_terminal"],
 ["verified expired",{expiry:{...base.expiry,verifiedProviderStatus:"expired"}},"cancel_verified_terminal"],
 ["provider pending",{expiry:{...base.expiry,verifiedProviderStatus:"pending"}},"manual_review"],
 ["not due",{expiry:{...base.expiry,nowMs:50}},"skip"],
 ["already paid",{expiry:{...base.expiry,orderStatus:"paid"}},"skip"],
 ["never started",{expiry:{...base.expiry,providerRequestStarted:false}},"cancel_never_started"],
 ["never started held",{expiry:{...base.expiry,providerRequestStarted:false,recoveryHold:true}},"hold"],
 ["inconsistent preprovider",{expiry:{...base.expiry,providerRequestStarted:false,verifiedProviderStatus:"unknown"}},"manual_review"]
];
let count=0;
for(const [label,overrides,expected] of scenarios){
 const result=planMollieExpiryWork({...base,...overrides});
 if(result.kind!==expected)throw Error(label+" expected "+expected+" got "+result.kind);
 if(["manual_review","hold","verify_attached_payment","attach_then_verify"].includes(result.kind)&&result.kind.startsWith("cancel"))throw Error("Unsafe release");
 console.log("PASS",label);count++;
}
console.log(`${count} offline worker scenarios passed`);
