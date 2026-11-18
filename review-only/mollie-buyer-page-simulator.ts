// Pure review-only UI reducer for simulated HTTP responses.
// The real buyer page is intentionally not changed.
export type BuyerView = {kind:"paid"|"processing"|"terminal"|"uncertain"|"unauthorized"; message:string; retry:boolean; showDownloads:boolean};
type Payload={paid?:boolean;status?:string;message?:string};
const fallback="De betaalstatus is tijdelijk niet beschikbaar. Betaal niet opnieuw en controleer later opnieuw.";
export function buyerView(httpStatus:number, body:Payload|null):BuyerView {
 const safeMessage=(typeof body?.message==="string"&&body.message.length<=300)?body.message:"";
 if(httpStatus===403)return {kind:"unauthorized",message:"Ongeldige bestelreferentie.",retry:false,showDownloads:false};
 if(httpStatus===200&&body?.paid===true&&body?.status==="paid")return {kind:"paid",message:safeMessage||"Betaling bevestigd.",retry:false,showDownloads:true};
 if(httpStatus===202&&body?.paid===false&&body?.status==="processing")return {kind:"processing",message:safeMessage||"Betaling wordt gecontroleerd. Betaal niet opnieuw.",retry:true,showDownloads:false};
 if(httpStatus===409&&body?.paid===false&&body?.status==="not_paid")return {kind:"terminal",message:safeMessage||"De bestelling is niet betaald. Neem contact op met de verkoper.",retry:false,showDownloads:false};
 return {kind:"uncertain",message:fallback,retry:true,showDownloads:false};
}
