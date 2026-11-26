import {planRecoveryStep,type RecoverySnapshot} from "./mollie-recovery-worker-prototype.ts";
const expected={orderId:"order-1",sellerId:"seller-1",organizationId:"org_Test",amountCents:100,currency:"EUR"};
const candidate={id:"tr_123",metadataOrderId:"order-1",metadataSellerId:"seller-1",organizationId:"org_Test",amountCents:100,currency:"EUR",mode:"live" as const};
const base:RecoverySnapshot={orderState:"pending",phase:"provider_request_started",attachedPaymentId:null,expected,providerLookupComplete:true,candidates:[],providerStatus:"unknown",leaseValid:true};
const cases:[string,Partial<RecoverySnapshot>,string][]=[
 ["stale lease",{leaseValid:false},"skip"],
 ["terminal order",{orderState:"paid"},"skip"],
 ["reserved uncertain",{phase:"reserved"},"manual_review"],
 ["unmatched provider",{candidates:[]},"retry"],
 ["incomplete lookup",{providerLookupComplete:false},"manual_review"],
 ["unique verified candidate",{candidates:[candidate]},"attach_then_verify"],
 ["duplicate candidates",{candidates:[candidate,{...candidate,id:"tr_456"}]},"manual_review"],
 ["wrong seller",{candidates:[{...candidate,metadataSellerId:"other"}]},"manual_review"],
 ["attached paid",{phase:"payment_attached",attachedPaymentId:"tr_123",providerStatus:"paid"},"confirm_verified_paid"],
 ["attached failed",{phase:"payment_attached",attachedPaymentId:"tr_123",providerStatus:"failed"},"cancel_verified_terminal"],
 ["attached pending",{phase:"payment_attached",attachedPaymentId:"tr_123",providerStatus:"pending"},"verify_attached"],
 ["attached unknown",{phase:"payment_attached",attachedPaymentId:"tr_123",providerStatus:"unknown"},"retry"],
 ["missing attached ID",{phase:"payment_attached"},"manual_review"],
 ["conflicting phase",{phase:"provider_request_started",attachedPaymentId:"tr_123"},"manual_review"],
 ["manual review hold",{phase:"manual_review"},"manual_review"]
];
for(const [name,change,want] of cases){
 const got=planRecoveryStep({...base,...change}).action;
 if(got!==want)throw Error(name+": expected "+want+", got "+got);
}
console.log("PASS "+cases.length+" offline recovery worker cases; no provider calls");
