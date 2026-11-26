// Review-only transition gate. This models DB outcomes but does not write to DB.
// Production must enforce these rules atomically inside SQL transactions.
export type OrderState="pending"|"paid"|"fulfilled"|"failed"|"cancelled"|"expired";
export type VerifiedProviderState="paid"|"failed"|"canceled"|"expired"|"open"|"pending"|"authorized"|"unknown";
export type TransitionDecision={action:"confirm"|"cancel"|"no_op"|"hold"|"manual_review";releaseStock:boolean;reason:string};
export function decidePaymentTransition(order:OrderState,provider:VerifiedProviderState,identityVerified:boolean):TransitionDecision{
 if(!identityVerified)return {action:"manual_review",releaseStock:false,reason:"Unverified payment identity"};
 if(order==="paid"||order==="fulfilled")return {action:provider==="paid"?"no_op":"manual_review",releaseStock:false,reason:"Paid order must never be reversed by an automatic worker"};
 if(order==="failed"||order==="cancelled"||order==="expired")return {action:provider==="paid"?"manual_review":"no_op",releaseStock:false,reason:"Terminal order cannot be transitioned twice"};
 if(provider==="paid")return {action:"confirm",releaseStock:false,reason:"Verified paid payment"};
 if(provider==="failed"||provider==="canceled"||provider==="expired")return {action:"cancel",releaseStock:true,reason:"Verified terminal unpaid payment; DB must restore stock at most once"};
 return {action:"hold",releaseStock:false,reason:"Provider payment is not terminal"};
}
