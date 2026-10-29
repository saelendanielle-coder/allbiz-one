/* AllBiz One: privé bedrijfsprofiel en digitale productbestanden. Geen klantbetalingen of levering. */
(() => {
'use strict';
function init(){
 const host=document.getElementById('shop');
 if(!host||document.getElementById('allbizSellerProfile'))return;
 const section=document.createElement('section');section.className='card';section.id='allbizSellerProfile';
 section.style.cssText='margin:18px 0;padding:18px;border:1px solid #ddd3f1;border-radius:15px';
 section.innerHTML='<h2>🏢 Mijn verkopersgegevens</h2><p class="small muted">Bewaar je bedrijfsinformatie privé bij je account. Vul alleen correcte officiële gegevens in. Dit publiceert niets.</p>'+
 '<form id="allbizSellerForm"><div class="fields">'+
 '<label>Officiële bedrijfsnaam<input name="legal_name" maxlength="160" autocomplete="organization"></label>'+
 '<label>Ondernemingsnummer<input name="business_number" maxlength="40"></label>'+
 '<label>Bedrijfsadres<input name="business_address" maxlength="300" autocomplete="street-address"></label>'+
 '<label>Contact-e-mail<input name="contact_email" type="email" maxlength="160"></label>'+
 '<label>Klantenservice-e-mail<input name="support_email" type="email" maxlength="160"></label>'+
 '<label>Link naar retourbeleid<input name="return_policy_url" type="url" maxlength="400" placeholder="https://..."></label>'+
 '<label>Link naar privacybeleid<input name="privacy_url" type="url" maxlength="400" placeholder="https://..."></label>'+
 '<label>Link naar algemene voorwaarden<input name="terms_url" type="url" maxlength="400" placeholder="https://..."></label>'+
 '</div><button type="submit">💾 Bewaar bedrijfsgegevens</button> <button type="button" class="secondary" id="allbizSellerReload">↻ Gegevens ophalen</button></form>'+
 '<p id="allbizSellerStatus" role="status" class="small muted">Log in bij Mijn account om je gegevens te beheren.</p>'+
 '<hr style="margin:22px 0;border:0;border-top:1px solid #e5dff0">'+
 '<h3>📥 Privé digitale productbestanden</h3><p class="small muted">Upload PDF, ZIP, TXT, JPG of PNG tot 20 MB. Alleen jouw ingelogde account kan dit bestand bekijken. Automatische levering na betaling is nog niet aangesloten.</p>'+
 '<label for="allbizDigitalUpload">Kies digitaal bestand</label><input id="allbizDigitalUpload" type="file" accept=".pdf,.zip,.txt,.png,.jpg,.jpeg,application/pdf,application/zip,text/plain,image/png,image/jpeg">'+
 '<button type="button" id="allbizDigitalSave">🔒 Bestand privé opslaan</button> <button type="button" class="secondary" id="allbizDigitalRefresh">↻ Bestanden bekijken</button>'+
 '<p id="allbizDigitalStatus" role="status" class="small muted">Nog geen bestanden opgehaald.</p><div id="allbizDigitalList"></div>';
 const near=host.querySelector('.card');if(near)near.after(section);else host.prepend(section);
 const $=id=>section.querySelector('#'+id),fields=['legal_name','business_number','business_address','contact_email','support_email','return_policy_url','privacy_url','terms_url'];
 const form=$('allbizSellerForm'),status=$('allbizSellerStatus'),fileStatus=$('allbizDigitalStatus');
 const bucket='allbiz-digital-products';
 async function auth(){
  const client=window.allbizClient;
  if(!client)throw Error('De beveiligde accountverbinding is nog niet klaar. Vernieuw de app.');
  const {data,error}=await client.auth.getUser();
  if(error||!data?.user)throw Error('Log eerst in bij Mijn account.');
  return {client,user:data.user};
 }
 async function load(){
  status.textContent='Gegevens ophalen…';
  try{
   const {client,user}=await auth();
   const {data,error}=await client.from('allbiz_seller_profiles').select(fields.join(',')).eq('user_id',user.id).maybeSingle();
   if(error)throw error;
   for(const field of fields)form.elements.namedItem(field).value=data?.[field]||'';
   status.textContent=data?'✅ Je bewaarde bedrijfsgegevens zijn geladen.':'Nog geen bedrijfsgegevens opgeslagen.';
  }catch(e){status.textContent='⚠️ '+e.message;}
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;status.textContent='Privé opslaan…';
  try{
   const {client,user}=await auth(),row={user_id:user.id,updated_at:new Date().toISOString()};
   for(const field of fields)row[field]=String(form.elements.namedItem(field).value||'').trim();
   for(const key of ['return_policy_url','privacy_url','terms_url']){
    if(row[key]&&!/^https:\/\/[^\s]+$/i.test(row[key]))throw Error('Gebruik voor '+key+' een volledige https-link.');
   }
   const {error}=await client.from('allbiz_seller_profiles').upsert(row,{onConflict:'user_id'});
   if(error)throw error;status.textContent='✅ Bedrijfsgegevens privé opgeslagen. Nog niets openbaar gemaakt.';
  }catch(err){status.textContent='⚠️ Opslaan mislukt: '+err.message}
  finally{button.disabled=false;}
 });
 $('allbizSellerReload').addEventListener('click',load);
 async function listFiles(){
  fileStatus.textContent='Privé bestanden ophalen…';const list=$('allbizDigitalList');list.replaceChildren();
  try{
   const {client,user}=await auth();
   const {data,error}=await client.storage.from(bucket).list(user.id,{limit:100,sortBy:{column:'created_at',order:'desc'}});
   if(error)throw error;
   const files=(data||[]).filter(x=>x.name&&x.id);
   fileStatus.textContent=files.length?'✅ '+files.length+' privé bestand(en).':'Nog geen digitale bestanden opgeslagen.';
   files.forEach(file=>{
    const line=document.createElement('div');line.style.cssText='display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-bottom:1px solid #eee;padding:8px 0';
    const title=document.createElement('span');title.textContent=file.name;title.style.overflowWrap='anywhere';
    const open=document.createElement('button');open.type='button';open.className='secondary';open.textContent='Open privé';
    open.addEventListener('click',async()=>{
     open.disabled=true;
     try{
      const {data,error}=await client.storage.from(bucket).createSignedUrl(user.id+'/'+file.name,60);
      if(error||!data?.signedUrl)throw error||Error('Geen beveiligde link');
      window.open(data.signedUrl,'_blank','noopener,noreferrer');
     }catch(e){fileStatus.textContent='⚠️ '+e.message}finally{open.disabled=false}
    });
    const del=document.createElement('button');del.type='button';del.className='secondary';del.textContent='Verwijder';
    del.addEventListener('click',async()=>{
     if(!confirm('Dit privé bestand definitief verwijderen?'))return;
     del.disabled=true;
     const {error}=await client.storage.from(bucket).remove([user.id+'/'+file.name]);
     if(error){fileStatus.textContent='⚠️ '+error.message;del.disabled=false}else await listFiles();
    });
    line.append(title,open,del);list.append(line);
   });
  }catch(e){fileStatus.textContent='⚠️ '+e.message}
 }
 $('allbizDigitalRefresh').addEventListener('click',listFiles);
 $('allbizDigitalSave').addEventListener('click',async()=>{
  const f=$('allbizDigitalUpload').files?.[0];if(!f){fileStatus.textContent='Kies eerst een bestand.';return}
  if(f.size>20*1024*1024){fileStatus.textContent='Bestand groter dan 20 MB.';return}
  const valid=['application/pdf','application/zip','application/x-zip-compressed','text/plain','image/png','image/jpeg'];
  if(!valid.includes(f.type)){fileStatus.textContent='Dit bestandstype is niet toegestaan.';return}
  const button=$('allbizDigitalSave');button.disabled=true;fileStatus.textContent='Beveiligd uploaden…';
  try{
   const {client,user}=await auth();
   const ext=f.name.split('.').pop()?.toLowerCase()||'bin';
   const name=crypto.randomUUID()+'.'+ext;
   const {error}=await client.storage.from(bucket).upload(user.id+'/'+name,f,{contentType:f.type==='application/x-zip-compressed'?'application/zip':f.type,upsert:false});
   if(error)throw error;
   $('allbizDigitalUpload').value='';await listFiles();
  }catch(e){fileStatus.textContent='⚠️ Upload mislukt: '+e.message}
  finally{button.disabled=false;}
 });
 window.addEventListener('allbiz-user-changed',()=>{form.reset();$('allbizDigitalList').replaceChildren();status.textContent='Account gewijzigd. Haal je gegevens opnieuw op.';fileStatus.textContent='Bestanden opnieuw ophalen.';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();