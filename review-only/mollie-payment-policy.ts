// Pure decision logic for Mollie checkout reconciliation. No network or database access.
export type MollieDecision="confirm_paid"|"release_reservation"|"hold_reservation";
export function decideMollieOrderAction(input:{
  orderStatus:string;paymentIdMatches:boolean;metadataMatches:boolean;
  amountMatches:boolean;currencyMatches:boolean;mollieStatus:string|null;
}):MollieDecision{
  if(input.orderStatus!=="pending"||!input.paymentIdMatches||!input.metadataMatches||
     !input.amountMatches||!input.currencyMatches)return "hold_reservation";
  if(input.mollieStatus==="paid")return "confirm_paid";
  if(["failed","canceled","expired"].includes(input.mollieStatus||""))return "release_reservation";
  return "hold_reservation";
}
