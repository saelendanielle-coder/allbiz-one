import {mapMollieBuyerStatus, type StoreOrderStatus} from "./mollie-buyer-status-policy.ts";

// Review-only response contract between a verified buyer-token endpoint and UI.
// Never accept a status from a URL parameter or untrusted browser input.
export type VerifiedBuyerOrder = {
  status: StoreOrderStatus;
  tokenVerified: boolean;
};
export type BuyerResponse = {
  statusCode: 200 | 202 | 403 | 409 | 503;
  body: {paid: boolean; status: string; message: string; downloadsAllowed: boolean};
};
export function buildBuyerResponse(order: VerifiedBuyerOrder | null): BuyerResponse {
  if (!order || !order.tokenVerified) {
    return {statusCode:403,body:{paid:false,status:"unauthorized",message:"Ongeldige bestelreferentie.",downloadsAllowed:false}};
  }
  const mapped=mapMollieBuyerStatus(order.status);
  return {statusCode:mapped.httpStatus,body:{paid:mapped.state==="paid",status:mapped.state,message:mapped.message,downloadsAllowed:mapped.allowDownloads}};
}
export function buyerPageMessage(response: BuyerResponse): string {
  // The UI must not treat 409 terminal states as a transient network failure.
  return response.body.message;
}
