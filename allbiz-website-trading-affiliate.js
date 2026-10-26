/* AllBiz One — gratis tools voor website, tradingvoorbereiding en affiliate. Geen externe betalingen. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const site=$('site'),trading=$('trading'),affiliate=$('affiliate');
  if(!site||!trading||!affiliate||$('aboSiteAudit'))return;
  const css=document.createElement('style');
  css.textContent='.abo-tools{background:#faf8ff;color:#241c39;border:1px solid #ded7ed;border-radius:16px;padding:17px;margin:17px 0}.abo-tools h3{margin:0 0 9px}.abo-tools p{line-height:1.5}.abo-tools .abo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.abo-tools label{display:block;font-weight:650;margin:10px 0 4px}.abo-tools input,.abo-tools textarea,.abo-tools select{width:100%;min-width:0;box-sizing:border-box;font-size:16px}.abo-tools textarea{min-height:135px;line-height:1.45}.abo-tools .abo-actions{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}.abo-tools button{min-height:45px;white-space:normal}.abo-tools .abo-output{white-space:pre-wrap;overflow-wrap:anywhere;background:white;border:1px solid #e3dcf0;border-radius:12px;padding:13px;line-height:1.5}.abo-tools li{margin:7px 0}@media(max-width:650px){.abo-tools{padding:12px}.abo-tools .abo-grid,.abo-tools .abo-actions{display:grid;grid-template-columns:1fr}.abo-tools .abo-actions button{width:100%}}';
  document.head.append(css);
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
  const val=id=>String($(id)?.value||'').trim();
  const money=x=>new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'}).format(x);
  const input=(id,title,type='text',value)=>{
    const box=el('div'),lab=el('label',title),field=el('input');
    field.id=id;field.type=type;lab.htmlFor=id;if(value!==undefined)field.value=String(value);
    box.append(lab,field);return {box,field};
  };
  const button=(title,fn)=>{const b=el('button',title,'secondary');b.type='button';b.addEventListener('click',fn);return b};
  const copy=async(t,field,status)=>{
    if(!t.trim()){status.textContent='Maak eerst je tekst.';return}
    try{if(!navigator.clipboard?.writeText)throw Error('Geen klembord');await navigator.clipboard.writeText(t);status.textContent='✅ Tekst gekopieerd.'}
    catch{field.focus();field.select();status.textContent='Selecteer de tekst en kies Kopiëren.'}
  };
  // Website: checklist + SEO-tekst. Schrijft geen sitegegevens en publiceert niets.
  const siteBox=el('section',undefined,'abo-tools');siteBox.id='aboSiteAudit';
  siteBox.append(el('h3','🌐 Websitecheck en SEO-voorstel'),el('p','Controleer je ingevulde informatie. Deze check registreert geen domeinnaam en publiceert geen website.','muted'));
  const siteStatus=el('p','Nog niet gecontroleerd.','muted');siteStatus.setAttribute('role','status');
  const checks=el('ul');const seoLabel=el('label','Voorstel voor zoekmachines (bewerken toegestaan)');seoLabel.htmlFor='aboSeoText';
  const seo=el('textarea');seo.id='aboSeoText';seo.rows=6;
  const webButtons=el('div',undefined,'abo-actions');
  webButtons.append(button('✅ Controleer website',()=>{
    const brand=val('brand'),desc=val('description'),about=val('siteAbout'),services=val('siteServices'),email=val('siteEmail'),domain=val('domainName');
    const a=[
      [brand.length>=2,'Bedrijfsnaam ingevuld'],
      [desc.length>=20,'Beschrijving van minimaal 20 tekens'],
      [about.length>=60,'Duidelijke Over ons-tekst van minimaal 60 tekens'],
      [services.length>=5,'Diensten of aanbod beschreven'],
      [/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Geldig contact-e-mailadres'],
      [domain.length>=3,'Gewenste domeinnaam ingevuld (beschikbaarheid onbekend)']
    ];
    checks.replaceChildren();a.forEach(([ok,label])=>checks.append(el('li',(ok?'✅ ':'⬜ ')+label)));
    const title=((brand||'Mijn bedrijf')+' — '+(desc||'Website')).slice(0,60);
    const snippet=((desc||'Ontdek ons aanbod.')+' '+(about||'')+' Neem contact op voor meer informatie.').replace(/\s+/g,' ').trim().slice(0,155);
    seo.value='PAGINATITEL\n'+title+'\n\nMETABESCHRIJVING\n'+snippet;
    siteStatus.textContent=a.filter(x=>x[0]).length+' van 6 basispunten aanwezig. Dit is geen juridische of technische certificering.';
  }),button('📋 Kopieer SEO-tekst',()=>copy(seo.value,seo,siteStatus)));
  siteBox.append(webButtons,siteStatus,checks,seoLabel,seo,el('p','SEO-tekst wordt niet automatisch toegevoegd aan een export of openbare website. Controleer handels-, privacy- en contactinformatie zelf.','small muted'));
  $('sitePreview')?.before(siteBox);

  // Trading: alleen een fictieve calculator. Geen brokerverbinding, orders of marktgegevens.
  const trade=el('section',undefined,'abo-tools');trade.id='aboTradingScenario';
  trade.append(el('h3','📈 Voorbereiding op echte trading'),
    el('p','Oefen met winst-, verlies- en kostenberekeningen. Dit is geen beursrekening, geen live koers en geen financieel advies.','muted'));
  const grid=el('div',undefined,'abo-grid'),amount=input('aboTradeAmount','Fictief handelsbedrag (€)','number',100),
    change=input('aboTradeChange','Veronderstelde koersverandering (%)','number',-10),
    fees=input('aboTradeCosts','Veronderstelde kosten (€)','number',2);
  amount.field.min='1';amount.field.max='1000000';amount.field.step='.01';
  change.field.min='-100';change.field.max='1000';change.field.step='.1';
  fees.field.min='0';fees.field.max='1000000';fees.field.step='.01';
  grid.append(amount.box,change.box,fees.box);
  const tradeOutput=el('div','Vul een fictief scenario in en kies Bereken.','abo-output');
  tradeOutput.setAttribute('role','status');
  function simulate(){
    const a=Number(amount.field.value),c=Number(change.field.value),f=Number(fees.field.value);
    if(![amount.field.value,change.field.value,fees.field.value].every(v=>String(v).trim()) ||
      !Number.isFinite(a)||a<=0||a>1000000||!Number.isFinite(c)||c< -100||c>1000||
      !Number.isFinite(f)||f<0||f>1000000){
      tradeOutput.textContent='Voer een geldig bedrag, een koersverandering vanaf -100% en niet-negatieve kosten in.';return;
    }
    const gross=a*(1+c/100),net=Math.max(0,gross-f),difference=net-a;
    tradeOutput.textContent=[
      '🧪 FICTIEF SCENARIO — GEEN ECHTE HANDEL',
      'Inleg: '+money(a),'Koersverandering: '+c.toLocaleString('nl-BE')+'%',
      'Kosten: '+money(f),'Eindwaarde (schatting): '+money(net),
      'Resultaat: '+(difference>0?'+':'')+money(difference),
      '',
      'Bij -100% kun je de volledige inleg verliezen. Met hefboom, schulden of andere contracten kunnen verplichtingen verder gaan.'
    ].join('\n');
  }
  const tradeButtons=el('div',undefined,'abo-actions');
  tradeButtons.append(button('🧮 Bereken fictief resultaat',simulate),
    button('⚠️ Simuleer 100% verlies',()=>{change.field.value='-100';simulate()}));
  trade.append(grid,tradeButtons,tradeOutput,
    el('p','Voor echte handel moeten we nog een toegelaten broker en een beveiligde koppeling toevoegen, transacties afzonderlijk testen en de geldende regels controleren. Je kunt hier niet storten, kopen, verkopen of opnemen.','small muted'));
  trading.querySelector('.card')?.after(trade);

  // Saxo OpenAPI: gereedheid tonen, geen tokens of klantgegevens in publieke GitHub-code.
  const broker=el('section',undefined,'abo-tools');broker.id='aboBrokerSetup';
  broker.append(el('h3','🏦 Brokerkoppeling voorbereiden — Saxo OpenAPI'),
    el('p','Verbindingsstatus: NIET GEKOPPELD. Geen handelsrechten, geen saldo en geen automatische orders.','abo-output'));
  const brokerSteps=el('ol');
  [
    'Vraag bij Saxo een eigen developeraccount en Simulation (SIM) applicatie aan.',
    'Registreer de juiste OAuth-terugkeer-URL en verkrijg toepassingsgegevens. Zet AppSecret nooit in een openbaar bestand.',
    'Bouw eerst een beveiligde serverkoppeling met OAuth-toestemming, privésessies en veilig tokenbeheer.',
    'Test alleen lezen en gesimuleerde orders in SIM; geen bankgegevens invoeren in AllBiz One.',
    'Vraag Saxo apart goedkeuring voor gebruik door externe klanten en voor LIVE. Controleer ook de toepasselijke Belgische regels.'
  ].forEach(t=>brokerSteps.append(el('li',t)));
  const brokerLinks=el('div',undefined,'abo-actions');
  const link=(label,url)=>{
    const a=el('a',label,'secondary');
    a.href=url;a.target='_blank';a.rel='noopener noreferrer';
    a.style.cssText='display:inline-block;padding:12px 16px;border-radius:10px;text-decoration:none;border:1px solid #b8a7dc;font-weight:650';
    return a;
  };
  brokerLinks.append(
    link('🔗 Saxo ontwikkelaarsportaal','https://developer.saxobank.com/openapi/'),
    link('🧪 Saxo SIM en LIVE uitleg','https://developer.saxobank.com/openapi/learn/environments'),
    link('🔒 Saxo API-beveiliging','https://developer.saxobank.com/openapi/learn/security')
  );
  broker.append(brokerSteps,brokerLinks,
    el('p','Let op: de testcalculator hierboven gebruikt fictieve gegevens en heeft GEEN koppeling met Saxo. De gebruiker verleent pas later afzonderlijke toestemming binnen een beveiligde broker-login.','small muted'));
  trade.after(broker);

  // Affiliate: campagnevoorstellen met expliciete reclamemelding en linkcontrole.
  const aff=el('section',undefined,'abo-tools');aff.id='aboAffiliateCampaign';
  aff.append(el('h3','📣 Affiliatecampagne maken'),
    el('p','Maak een bericht voor je eigen kanaal. Controleer of je persoonlijke partnerlink klopt. Er worden geen kliks of commissies verzonnen.','muted'));
  const channelLabel=el('label','Promotiekanaal');channelLabel.htmlFor='aboAffChannel';
  const channel=el('select');channel.id='aboAffChannel';
  [['instagram','Instagram'],['tiktok','TikTok'],['youtube','YouTube'],['website','Website of blog']].forEach(([v,n])=>{const o=el('option',n);o.value=v;channel.append(o)});
  const noteLabel=el('label','Je eigen eerlijke toelichting (optioneel)');noteLabel.htmlFor='aboAffNote';
  const note=el('textarea');note.id='aboAffNote';note.rows=3;note.maxLength=220;note.placeholder='Schrijf alleen ervaringen die je echt hebt.';
  const promoLabel=el('label','Kopieerbare promotietekst');promoLabel.htmlFor='aboAffDraft';
  const draft=el('textarea');draft.id='aboAffDraft';draft.rows=8;
  const affStatus=el('p','Kies eerst een affiliateproduct in de bestaande lijst.','muted');affStatus.setAttribute('role','status');
  const chosen=()=>{try{return typeof selectedAffiliate==='function'?selectedAffiliate():null}catch{return null}};
  const safeUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'&&Boolean(u.hostname.includes('.'))}catch{return false}};
  function makePromo(){
    const product=chosen();
    if(!product){affStatus.textContent='Selecteer eerst een eerder toegevoegd affiliateproduct.';return}
    const link=String(product.link||'').trim();
    if(!safeUrl(link)){affStatus.textContent='Deze link is geen geldige https-link. Controleer je partnerlink.';return}
    const channelName=channel.options[channel.selectedIndex]?.textContent||'Sociale media';
    const label='Advertentie / affiliate-link: bij een aankoop via deze link kan ik commissie ontvangen.';
    const line=String(product.description||'Bekijk de productinformatie bij de verkoper.').slice(0,500);
    const personal=note.value.trim().slice(0,220);
    const lines=[
      'CONCEPT VOOR '+channelName.toUpperCase(),
      '💡 '+String(product.name||'Mijn product').slice(0,150),
      line,personal,
      'Bekijk het product: '+link,
      label
    ].filter(Boolean);
    draft.value=lines.join('\n\n');
    affStatus.textContent='✅ Voorstel gemaakt. Controleer voorwaarden van het partnerprogramma, reclamevermelding en rechten op beelden vóór je publiceert.';
  }
  const affBtns=el('div',undefined,'abo-actions');
  affBtns.append(button('✨ Maak affiliatebericht',makePromo),
    button('📋 Kopieer affiliatebericht',()=>copy(draft.value,draft,affStatus)),
    button('🔗 Controleer linkvorm',()=>{
      const p=chosen();
      affStatus.textContent=p&&safeUrl(String(p.link||''))?
        '✅ De link heeft een geldig https-formaat. Of deze partnerlink geldig is en commissie oplevert, kan de app niet bevestigen.':
        '⚠️ Kies een product met een geldige https-partnerlink.';
    }));
  aff.append(channelLabel,channel,noteLabel,note,affBtns,promoLabel,draft,affStatus,
    el('p','Zonder toelating tot een affiliateprogramma is er geen gegarandeerde commissie. Je blijft zelf verantwoordelijk voor de reclamevermelding en wettelijke verplichtingen.','small muted'));
  affiliate.querySelectorAll('.card')[1]?.after(aff);
})();