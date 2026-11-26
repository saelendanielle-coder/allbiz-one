import { FakeStore } from "./mollie-inventory-simulator.ts";
import type { ReconcileInput } from "./mollie-reconciliation-plan.ts";
function equal(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) throw new Error(`${name}: ${actual} !== ${expected}`);
}
const input = (patch: Partial<ReconcileInput> = {}): ReconcileInput => ({
  orderPending:true, attachedPaymentId:null, providerLookup:"one",
  verifiedCandidate:true, candidateStatus:"paid", ...patch,
});
let count=0;
function test(name:string, run:()=>void) { run(); count++; console.log("PASS",name); }

test("reserve decrements stock",()=>{const s=new FakeStore(5);s.reserve(2);equal(s.stock,3,"stock");});
test("definite pre-provider failure restores stock",()=>{const s=new FakeStore(5);s.reserve(2);s.fail("reserved_before_provider_request");equal(s.stock,5,"stock");equal(s.order?.status,"cancelled","status");});
test("provider timeout holds inventory",()=>{const s=new FakeStore(5);s.reserve(2);s.fail("provider_request_started");equal(s.stock,3,"stock");equal(s.order?.status,"pending","status");});
test("created payment attach failure holds inventory",()=>{const s=new FakeStore(5);s.reserve(2);s.fail("provider_payment_created");equal(s.stock,3,"stock");});
test("paid recovery attaches and confirms without releasing stock",()=>{const s=new FakeStore(5);s.reserve(2);equal(s.reconcile(input(),"tr_123"),"attach_then_confirm","action");equal(s.order?.status,"paid","status");equal(s.stock,3,"stock");});
test("failed payment recovery restores stock once",()=>{const s=new FakeStore(5);s.reserve(2);equal(s.reconcile(input({candidateStatus:"failed"}),"tr_123"),"attach_then_cancel","action");equal(s.stock,5,"stock");equal(s.cancel(),false,"duplicate cancel");equal(s.stock,5,"stock");});
test("unverified candidate does not change inventory",()=>{const s=new FakeStore(5);s.reserve(2);s.reconcile(input({verifiedCandidate:false}),"tr_123");equal(s.stock,3,"stock");equal(s.order?.paymentId,null,"payment");});
test("multiple matches do not change inventory",()=>{const s=new FakeStore(5);s.reserve(2);s.reconcile(input({providerLookup:"multiple"}),"tr_123");equal(s.stock,3,"stock");equal(s.order?.paymentId,null,"payment");});
test("zero matches hold inventory",()=>{const s=new FakeStore(5);s.reserve(2);s.reconcile(input({providerLookup:"zero"}),"tr_123");equal(s.stock,3,"stock");});
test("pending provider payment attaches but stays pending",()=>{const s=new FakeStore(5);s.reserve(2);s.reconcile(input({candidateStatus:"pending"}),"tr_123");equal(s.order?.status,"pending","status");equal(s.stock,3,"stock");});
test("replayed paid confirmation does not change stock",()=>{const s=new FakeStore(5);s.reserve(2);s.reconcile(input(),"tr_123");equal(s.confirm("tr_123"),false,"replay");equal(s.stock,3,"stock");});
test("cannot reserve more stock than available",()=>{const s=new FakeStore(1);let rejected=false;try{s.reserve(2);}catch{rejected=true;}equal(rejected,true,"reject");equal(s.stock,1,"stock");});
console.log(`${count} isolated stock recovery simulations passed`);
