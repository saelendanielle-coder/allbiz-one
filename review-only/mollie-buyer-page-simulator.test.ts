import {buyerView} from "./mollie-buyer-page-simulator.ts";
const scenarios=[
 [200,{paid:true,status:"paid"},"paid",true,false],
 [202,{paid:false,status:"processing"},"processing",false,true],
 [409,{paid:false,status:"not_paid"},"terminal",false,false],
 [403,{paid:false,status:"unauthorized"},"unauthorized",false,false],
 [503,{paid:false,status:"unavailable"},"uncertain",false,true],
 [500,null,"uncertain",false,true],
 [200,{paid:false,status:"paid"},"uncertain",false,true],
 [200,{paid:true,status:"processing"},"uncertain",false,true],
 [202,{paid:true,status:"paid"},"uncertain",false,true],
 [409,{paid:true,status:"not_paid"},"uncertain",false,true],
 [404,null,"uncertain",false,true],
 [0,null,"uncertain",false,true]
] as const;
let passed=0;
for(const [code,body,kind,downloads,retry] of scenarios){
 const result=buyerView(code,body);
 if(result.kind!==kind||result.showDownloads!==downloads||result.retry!==retry)throw Error("Unexpected buyer page view: "+JSON.stringify([code,body]));
 if(!result.message)throw Error("Missing message");
 console.log("PASS",code,kind);passed++;
}
const malicious=buyerView(409,{paid:false,status:"not_paid",message:"<img src=x onerror=alert(1)>"});
if(malicious.showDownloads||malicious.retry)throw Error("Unexpected terminal action");
console.log("PASS untrusted message remains plain data");passed++;
const oversized=buyerView(409,{paid:false,status:"not_paid",message:"x".repeat(500)});
if(oversized.message.length>300)throw Error("Unbounded message");passed++;
console.log(`${passed} simulated buyer-page scenarios passed`);
