// REVIEW ONLY — not deployed. Manual server-side reconciliation for known Mollie payment IDs.
// Must only be invoked by a trusted service-role process after authentication/authorization.
// Never expose service-role keys or merchant tokens to the browser.
import {createClient} from "npm:@supabase/supabase-js@2.49.8";

type Payment = {id:string;status:string;amount?:{currency:string;value:string};metadata?:{allbiz_order_id?:string;allbiz_seller_id?:string};profileId?:string;organizationId?:string};
type Order = {id:string;seller_id:string;status:string;payment_provider:string;mollie_payment_id:string|null;mollie_organization_id:string|null;amount_total_cents:number;currency:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const paymentId=/^tr_[A-Za-z0-9]{1,100}$/;

export async function reconcileKnownPayment(args:{
  orderId:string;
  paymentId:string;
  // Server-side verified OAuth token for the order's connected Mollie merchant.
  merchantAccessToken:string;
  // Admin client must be instantiated only in a trusted server environment.
  db:ReturnType<typeof createClient>;
}):Promise<"paid"|"cancelled"|"pending"|"already_final"|"manual_review">{
  const {orderId,paymentId,merchantAccessToken,db}=args;
  if(!uuid.test(orderId)||!paymentId.test(paymentId)||!merchantAccessToken)throw Error("Invalid reconciliation input");
  const {data:o,error}=await db.from("allbiz_store_orders")
    .select("id,seller_id,status,payment_provider,mollie_payment_id,mollie_organization_id,amount_total_cents,currency")
    .eq("id",orderId).maybeSingle();
  if(error||!o)throw Error("Order unavailable");
  const order=o as Order;
  if(order.payment_provider!=="mollie"||order.mollie_payment_id!==paymentId||!order.mollie_organization_id)
    return "manual_review";
  if(order.status!=="pending")return "already_final";
  const response=await fetch("https://api.mollie.com/v2/payments/"+encodeURIComponent(paymentId),{
    headers:{Authorization:"Bearer "+merchantAccessToken,Accept:"application/json"}
  });
  if(!response.ok)return "manual_review";
  const p=await response.json() as Payment;
  const amount=p.amount?.value;
  const cents=typeof amount==="string"&&/^\d+\.\d{2}$/.test(amount)?Math.round(Number(amount)*100):NaN;
  if(p.id!==paymentId||p.metadata?.allbiz_order_id!==order.id||
    p.metadata?.allbiz_seller_id!==order.seller_id||p.organizationId!==order.mollie_organization_id||
    p.amount?.currency!=="EUR"||
    cents!==order.amount_total_cents||order.currency.toUpperCase()!=="EUR")return "manual_review";
  if(p.status==="paid"){
    const {data:ok,error:err}=await db.rpc("allbiz_confirm_mollie_store_payment",{
      p_order:order.id,p_payment:paymentId,p_organization:order.mollie_organization_id,
      p_amount_cents:cents,p_currency:"eur",p_buyer_email:""
    });
    return !err&&ok===true?"paid":"manual_review";
  }
  if(["failed","canceled","expired"].includes(p.status)){
    const reason=p.status==="failed"?"failed":p.status==="expired"?"expired":"cancelled";
    const {data:ok,error:err}=await db.rpc("allbiz_cancel_mollie_store_checkout",{
      p_order:order.id,p_payment:paymentId,p_reason:reason
    });
    return !err&&ok===true?"cancelled":"manual_review";
  }
  // open, pending, authorized, unknown: never release stock.
  return "pending";
}

// Important limitation: this helper CANNOT recover an orphan payment whose ID was never
// saved to the database. A durable attempt journal and Mollie reconciliation by metadata
// must be implemented and verified before this can be deployed.
