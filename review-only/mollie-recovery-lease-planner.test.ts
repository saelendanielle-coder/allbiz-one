import {planRecoveryClaim,retryDelayMs,type RecoveryJob} from "./mollie-recovery-lease-planner.ts";
const base:RecoveryJob={orderId:"order-1",state:"due",nextCheckMs:100,leaseUntilMs:null,attempts:0};
const cases:[string,Partial<RecoveryJob>,number,string][]=[
 ["eligible",{},200,"claim"],["not due",{nextCheckMs:300},200,"skip"],
 ["active lease",{state:"claimed",leaseUntilMs:300},200,"skip"],
 ["expired lease",{state:"claimed",leaseUntilMs:199},200,"claim"],
 ["terminal",{state:"terminal"},200,"skip"],
 ["manual review",{state:"manual_review"},200,"skip"],
 ["retry limit",{attempts:8},200,"manual_review"],
 ["below retry limit",{attempts:7},200,"claim"],
 ["missing order",{orderId:""},200,"manual_review"],
 ["invalid attempt",{attempts:-1},200,"manual_review"],
 ["invalid clock",{},NaN,"manual_review"],
 ["due at exact time",{nextCheckMs:200},200,"claim"],
 ["lease at exact time",{state:"claimed",leaseUntilMs:200},200,"claim"],
 ["invalid due",{nextCheckMs:NaN},200,"manual_review"],
 ["terminal expired lease",{state:"terminal",leaseUntilMs:0},200,"skip"]
];
let count=0;
for(const [name,changes,now,expected] of cases){
 const result=planRecoveryClaim({...base,...changes},now);
 if(result.action!==expected)throw Error(name+" expected "+expected+" got "+result.action);
 if(result.action==="claim"&&(!result.leaseUntilMs||!result.nextAttempts))throw Error("Incomplete claim");
 console.log("PASS",name);count++;
}
for(const [attempt,expected] of [[0,30000],[1,60000],[2,120000],[7,3600000],[-1,3600000]]){
 if(retryDelayMs(attempt)!==expected)throw Error("Backoff attempt "+attempt);
 console.log("PASS retry delay",attempt);count++;
}
console.log(`${count} lease and retry scenarios passed`);
