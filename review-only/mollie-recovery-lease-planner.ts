// Offline lease/claim planner for recovery tasks; does not read or mutate a database.
// Production requires an atomic SQL claim with row locks and durable attempt counters.
export type RecoveryJob={orderId:string;state:"due"|"claimed"|"manual_review"|"terminal";nextCheckMs:number;leaseUntilMs:number|null;attempts:number};
export type ClaimDecision={action:"claim"|"skip"|"manual_review";reason:string;leaseUntilMs?:number;nextAttempts?:number};
export function planRecoveryClaim(job:RecoveryJob,nowMs:number,leaseMs=60000,maxAttempts=8):ClaimDecision{
 if(!job.orderId||!Number.isFinite(nowMs)||!Number.isFinite(job.nextCheckMs)||!Number.isSafeInteger(job.attempts)||job.attempts<0||!Number.isFinite(leaseMs)||leaseMs<=0||!Number.isSafeInteger(maxAttempts)||maxAttempts<1)return {action:"manual_review",reason:"Invalid job data"};
 if(job.state==="terminal"||job.state==="manual_review")return {action:"skip",reason:"Not eligible"};
 if(job.nextCheckMs>nowMs)return {action:"skip",reason:"Not due"};
 if(job.state==="claimed"&&job.leaseUntilMs!==null&&job.leaseUntilMs>nowMs)return {action:"skip",reason:"Lease active"};
 if(job.attempts>=maxAttempts)return {action:"manual_review",reason:"Retry limit reached"};
 return {action:"claim",reason:"Eligible for atomic database claim",leaseUntilMs:nowMs+leaseMs,nextAttempts:job.attempts+1};
}
export function retryDelayMs(attempts:number):number{
 if(!Number.isSafeInteger(attempts)||attempts<0)return 3600000;
 return Math.min(3600000,30000*2**Math.min(attempts,7));
}
