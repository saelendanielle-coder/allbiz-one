// Pure fail-closed checkout catch decision. No provider, database or inventory writes.
export type CheckoutPhase="before_reservation"|"reserved_no_provider_call"|"provider_request_started"|"provider_payment_received"|"payment_attached";
export type CheckoutCatchDecision={
  action:"no_order"|"cancel_reservation"|"hold_for_reconciliation";
  restoreStockAutomatically:boolean;
  needsDurableRecovery:boolean;
  customerMessage:string;
};
export function decideCheckoutCatch(phase:CheckoutPhase,hasOrder:boolean):CheckoutCatchDecision{
  const customerMessage="De betaling wordt gecontroleerd. Betaal niet opnieuw voordat de status bekend is.";
  if(!hasOrder)return {action:"no_order",restoreStockAutomatically:false,needsDurableRecovery:false,customerMessage};
  if(phase==="reserved_no_provider_call")return {action:"cancel_reservation",restoreStockAutomatically:true,needsDurableRecovery:false,customerMessage};
  // An order with a provider request (or inconsistent phase) must never be
  // released by a generic catch. Persist a recovery task before production use.
  return {action:"hold_for_reconciliation",restoreStockAutomatically:false,needsDurableRecovery:true,customerMessage};
}
