import { decideRecovery, type RecoveryCandidate } from "./mollie-recovery-ownership-policy.ts";
const valid: RecoveryCandidate = {
 paymentId:"tr_test",paymentStatus:"paid",orderIdMatches:true,merchantIdMatches:true,
 mollieOrganizationMatches:true,amountMatches:true,currencyMatches:true
};
const cases: Array<[string,RecoveryCandidate[],string]> = [
 ["valid unique candidate",[valid],"link_verified_payment"],
 ["no candidate",[],"manual_review"],
 ["two candidates",[valid,valid],"manual_review"],
 ["missing payment id",[{...valid,paymentId:null}],"manual_review"],
 ["wrong order",[{...valid,orderIdMatches:false}],"manual_review"],
 ["wrong merchant",[{...valid,merchantIdMatches:false}],"manual_review"],
 ["wrong organization",[{...valid,mollieOrganizationMatches:false}],"manual_review"],
 ["wrong amount",[{...valid,amountMatches:false}],"manual_review"],
 ["wrong currency",[{...valid,currencyMatches:false}],"manual_review"],
 ["unknown status",[{...valid,paymentStatus:"unexpected"}],"manual_review"],
 ["missing status",[{...valid,paymentStatus:null}],"manual_review"],
];
for (const [name,candidates,expected] of cases) {
 const actual=decideRecovery(candidates);
 if(actual!==expected) throw new Error(`${name}: expected ${expected}, got ${actual}`);
 console.log(`PASS ${name}`);
}
console.log(`${cases.length} recovery ownership checks passed`);
