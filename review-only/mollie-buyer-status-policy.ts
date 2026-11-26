// Review-only buyer-facing status mapping. No database or payment calls.
// Only trusted server-side order status may be passed here after return-token validation.
export type StoreOrderStatus = "pending" | "paid" | "fulfilled" | "failed" | "cancelled" | "expired" | "unknown";
export type BuyerStatus = {httpStatus: 200 | 202 | 409 | 503; state: "paid" | "processing" | "not_paid" | "unavailable"; message: string; allowDownloads: boolean};
export function mapMollieBuyerStatus(status: StoreOrderStatus): BuyerStatus {
  switch(status){
    case "paid":
    case "fulfilled":
      return {httpStatus:200,state:"paid",message:"Betaling bevestigd. Je bestelling is geregistreerd.",allowDownloads:true};
    case "pending":
      return {httpStatus:202,state:"processing",message:"Je betaling wordt gecontroleerd. Betaal niet opnieuw.",allowDownloads:false};
    case "failed":
      return {httpStatus:409,state:"not_paid",message:"De betaling is mislukt. Controleer je betaaloverzicht en neem contact op met de verkoper voordat je opnieuw betaalt.",allowDownloads:false};
    case "cancelled":
      return {httpStatus:409,state:"not_paid",message:"Deze bestelling is geannuleerd. Controleer je betaaloverzicht en neem contact op met de verkoper.",allowDownloads:false};
    case "expired":
      return {httpStatus:409,state:"not_paid",message:"Deze bestelling is verlopen. Controleer je betaaloverzicht en neem contact op met de verkoper.",allowDownloads:false};
    default:
      return {httpStatus:503,state:"unavailable",message:"De betaalstatus is tijdelijk niet beschikbaar. Betaal niet opnieuw en probeer later te controleren.",allowDownloads:false};
  }
}
