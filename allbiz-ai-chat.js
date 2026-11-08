/* AllBiz One beveiligde AI-chat, aanvullend op de bestaande gratis hulp. */
(()=>{
 'use strict';
 const panel=document.getElementById('help');
 if(!panel)return;
 const card=panel.querySelector('.card');if(!card)return;
 const section=document.createElement('section');
 section.className='card';
 section.id='allbizAiChat';
 section.style.cssText='border:1px solid #d7ccf6;background:#faf8ff;margin:16px 0;padding:18px;border-radius:16px';
 const h=document.createElement('h3');h.textContent='✨ AllBiz AI Assistent (Business)';
 const info=document.createElement('p');info.textContent='Stel vrije vragen zodra de beveiligde AI-server is ingesteld en jouw Business-abonnement actief is. De gratis hulp blijft beschikbaar.';
 info.className='muted';
 const badge=document.createElement('p');badge.textContent='🔒 Nog niet actief · er worden geen betaalde AI-aanvragen verstuurd.';
 badge.setAttribute('role','status');badge.id='allbizAiStatus';
 const messages=document.createElement('div');messages.id='allbizAiMessages';messages.setAttribute('aria-live','polite');
 messages.style.cssText='min-height:52px;max-height:260px;overflow-y:auto;display:grid;gap:8px;padding:12px;background:white;border:1px solid #e4daf7;border-radius:12px;margin:12px 0;white-space:pre-wrap;overflow-wrap:anywhere';
 const form=document.createElement('form');form.id='allbizAiForm';
 const label=document.createElement('label');label.htmlFor='allbizAiQuestion';label.textContent='Vraag aan AI';
 const input=document.createElement('textarea');input.id='allbizAiQuestion';input.maxLength=500;input.rows=2;input.placeholder='Bijvoorbeeld: help me mijn eerste website maken';input.required=true;
 const submit=document.createElement('button');submit.type='submit';submit.textContent='✨ Vraag AI';submit.disabled=true;
 const note=document.createElement('p');note.className='muted small';note.textContent='Geen wachtwoorden, bankgegevens of vertrouwelijke klantinformatie invoeren. Live AI is bedoeld als een toekomstige Business-functie, niet als vervanging van menselijke klantenservice.';
 const retry=document.createElement('button');
 retry.type='button';retry.className='secondary';retry.textContent='🔄 Controleer AI-status';
 const free=document.createElement('button');
 free.type='button';free.className='secondary';free.textContent='💬 Vraag gratis hulp';
 free.addEventListener('click',()=>{
   const field=document.getElementById('allbizHelpQuestion');
   const help=document.getElementById('allbizHelpForm');
   if(!field||!help)return;
   if(input.value.trim())field.value=input.value.trim();
   if(field.value.trim())help.requestSubmit();else field.focus();
 });
 form.append(label,input,submit,retry,free);section.append(h,info,badge,messages,form,note);card.append(section);
 const add=(text,user)=>{
   const line=document.createElement('div');line.textContent=text;line.style.cssText='padding:10px 12px;border-radius:12px;justify-self:'+(user?'end':'start')+';background:'+(user?'#5940c7':'#f1edff')+';color:'+(user?'white':'#31254b');
   messages.append(line);while(messages.children.length>16)messages.firstChild.remove();
   messages.scrollTop=messages.scrollHeight;
 };
 add('De gratis hulp is nu beschikbaar. De externe AI-chat wordt later ingeschakeld zodra de beveiligde sleutel is ingesteld.',false);
 const endpoint='https://woaifabvfqnnunxmhpkc.supabase.co/functions/v1/allbiz-ai-assistant';
 const publicKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYWlmYWJ2ZnFubnVueG1ocGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Njk3MzMsImV4cCI6MjEwODQ0NTczM30.uDYHF8yKt48Fc6nVrgPpgy_TiizUFM6tAsVRc2dCT10';
 let busy=false;
 const history=[];
 const check=async()=>{
   retry.disabled=true;submit.disabled=true;
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),8000);
   badge.textContent='AI-koppeling wordt gecontroleerd…';
   try{
     const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':publicKey},body:JSON.stringify({action:'status'}),signal:controller.signal});
     if(!res.ok)throw Error('Status niet bereikbaar');
     const data=await res.json(),available=data.available===true;
     badge.textContent=available?'✅ AI-server ingesteld. Log in met een actief Business-abonnement om vragen te stellen.':'🔒 Er is nog geen AI-API-sleutel op de server ingesteld. Gebruik de gratis hulp.';
     submit.disabled=!available;
   }catch{
     badge.textContent='⚠️ AI-status niet bereikbaar. Gebruik gratis hulp en probeer later opnieuw.';
   }finally{clearTimeout(timeout);retry.disabled=false;}
 };
 retry.addEventListener('click',check);
 window.addEventListener('allbiz-user-changed',()=>{history.length=0;check();});
 check();
  form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy||submit.disabled)return;
  const message=input.value.trim();if(!message)return;
  const auth=window.allbizAuth;
  if(!auth){badge.textContent='Log eerst in bij Mijn account om AI te gebruiken.';return}
  let session;
  try{session=(await auth.getSession()).data.session}catch{}
  if(!session?.access_token){badge.textContent='Log eerst in bij Mijn account om AI te gebruiken.';return}
  input.value='';add(message,true);busy=true;submit.disabled=true;badge.textContent='AI verwerkt je vraag...';
  try{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
   const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':publicKey,'Authorization':'Bearer '+session.access_token},body:JSON.stringify({message,history:history.slice(-6)}),signal:controller.signal});
   clearTimeout(timeout);
   const data=await res.json();
   if(!res.ok||!data.answer)throw Error(data.error||'AI niet beschikbaar.');
   add(data.answer,false);history.push({role:'user',content:message},{role:'assistant',content:data.answer});badge.textContent='Antwoord ontvangen.';
  }catch(err){add(err.message||'AI tijdelijk niet beschikbaar.',false);badge.textContent='Je kunt de gratis hulp blijven gebruiken.'}
  finally{busy=false;submit.disabled=false}
 });
})();