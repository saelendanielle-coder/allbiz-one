import { decideWebhookAction, type OrderState, type ProviderState, type WebhookAction } from "./mollie-webhook-transition-policy.ts";
const cases: Array<[string,OrderState,ProviderState,boolean,WebhookAction]> = [
  ["paid pending","pending","paid",true,"confirm"],
  ["failed pending","pending","failed",true,"cancel"],
  ["canceled pending","pending","canceled",true,"cancel"],
  ["expired pending","pending","expired",true,"cancel"],
  ["open pending","pending","open",true,"wait"],
  ["pending pending","pending","pending",true,"wait"],
  ["authorized pending","pending","authorized",true,"wait"],
  ["unknown pending","pending","unknown",true,"manual_review"],
  ["wrong payment paid","pending","paid",false,"manual_review"],
  ["wrong payment failed","pending","failed",false,"manual_review"],
  ["replayed paid","paid","paid",true,"ignore"],
  ["paid then canceled event","paid","canceled",true,"ignore"],
  ["cancelled then paid event","cancelled","paid",true,"ignore"],
  ["failed then paid event","failed","paid",true,"ignore"],
  ["replayed canceled","cancelled","canceled",true,"ignore"],
  ["replayed failed","failed","failed",true,"ignore"],
  ["paid order unknown","paid","unknown",true,"ignore"],
  ["cancelled order pending","cancelled","pending",true,"ignore"],
  ["failed order expired","failed","expired",true,"ignore"],
  ["paid order wrong id","paid","paid",false,"manual_review"],
];
for(const [name,order,provider,matches,want] of cases){
 const actual=decideWebhookAction(order,provider,matches);
 if(actual!==want)throw new Error(`${name}: ${actual} != ${want}`);
 console.log("PASS",name);
}
console.log(`${cases.length} webhook transition scenarios passed`);
