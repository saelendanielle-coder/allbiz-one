// Review-only expiry policy. Time alone never proves that a Mollie payment failed.
export type ExpiryInput={
 nowMs:number;expiresAtMs:number;orderStatus:"pending"|"paid"|"fulfilled"|"failed"|"cancelled"|"expired";
 providerRequestStarted:boolean;recoveryHold:boolean;
 verifiedProviderStatus:"paid"|"failed"|"canceled"|"expired"|"open"|"pending"|"authorized"|"unknown"|null;
};
export type ExpiryDecision="not_due"|"already_terminal"|"hold_for_reconciliation"|"confirm_paid"|"cancel_verified_terminal"|"cancel_before_provider";
export function decideExpiry(input:ExpiryInput):ExpiryDecision{
 if(["paid","fulfilled","failed","cancelled","expired"].includes(input.orderStatus))return "already_terminal";
 if(!Number.isFinite(input.nowMs)||!Number.isFinite(input.expiresAtMs))return "hold_for_reconciliation";
 if(input.verifiedProviderStatus==="paid")return "confirm_paid";
 if(input.recoveryHold)return "hold_for_reconciliation";
 if(input.nowMs<input.expiresAtMs)return "not_due";
 if(["failed","canceled","expired"].includes(input.verifiedProviderStatus||""))return "cancel_verified_terminal";
 if(!input.providerRequestStarted&&input.verifiedProviderStatus===null)return "cancel_before_provider";
 return "hold_for_reconciliation";
}
