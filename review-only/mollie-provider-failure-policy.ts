// Review-only: classify ambiguous provider failures without releasing stock.
// No Mollie API, database access, payment or inventory mutations.
export type ProviderAttemptResult =
 | {kind:"not_started"}
 | {kind:"http_response";status:number;validPaymentId:boolean}
 | {kind:"network_timeout"|"network_error"|"malformed_response"|"attachment_failed"|"unknown"};
export type ProviderFailurePolicy = {
 action:"cancel_only_if_durable_not_started"|"hold_and_reconcile";
 canRestoreStock:boolean;
 requireRecovery:boolean;
 message:string;
};
export function classifyProviderFailure(result:ProviderAttemptResult):ProviderFailurePolicy {
 const message="De betaling wordt gecontroleerd. Betaal niet opnieuw voordat de status bekend is.";
 if(result.kind==="not_started")return {
   action:"cancel_only_if_durable_not_started",canRestoreStock:true,
   requireRecovery:false,message
 };
 // Even an HTTP 4xx must be verified against the idempotency key and
 // durable request phase before deciding whether stock can be released.
 return {action:"hold_and_reconcile",canRestoreStock:false,requireRecovery:true,message};
}
