/* AllBiz One: private merchant catalog. Payment processing stays disabled until certified. */
(() => {
'use strict';
function init(){
const host=document.getElementById('shop');
if(!host||document.getElementById('allbizRealCatalog'))return;
const panel=document.createElement('section');panel.id='allbizRealCatalog';panel.className='card';panel.style.margin='20px 0';
panel.innerHTML='<h2>📦 Mijn online productcatalogus</h2><p class="muted">Producten worden beveiligd in jouw account opgeslagen. Je kunt ze voorbereiden, maar klanten kunnen nog niet echt afrekenen. De betaalfunctie wordt pas geopend na verificatie van Stripe Connect en de volledige bestelstroom.</p>'+
'<form id="abcForm"><label for="abcName">Productnaam</label><input id="abcName" minlength="2" maxlength="160" required>'+
'<label for="abcDesc">Beschrijving</label><textarea id="abcDesc" maxlength="2000"></textarea>'+
'<label for="abcKind">Producttype</label><select id="abcKind"><option value="physical">Fysiek product</option><option value="digital">Digitaal product</option></select>'+
'<label for="abcPrice">Prijs (€)</label><input id="abcPrice" type="number" min=".01" max="100000" step=".01" required>'+
'<label for="abcStock">Voorraad (leeg = niet bijgehouden)</label><input id="abcStock" type="number" min="0" max="1000000" step="1">'+
'<label for="abcFile">Pad van privé digitaal bestand (optioneel)</label><select id="abcFile"><option value="">Geen bestand gekoppeld</option></select>'+
'<label><input id="abcListed" type="checkbox"> Klaarzetten als zichtbaar product zodra de verkoopfunctie officieel beschikbaar is</label>'+
'<button type="submit">💾 Product privé opslaan</button> <button type="button" id="abcRefresh" class="secondary">↻ Producten ophalen</button></form>'+
'<p id="abcStatus" role="status" class="muted">Log in om producten te beheren.</p><div id="abcItems"></div>'+
'<p><button type="button" class="secondary" id="abcStoreLink">🔗 Kopieer mijn winkellink</button></p>'+
'<h3>🧾 Mijn echte bestellingen</h3><p class="muted">Alleen bevestigde serverbestellingen komen hier. Demo-omzet wordt niet meegeteld.</p><button type="button" id="abcOrdersRefresh" class="secondary">↻ Bestellingen controleren</button><p id="abcOrdersStatus" role="status"></p><div id="abcOrders"></div>';
host.append(panel);
const $=id=>panel.querySelector('#'+id);
async function account(){
 const client=window.allbizClient;
 if(!client)throw Error('Accountverbinding wordt nog geladen.');
 const {data,error}=await client.auth.getUser();
 if(error||!data?.user)throw Error('Log in bij Mijn account.');
 return {client,user:data.user};
}
const eur=c=>(c/100).toLocaleString('nl-BE',{style:'currency',currency:'EUR'});
async function refresh(){
 $('abcStatus').textContent='Catalogus ophalen…';$('abcItems').replaceChildren();
 try{
 const {client,user}=await account();
 const [products,files]=await Promise.all([
  client.from('allbiz_catalog_products').select('id,name,description,kind,price_cents,stock,digital_file_path,is_listed,created_at').eq('seller_id',user.id).order('created_at',{ascending:false}).limit(100),
  client.storage.from('allbiz-digital-products').list(user.id,{limit:100})
 ]);
 if(products.error)throw products.error;
 const select=$('abcFile');select.replaceChildren(new Option('Geen bestand gekoppeld',''));
 if(!files.error)for(const file of files.data||[]){if(!file.id)continue;const path=user.id+'/'+file.name;select.add(new Option(file.name,path));}
 const rows=products.data||[];
 $('abcStatus').textContent=rows.length?'✅ '+rows.length+' product(en) privé opgeslagen.':'Nog geen producten in je online catalogus.';
 for(const p of rows){
  const item=document.createElement('article');item.style.cssText='padding:12px;margin:10px 0;border:1px solid #ddd3f1;border-radius:10px';
  const title=document.createElement('strong');title.textContent=p.name+' · '+eur(p.price_cents);
  const desc=document.createElement('p');desc.textContent=(p.kind==='digital'?'📥 Digitaal':'📦 Fysiek')+' · '+(p.is_listed?'Voorbereid als zichtbaar':'Privé concept')+(p.kind==='digital'?(p.digital_file_path?' · Bestand gekoppeld':' · ⚠️ Bestand ontbreekt'):'');
  const remove=document.createElement('button');remove.className='secondary';remove.type='button';remove.textContent='Verwijderen';
  remove.addEventListener('click',async()=>{
   if(!confirm('Dit catalogusproduct verwijderen?'))return;
   remove.disabled=true;
   const {error}=await client.from('allbiz_catalog_products').delete().eq('id',p.id).eq('seller_id',user.id);
   if(error){$('abcStatus').textContent='⚠️ '+error.message;remove.disabled=false}else await refresh();
  });
  item.append(title,desc,remove);$('abcItems').append(item);
 }
 }catch(e){$('abcStatus').textContent='⚠️ '+e.message;}
}
$('abcForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.target.querySelector('button[type=submit]');btn.disabled=true;$('abcStatus').textContent='Product opslaan…';
 try{
  const {client,user}=await account();
  const value=$('abcPrice').value.trim(),cents=Math.round(Number(value)*100);
  if(!value||!Number.isSafeInteger(cents)||cents<1||cents>10000000)throw Error('Gebruik een geldige prijs.');
  const rawStock=$('abcStock').value.trim();
  const stock=rawStock===''?null:Number(rawStock);
  if(stock!==null&&(!Number.isInteger(stock)||stock<0||stock>1000000))throw Error('Ongeldige voorraad.');
  const kind=$('abcKind').value;
  const filePath=kind==='digital' ? $('abcFile').value : '';
  if(filePath&&!filePath.startsWith(user.id+'/'))throw Error('Ongeldig digitaal bestand.');
  if(kind==='digital'&&$('abcListed').checked&&!filePath)throw Error('Koppel eerst een geüpload digitaal bestand voordat je dit product zichtbaar maakt.');
  const row={seller_id:user.id,name:$('abcName').value.trim(),description:$('abcDesc').value.trim(),kind,price_cents:cents,stock,digital_file_path:filePath,is_listed:$('abcListed').checked,updated_at:new Date().toISOString()};
  if(row.name.length<2)throw Error('Vul een productnaam in.');
  const {error}=await client.from('allbiz_catalog_products').insert(row);
  if(error)throw error;
  $('abcForm').reset();await refresh();
 }catch(e){$('abcStatus').textContent='⚠️ '+e.message}
 finally{btn.disabled=false}
});
$('abcStoreLink').addEventListener('click',async()=>{try{const {user}=await account();const link='https://saelendanielle-coder.github.io/allbiz-one/winkel.html?seller='+encodeURIComponent(user.id);await navigator.clipboard.writeText(link);$('abcStatus').textContent='✅ Winkellink gekopieerd. De winkel opent alleen wanneer jouw echte abonnement en verplichte bedrijfsgegevens gecontroleerd zijn.';}catch(e){$('abcStatus').textContent='Winkellink: https://saelendanielle-coder.github.io/allbiz-one/winkel.html?seller=JOUW-ACCOUNT-ID · '+e.message;}});
$('abcRefresh').addEventListener('click',refresh);
$('abcOrdersRefresh').addEventListener('click',async()=>{
 $('abcOrdersStatus').textContent='Bestellingen ophalen…';$('abcOrders').replaceChildren();
 try{
  const {client,user}=await account();
  const {data,error}=await client.from('allbiz_store_orders').select('id,amount_total_cents,status,created_at,fulfillment_status').eq('seller_id',user.id).order('created_at',{ascending:false}).limit(30);
  if(error)throw error;
  $('abcOrdersStatus').textContent=data.length?data.length+' serverbestelling(en)':'Geen echte bestellingen geregistreerd.';
  for(const order of data){
   const card=document.createElement('div');card.style.cssText='padding:12px;margin:9px 0;border:1px solid #ddd;border-radius:10px';
   const p=document.createElement('p');p.textContent=new Date(order.created_at).toLocaleString('nl-BE')+' · '+eur(order.amount_total_cents)+' · '+order.status+' · '+(order.fulfillment_status||'');
   card.append(p);
   if(order.fulfillment_status==='awaiting_dispatch'){
    const carrier=document.createElement('input');carrier.placeholder='Vervoerder (bv. bpost)';carrier.maxLength=80;
    const track=document.createElement('input');track.placeholder='Track & trace (optioneel)';track.maxLength=100;
    const send=document.createElement('button');send.textContent='📦 Markeer als verzonden';
    send.addEventListener('click',async()=>{send.disabled=true;try{await updateShipping(order.id,'dispatch',{shipping_carrier:carrier.value,tracking_number:track.value});$('abcOrdersRefresh').click()}catch(e){$('abcOrdersStatus').textContent='⚠️ '+e.message;send.disabled=false;}});
    card.append(carrier,track,send);
   }
   if(order.fulfillment_status==='shipped'){
    const done=document.createElement('button');done.textContent='✅ Markeer als geleverd';
    done.addEventListener('click',async()=>{done.disabled=true;try{await updateShipping(order.id,'delivered',{});$('abcOrdersRefresh').click()}catch(e){$('abcOrdersStatus').textContent='⚠️ '+e.message;done.disabled=false;}});
    card.append(done);
   }
   $('abcOrders').append(card);
  }
 }catch(e){$('abcOrdersStatus').textContent='⚠️ '+e.message}
});
async function updateShipping(order_id,action,fields){
 const {client}=await account();const {data:{session}}=await client.auth.getSession();
 if(!session?.access_token)throw Error('Log opnieuw in');
 const response=await fetch('https://woaifabvfqnnunxmhpkc.supabase.co/functions/v1/allbiz-fulfillment',{
 method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
 body:JSON.stringify({action,order_id,...fields})});
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(body.error||'Bestelling bijwerken mislukt');
 return body;
}
window.addEventListener('allbiz-user-changed',()=>{$('abcForm').reset();$('abcItems').replaceChildren();$('abcOrders').replaceChildren();$('abcStatus').textContent='Account gewijzigd. Haal je catalogus opnieuw op.';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();