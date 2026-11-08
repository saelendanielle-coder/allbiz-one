/* AllBiz One — gratis, lokale stappenhulp. Geen betaalde API, geen echte AI. */
(() => {
  'use strict';
  const init = () => {
    const panel = document.getElementById('help');
    if (!panel || document.getElementById('allbizGuidedHelp')) return;

    const flows = {
      trading: {
        label: '📈 Trading oefenen',
        access: 'Gratis uitleg — alleen oefenen',
        about: 'Leer hoe de tradingdemo werkt. Alleen fictieve bedragen: er zijn geen live koersen, geen brokerverbinding en geen echte orders.',
        steps: [
          {title:'Open Trading oefenen', detail:'Open Trading oefenen. Alle bedragen zijn fictief: er is geen broker verbonden en je kunt geen echte orders plaatsen.', tab:'trading', action:'Open Trading oefenen'},
          {title:'Bereken een oefenscenario', detail:'Vul een fictief handelsbedrag, een koersverandering en kosten in. Kies Bereken fictief resultaat. Dit koopt of verkoopt niets.', tab:'trading', action:'Open de testcalculator'},
          {title:'Bekijk het risico', detail:'Probeer ook een scenario met 100% verlies. Beleggen kan geld kosten en winst is nooit gegarandeerd. Echte handel blijft uit tot er een veilige, toegelaten brokerkoppeling is.', tab:'trading', action:'Bekijk de tradingrisico’s'}
        ]
      },
      website: {
        label: '🌐 Website maken',
        access: 'Starter of hoger nodig voor de websitebouwer',
        about: 'Bouw je bedrijfswebsite stap voor stap.',
        steps: [
          {title:'Vul je bedrijf in', detail:'Open Website & domein. Vul je bedrijfsnaam, beschrijving, diensten en contactgegevens in. Voor de website-editor is Starter of hoger nodig.', tab:'site', target:'brand', action:'Vul je bedrijfsgegevens in'},
          {title:'Kies een ontwerp', detail:'Kies een thema en bekijk het voorbeeld. Je kunt alle teksten later aanpassen.', tab:'site', target:'sitePreview', action:'Bekijk het websitevoorbeeld'},
          {title:'Bewaar je website', detail:'Gebruik Bewaar mijn ontwerp of download de voorbeeldwebsite. Alleen een bevestigd live abonnement en jouw toestemming kunnen een website later echt publiceren.', tab:'site', target:'makeSite', action:'Ga naar Bewaar mijn ontwerp'}
        ]
      },
      webshop: {
        label: '🛍️ Webshop maken',
        access: 'Pro of hoger nodig voor de webshopbouwer',
        about: 'Je kunt deze gratis stappen lezen. Om de webshopbouwer te openen heb je Pro of hoger nodig; zonder toegang kom je eerst bij Abonnementen. Echte afrekening en bestellingen blijven uitgeschakeld.',
        steps: [
          {title:'Vul je verkopersgegevens in', detail:'Open Mijn webshop en vul je echte bedrijfs- en contactgegevens in. Deze gegevens worden privé bewaard; ze zijn niet automatisch openbaar.', tab:'shop', target:'allbizSellerProfile', action:'Open verkopersgegevens'},
          {title:'Maak je winkelpagina’s', detail:'Gebruik de knoppen Over ons, Contact, Verzending en Retouren. Vul je eigen teksten in en kies Pagina bewaren.', tab:'shop', target:'allbizVisibleBuilder', openDetails:'shopBuilderDetails', action:'Open de paginabouwer'},
          {title:'Controleer en bewaar je ontwerp', detail:'Gebruik Controleer mijn pagina’s en bewaar het webshopontwerp privé in je account. Dit is geen echte winkelcheckout of juridische controle.', tab:'shop', target:'allbizPageAudit', action:'Controleer je webshoppagina’s'}
        ]
      },
      marketing: {
        label: '📣 Reclame maken',
        access: 'Starter of hoger nodig om berichten te maken',
        about: 'De uitleg en de digitale-marketingpagina kun je bekijken. Een bericht maken vereist Starter of hoger; er worden geen advertenties gepubliceerd.',
        steps: [
          {title:'Kies wat je promoot', detail:'Open Digitale marketing. Vul je product of bedrijf in, kies een doelgroep en een socialmediakanaal.', tab:'marketing', target:'marketingSubject', action:'Open Digitale marketing'},
          {title:'Maak een berichtconcept', detail:'Klik op Maak mijn bericht. Controleer de tekst zelf voordat je hem gebruikt. Er wordt niets automatisch online geplaatst.', tab:'marketing', target:'marketingCreate', action:'Ga naar Maak mijn bericht'},
          {title:'Bekijk en kopieer je bericht', detail:'Bekijk de gemaakte tekst en kopieer die om zelf te gebruiken. AllBiz One geeft geen garantie op klanten en geeft geen advertentiebudget uit.', tab:'marketing', target:'marketingOutput', action:'Bekijk je berichtconcept'}
        ]
      },
      affiliate: {
        label: '🔗 Affiliate marketing',
        access: 'Pro of hoger nodig voor affiliate-tools',
        about: 'Maak een promotietekst met je eigen partnerlink.',
        steps: [
          {title:'Kies een affiliateproduct', detail:'Open Affiliate marketing (Pro of hoger). Voeg alleen een echte partnerlink toe waarvoor je bij een affiliateprogramma bent toegelaten.', tab:'affiliate', target:'affiliateForm', action:'Open Affiliate marketing'},
          {title:'Maak een bericht', detail:'Ga naar Affiliatecampagne maken en kies Maak affiliatebericht. Met Test voorbeeldbericht kun je ook zonder partnerlink oefenen.', tab:'affiliate', action:'Maak een affiliatebericht'},
          {title:'Bewaar je concept', detail:'Gebruik Bewaar concept of Download tekst. Zet bij echte reclame duidelijk dat je commissie kunt ontvangen. De test verdient geen geld.', tab:'affiliate', action:'Open het campagneconcept'}
        ]
      }
    };

    const style=document.createElement('style');
    style.textContent=[
      '#allbizGuidedHelp{border:1px solid #d9cff3;background:#faf8ff}',
      '#allbizGuidedHelp .abo-guide-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}',
      '#allbizGuidedHelp .abo-guide-choices button{padding:13px 10px;min-height:65px;white-space:normal;text-align:left;font-size:15px;line-height:1.4}',
      '#allbizGuidedHelp .abo-guide-choices button[aria-pressed="true"]{border:2px solid #5c42bb;background:#ede7ff;color:#3c247d}',
      '#allbizGuidedHelp .abo-guide-detail{padding:13px;background:white;border:1px solid #e2daf6;border-radius:14px}',
      '#allbizGuidedHelp .abo-guide-step{font-weight:700;color:#55409b;margin:0 0 5px}',
      '#allbizGuidedHelp .abo-guide-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}',
      '#allbizGuidedHelp .abo-guide-actions button{flex:1 1 160px;white-space:normal;min-height:48px}',
      '@media(max-width:520px){#allbizGuidedHelp .abo-guide-choices{grid-template-columns:1fr}#allbizGuidedHelp .abo-guide-choices button{min-height:52px}}'
    ].join('');
    document.head.appendChild(style);

    const make = (tag, txt, className) => {
      const node=document.createElement(tag);
      if (txt !== undefined) node.textContent=txt;
      if (className) node.className=className;
      return node;
    };
    const block=make('section',undefined,'card');
    block.id='allbizGuidedHelp';
    const heading=make('h2','🧭 Wat wil je maken?');
    const intro=make('p','De stappen en uitleg zijn gratis. Voor sommige onderdelen van AllBiz One is een actief abonnement nodig. Je ziet dit voordat je een onderdeel opent.','muted');
    const choices=make('div',undefined,'abo-guide-choices');
    choices.setAttribute('role','group');
    choices.setAttribute('aria-label','Kies een stappenplan');
    const detail=make('div',undefined,'abo-guide-detail');
    const description=make('p','', 'muted');
    const access=make('p','', 'small muted');
    access.setAttribute('role','status');
    const progress=make('p','', 'abo-guide-step');
    progress.setAttribute('role','status');
    const stepTitle=make('h3','');
    const stepText=make('p','');
    const actions=make('div',undefined,'abo-guide-actions');
    const go=make('button','Open dit onderdeel');
    go.type='button';
    const back=make('button','Vorige stap','secondary');
    back.type='button';
    const next=make('button','Volgende stap','secondary');
    next.type='button';
    actions.append(go,back,next);
    detail.append(description,access,progress,stepTitle,stepText,actions);
    const privacy=make('p','Je voortgang wordt alleen op dit toestel bewaard. Dit is een stappenhulp met vaste uitleg; de aparte echte AI-chat is nog niet actief.','small muted');
    block.append(heading,intro,choices,detail,privacy);
    panel.insertBefore(block,panel.firstElementChild);

    const key='allbiz-guided-help-v1';
    let saved=null;
    try { saved=JSON.parse(localStorage.getItem(key)||'null'); } catch {}
    const urlGuide = (() => {
      try {
        const requested = new URLSearchParams(window.location.search).get('guide');
        return Object.prototype.hasOwnProperty.call(flows,requested)?requested:null;
      } catch { return null; }
    })();
    let chosen=urlGuide||(saved&&Object.prototype.hasOwnProperty.call(flows,saved.flow)?saved.flow:'website');
    let steps=saved&&typeof saved.steps==='object'&&saved.steps?{...saved.steps}:{};
    const save=()=>{
      try { localStorage.setItem(key,JSON.stringify({flow:chosen,steps})); } catch {}
    };
    const draw=()=>{
      const flow=flows[chosen];
      const current=Math.max(0,Math.min(flow.steps.length-1,Number(steps[chosen])||0));
      steps[chosen]=current;
      const step=flow.steps[current];
      choices.querySelectorAll('button[data-guide]').forEach(b=>{
        b.setAttribute('aria-pressed',String(b.dataset.guide===chosen));
      });
      description.textContent=flow.about;
      access.textContent='Toegang: '+(flow.access||'Controleer je abonnement');
      progress.textContent='Stap '+(current+1)+' van '+flow.steps.length;
      stepTitle.textContent=step.title;
      stepText.textContent=step.detail;
      const tierLocked=typeof window.allbizUiTierAllowed==='function' && !window.allbizUiTierAllowed(step.tab);
      go.textContent=tierLocked?'💎 Bekijk abonnementen voor deze stap':step.action;
      go.title=tierLocked?'Dit onderdeel is nog vergrendeld voor je account. Je wordt naar de abonnementenpagina geleid.':'Open het onderdeel van deze stap.';
      back.disabled=current===0;
      next.disabled=current===flow.steps.length-1;
      next.textContent=current===flow.steps.length-1?'Laatste stap':'Volgende stap';
      save();
    };
    for (const [id,flow] of Object.entries(flows)) {
      const b=make('button',flow.label,'secondary');
      b.type='button';
      b.dataset.guide=id;
      b.addEventListener('click',()=>{
        chosen=id;
        draw();
      });
      choices.appendChild(b);
    }
    back.addEventListener('click',()=>{
      steps[chosen]=Math.max(0,(Number(steps[chosen])||0)-1);
      draw();
    });
    next.addEventListener('click',()=>{
      steps[chosen]=Math.min(flows[chosen].steps.length-1,(Number(steps[chosen])||0)+1);
      draw();
    });
    go.addEventListener('click',()=>{
      const current=steps[chosen]||0;
      const step=flows[chosen].steps[current];
      const tab=step.tab;
      // De app beslist welke functies het ingelogde account mag openen.
      // Een vergrendelde functie leidt alleen naar de abonnementenpagina.
      const locked=typeof window.allbizUiTierAllowed==='function' && !window.allbizUiTierAllowed(tab);
      if(locked){
        if(typeof switchTab==='function') switchTab('plans');
        else document.querySelector('[data-tab="plans"]')?.click();
        return;
      }
      if (typeof switchTab==='function') switchTab(tab);
      else document.querySelector('[data-tab="'+tab+'"]')?.click();
      if(step.target)window.setTimeout(()=>{
        // De abonneecontrole kan de pagina ondertussen vergrendeld hebben.
        if(document.querySelector('.panel.active')?.id!==tab)return;
        if(step.openDetails){
          const editor=document.getElementById(step.openDetails);
          // Open alleen het bedoelde ontwerpformulier, nooit verborgen testmandjes.
          if(editor?.tagName==='DETAILS' && editor.id==='shopBuilderDetails')editor.open=true;
        }
        const target=document.getElementById(step.target);
        if(!target||!target.getClientRects().length)return;
        // Houd rekening met het vaste mobiele menu bovenaan het scherm.
        const mobile=document.querySelector('.mobile-feature-picker');
        const offset=mobile && getComputedStyle(mobile).display!=='none'
          ?mobile.getBoundingClientRect().height+18:18;
        const top=Math.max(0,Math.round(window.scrollY+target.getBoundingClientRect().top-offset));
        window.scrollTo({top,behavior:'smooth'});
      },400);
    });
    draw();
    // Rechtstreekse links tonen de gekozen gratis stappenhulp ook na navigatieherstel.
    if (urlGuide && window.location.hash==='#help') {
      const reveal=()=>{
        if (window.location.hash!=='#help') return;
        if (typeof switchTab==='function' && !panel.classList.contains('active'))
          switchTab('help',{automatic:true});
        if (!panel.classList.contains('active')) return;
        const nav=document.querySelector('.mobile-feature-picker');
        const offset=(nav && getComputedStyle(nav).display!=='none'
          ?nav.getBoundingClientRect().height:0)+16;
        const top=Math.max(0,window.scrollY+block.getBoundingClientRect().top-offset);
        window.scrollTo({top:Math.round(top),behavior:'auto'});
      };
      [250,900,1800,3200].forEach(ms=>window.setTimeout(reveal,ms));
    }
  };
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();