// REVIEW-ONLY STAGED COPY — DO NOT DEPLOY.\n// Snapshot of live allbiz-store-mollie-checkout, with fail-closed exception handling.\n// Requires durable payment attempt journal, reconciliation, and tests before deployment.\n
import {createClient} from "npm:@supabase/supabase-js@2.49.8";
const base=Deno.env.get("SUPABASE_URL")||"",role=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const client=Deno.env.get("MOLLIE_CLIENT_ID")||"",secret=Deno.env.get("MOLLIE_CLIENT_SECRET")||"";
const origin="https://saelendanielle-coder.github.io";
const cors={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"content-type,authorization,apikey","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const respond=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:cors});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const db=createClient(base,role,{auth:{persistSession:false}});
const b64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const cryptoKey=async()=>{const s=Deno.env.get("MOLLIE_TOKEN_ENCRYPTION_KEY")||"";if(!/^[A-Za-z0-9_-]{43}$/.test(s))throw Error("Encryption unavailable");const raw=Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"="),x=>x.charCodeAt(0));return crypto.subtle.importKey("raw",raw,"AES-GCM",false,["encrypt","decrypt"])};
const decode=async(s:string,k:CryptoKey)=>{if(!s?.startsWith("enc:v1:"))throw Error("Invalid token");const v=s.slice(7);const raw=Uint8Array.from(atob(v.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-v.length%4)%4)),x=>x.charCodeAt(0));return new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.slice(0,12)},k,raw.slice(12)))};
const encode=async(s:string,k:CryptoKey)=>{const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},k,new TextEncoder().encode(s)));return "enc:v1:"+b64(new Uint8Array([...iv,...cipher]))};
async function merchantToken(row:any){
 const k=await cryptoKey();
 if(Date.parse(row.token_expires_at)>Date.now()+120000)return decode(row.access_token_ciphertext,k);
 const refresh=await decode(row.refresh_token_ciphertext,k);
 const result=await fetch("https://api.mollie.com/oauth2/tokens",{method:"POST",headers:{Authorization:"Basic "+btoa(client+":"+secret),"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"},body:new URLSearchParams({grant_type:"refresh_token",refresh_token:refresh})});
 if(!result.ok)throw Error("Mollie connection expired");
 const t=await result.json();if(typeof t.access_token!=="string"||typeof t.refresh_token!=="string"||!Number.isFinite(t.expires_in))throw Error("Invalid token response");
 const expiry=new Date(Date.now()+Math.max(60,Math.min(86400,Number(t.expires_in)))*1000).toISOString();
 const {error}=await db.from("allbiz_mollie_merchant_connections").update({access_token_ciphertext:await encode(t.access_token,k),refresh_token_ciphertext:await encode(t.refresh_token,k),token_expires_at:expiry,updated_at:new Date().toISOString()}).eq("user_id",row.user_id).eq("mollie_organization_id",row.mollie_organization_id).eq("refresh_token_ciphertext",row.refresh_token_ciphertext);
 if(error)throw Error("Could not save refreshed token");
 return t.access_token;
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return respond({error:"Method not allowed"},405);
 if(req.headers.get("origin")!==origin)return respond({error:"Invalid origin"},403);
 if(!base||!role||!client||!secret)return respond({error:"Service unavailable"},503);
 let b:any;try{b=await req.json()}catch{return respond({error:"Invalid body"},400)}
 if(b.action==="status"){
  const [linked,products]=await Promise.all([db.from("allbiz_mollie_merchant_connections").select("user_id",{count:"exact",head:true}).eq("connection_status","connected"),db.from("allbiz_catalog_products").select("id",{count:"exact",head:true}).eq("is_listed",true)]);
  if(linked.error||products.error)return respond({checkout_enabled:false,error:"Status unavailable"},503);
  return respond({provider:"mollie",checkout_enabled:false,has_connected_seller:(linked.count||0)>0,has_listed_products:(products.count||0)>0,reason:"Checkout is staged pending verification"});
 }
 if(b.action!=="checkout")return respond({error:"Unknown action"},400);

 const ownerTest=b.action==="checkout"&&b.seller==="18049cac-e05f-41fe-a688-e675b8591716"&&b.product==="5c413a12-a784-4431-9cce-85a4f6ece5d1"&&b.quantity===1;
 if(ownerTest){
  const bearer=req.headers.get("authorization")||"";
  if(!bearer.startsWith("Bearer "))return respond({error:"Log in als eigenaar om de privétest te starten."},401);
  const {data:identity,error:identityError}=await db.auth.getUser(bearer.slice(7));
  if(identityError||identity.user?.id!==b.seller||identity.user.app_metadata?.allbiz_role!=="owner")return respond({error:"Alleen de eigenaar kan deze €1-test starten."},403);
  const {data:completed,error:completedError}=await db.from("allbiz_store_orders").select("id").eq("seller_id",b.seller).eq("amount_total_cents",100).eq("payment_provider","mollie").in("status",["paid","fulfilled"]).limit(1);
  if(completedError)return respond({error:"De teststatus kon niet gecontroleerd worden."},503);
  if(completed?.length)return respond({error:"De €1-betaaltest is al geslaagd. Een nieuwe betaling is niet nodig."},409);
 }else if(Deno.env.get("MOLLIE_STORE_CHECKOUT_ENABLED")!=="true"){
  const platformSeller=b.seller==="18049cac-e05f-41fe-a688-e675b8591716"&&b.product!=="5c413a12-a784-4431-9cce-85a4f6ece5d1"&&b.quantity===1;
  if(!platformSeller)return respond({error:"Mollie-webshopbetalingen worden nog veilig getest. Er is niets afgeschreven."},503);
  const {data:completed,error:completedError}=await db.from("allbiz_store_orders").select("id").eq("seller_id",b.seller).eq("amount_total_cents",100).eq("payment_provider","mollie").in("status",["paid","fulfilled"]).limit(1);
  if(completedError||!completed?.length)return respond({error:"De webshoptest is nog niet bevestigd."},503);
 }
 const seller=String(b.seller||""),product=String(b.product||""),quantity=Number(b.quantity);
 if(!uuid.test(seller)||!uuid.test(product)||!Number.isInteger(quantity)||quantity<1||quantity>10)return respond({error:"Ongeldige bestelling"},400);
 let order="";
 try{
  const {data:connection,error:ce}=await db.from("allbiz_mollie_merchant_connections").select("user_id,mollie_organization_id,connection_status,access_token_ciphertext,refresh_token_ciphertext,token_expires_at").eq("user_id",seller).eq("connection_status","connected").maybeSingle();
  if(ce||!connection)return respond({error:"Verkoper heeft Mollie nog niet gekoppeld."},409);
  const token=await merchantToken(connection);
  const {data:reservation,error:re}=await db.rpc("allbiz_reserve_mollie_store_checkout",{p_seller:seller,p_product:product,p_quantity:quantity,p_organization:connection.mollie_organization_id});
  if(re||!reservation?.order_id)return respond({error:"Product niet beschikbaar of verkopersgegevens onvolledig."},409);
  order=reservation.order_id;
  const cents=reservation.amount_cents;
  if(!Number.isSafeInteger(cents)||cents<1||cents>100000000)throw Error("Invalid amount");
  const amount=(cents/100).toFixed(2);
  const returnToken=b64(crypto.getRandomValues(new Uint8Array(32)));
  const hashBytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(returnToken)));
  const returnHash=Array.from(hashBytes).map(x=>x.toString(16).padStart(2,"0")).join("");
  const profilesResponse=await fetch("https://api.mollie.com/v2/profiles?limit=100",{headers:{Authorization:"Bearer "+token,Accept:"application/json"}});
  if(!profilesResponse.ok)throw Error("Mollie website profiles unavailable");
  const profiles=await profilesResponse.json();
  const websiteProfiles=Array.isArray(profiles?._embedded?.profiles)?profiles._embedded.profiles:[];
  const matchedProfile=websiteProfiles.find((profile:any)=>{
   try{return new URL(String(profile.website||"")).hostname==="saelendanielle-coder.github.io"}catch{return false}
  });
  if(!matchedProfile||!/^pfl_[A-Za-z0-9]+$/.test(String(matchedProfile.id||"")))throw Error("Albiz One website profile not accessible");
  const payment={
   profileId:matchedProfile.id,
   amount:{currency:"EUR",value:amount},
   description:String(reservation.name||"AllBiz One bestelling").slice(0,200),
   redirectUrl:origin+"/allbiz-one/bestelling.html?order="+encodeURIComponent(order)+"&provider=mollie&token="+encodeURIComponent(returnToken),
   webhookUrl:base+"/functions/v1/allbiz-store-mollie-webhook",
   metadata:{allbiz_order_id:order,allbiz_seller_id:seller},
   locale:"nl_BE"
  };
  const created=await fetch("https://api.mollie.com/v2/payments",{method:"POST",headers:{Authorization:"Bearer "+token,Accept:"application/json","Content-Type":"application/json","Idempotency-Key":"allbiz-mollie-store-"+order},body:JSON.stringify(payment)});
  if(!created.ok){const failure=await created.json().catch(()=>({}));console.error("Mollie payment API rejected",created.status,String(failure?.title||""),String(failure?.detail||"").slice(0,240));throw Error("Mollie payment creation failed");}
  const p=await created.json();
  const checkout=p?._links?.checkout?.href;
  if(typeof p.id!=="string"||!/^tr_[A-Za-z0-9]+$/.test(p.id)||typeof checkout!=="string")throw Error("Invalid Mollie response");
  const u=new URL(checkout);
  if(u.protocol!=="https:"||!["www.mollie.com","checkout.mollie.com","my.mollie.com"].includes(u.hostname))throw Error("Unexpected Mollie checkout URL");
  const {data:attached,error:ae}=await db.rpc("allbiz_attach_mollie_store_payment",{p_order:order,p_payment:p.id,p_return_hash:returnHash});
  if(ae||!attached)throw Error("Mollie payment exists but database attachment failed");
  return respond({checkout_url:checkout,order_id:order,provider:"mollie"});
 }catch(e){
  // Fail closed: a Mollie payment may exist even if its ID was not attached to the order.\n  // Never release reserved stock here. Reconcile payment status before cancellation.\n  // TODO: durable payment-attempt journal and verified cancellation/reconciliation workflow.\n  if(order)console.error("Mollie checkout needs reconciliation; reserved order:",order);
  console.error("Mollie store checkout error",e instanceof Error?e.name:"error");
  return respond({error:"Mollie-betaling kon niet veilig worden gestart. Er is niets bevestigd."},503);
 }

});
