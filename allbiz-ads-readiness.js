/* AllBiz One - read-only overview of external advertising account connections.
   No accounts are connected, changed or disconnected by this dashboard. */
(()=>{
  'use strict';
  const panel=document.getElementById('adaccounts');
  if(!panel||document.getElementById('allbizAdsReadiness'))return;
  const box=document.createElement('section');
  box.className='card';box.id='allbizAdsReadiness';
  const title=document.createElement('h3');title.textContent='📋 Status van advertentiekoppelingen';
  const intro=document.createElement('p');
  intro.className='small muted';
  intro.textContent='Bekijk of Google en Meta klaar zijn om te koppelen. TikTok-koppeling is nog in ontwikkeling. Deze controle plaatst geen advertenties en wijzigt niets.';
  const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='🔄 Controleer mijn koppelingen';
  const status=document.createElement('p');status.className='small muted';status.setAttribute('role','status');
  const list=document.createElement('ul');list.style.lineHeight='1.7';
  const providers=[['Google Ads','allbiz-ads-connect'],['Facebook & Instagram','allbiz-social-ads-connect']];
  const endpointBase='https://woaifabvfqnnunxmhpkc.supabase.co/functions/v1/';
  function show(rows){
    list.replaceChildren();
    for(const text of rows){const li=document.createElement('li');li.textContent=text;list.append(li)}
  }
  async function check(){
    button.disabled=true;status.textContent='Koppelingsstatus controleren…';
    const auth=window.allbizAuth;
    if(!auth){show(['Google Ads: log eerst in.','Facebook & Instagram: log eerst in.','TikTok Ads: verbinding is nog niet beschikbaar.']);status.textContent='Open eerst Mijn account.';button.disabled=false;return;}
    try{
      const {data,error}=await auth.getSession();
      if(error||!data?.session?.access_token)throw Error('Log eerst in bij Mijn account.');
      const key=window.allbizPublicApiKey||'';
      const results=await Promise.all(providers.map(async([name,slug])=>{
        const controller=new AbortController();
        const timeout=setTimeout(()=>controller.abort(),8000);
        try{
          const response=await fetch(endpointBase+slug,{
            method:'POST',
            headers:{'Authorization':'Bearer '+data.session.access_token,'apikey':key,'Content-Type':'application/json'},
            body:JSON.stringify({action:'status'}),signal:controller.signal
          });
          const body=await response.json().catch(()=>({}));
          if(!response.ok)throw Error(typeof body.error==='string'?body.error:'Status niet bereikbaar');
          const p=slug==='allbiz-ads-connect'?body.google:body.meta;
          if(!p)throw Error('Geen verbindingsinformatie ontvangen');
          if(p.connected)return name+': ✅ account gekoppeld (geen automatische advertentiepublicatie).';
          if(p.configured)return name+': 🟡 ontwikkelaarsinstellingen aanwezig; geef zelf toestemming om te koppelen.';
          return name+': 🔒 ontwikkelaarsinstellingen ontbreken of zijn nog niet volledig.';
        }catch(e){return name+': ⚠️ '+(e?.message||'Controle niet beschikbaar');}
        finally{clearTimeout(timeout);}
      }));
      show([...results,'TikTok Ads: 🔒 nog geen werkende Marketing API-koppeling.']);
      status.textContent='Alleen-lezen controle afgerond. Er zijn geen campagnes gestart en geen bedragen uitgegeven.';
    }catch(e){
      show(['Google Ads: status niet gecontroleerd.','Facebook & Instagram: status niet gecontroleerd.','TikTok Ads: verbinding nog niet beschikbaar.']);
      status.textContent=e?.message||'Controle mislukt.';
    }finally{button.disabled=false;}
  }
  button.addEventListener('click',check);
  box.append(title,intro,button,status,list);
  const first=panel.querySelector('.card');
  if(first)first.before(box);else panel.append(box);
  show(['Google Ads: nog niet gecontroleerd.','Facebook & Instagram: nog niet gecontroleerd.','TikTok Ads: verbinding nog niet beschikbaar.']);
  window.addEventListener('allbiz-user-changed',()=>{show(['Google Ads: controleer opnieuw.','Facebook & Instagram: controleer opnieuw.','TikTok Ads: nog niet beschikbaar.']);status.textContent='Account veranderd. Controleer opnieuw voor actuele informatie.';});
})();