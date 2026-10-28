/* AllBiz One — gratis, lokale stappenhulp. Geen betaalde API, geen echte AI. */
(() => {
  'use strict';
  const init = () => {
    const panel = document.getElementById('help');
    if (!panel || document.getElementById('allbizGuidedHelp')) return;

    const flows = {
      website: {
        label: '🌐 Website maken',
        about: 'Bouw je bedrijfswebsite stap voor stap.',
        steps: [
          {title:'Vul je bedrijf in', detail:'Open Website & domein. Vul je bedrijfsnaam, beschrijving, diensten en contactgegevens in.', tab:'site', action:'Open Website & domein'},
          {title:'Kies een ontwerp', detail:'Kies een thema en bekijk de websitepreview. Je kunt teksten later aanpassen.', tab:'site', action:'Bekijk het ontwerp'},
          {title:'Bewaar je website', detail:'Bewaar het ontwerp op dit toestel en download desgewenst de voorbeeldwebsite. Een echte domeinregistratie of publicatie gebeurt niet automatisch.', tab:'site', action:'Ga naar bewaren en downloaden'}
        ]
      },
      webshop: {
        label: '🛍️ Webshop maken',
        about: 'Bereid je webshop voor met producten en een voorbeeldwinkel.',
        steps: [
          {title:'Voeg je producten toe', detail:'Open Producten en vul naam, prijs en beschrijving in. Bewaar je wijzigingen.', tab:'products', action:'Open Producten'},
          {title:'Ontwerp de winkel', detail:'Open Mijn webshop, kies het thema en bekijk je producten in het winkelvoorbeeld.', tab:'shop', action:'Open Mijn webshop'},
          {title:'Controleer je winkel', detail:'Gebruik Controleer mijn webshop en bekijk verzending, retouren en contact. De afrekening is nog een test; er worden geen echte bestellingen verwerkt.', tab:'shop', action:'Controleer mijn webshop'}
        ]
      },
      marketing: {
        label: '📣 Reclame maken',
        about: 'Maak gratis advertentievoorstellen voor je bedrijf.',
        steps: [
          {title:'Kies wat je promoot', detail:'Ga naar Advertenties & groei. Kies je kanaal en product of dienst.', tab:'ads', action:'Open Advertenties & groei'},
          {title:'Schrijf je advertentie', detail:'Vul de gevraagde informatie in en maak een tekstvoorstel. Controleer alle claims voordat je de tekst gebruikt.', tab:'ads', action:'Maak een advertentieconcept'},
          {title:'Controleer je budget', detail:'Bekijk het budget en download of kopieer je voorstel. AllBiz One plaatst nog geen echte advertenties en geeft geen gegarandeerde resultaten.', tab:'ads', action:'Bekijk het advertentieplan'}
        ]
      },
      affiliate: {
        label: '🔗 Affiliate marketing',
        about: 'Maak een promotietekst met je eigen partnerlink.',
        steps: [
          {title:'Kies een affiliateproduct', detail:'Open Affiliate marketing. Voeg alleen een echte partnerlink toe waarvoor je bij een affiliateprogramma bent toegelaten.', tab:'affiliate', action:'Open Affiliate marketing'},
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
    const intro=make('p','Kies een onderwerp. Ik toon je wat je moet doen en breng je naar de juiste pagina. Deze gratis hulp werkt zonder betaalde AI.','muted');
    const choices=make('div',undefined,'abo-guide-choices');
    choices.setAttribute('role','group');
    choices.setAttribute('aria-label','Kies een stappenplan');
    const detail=make('div',undefined,'abo-guide-detail');
    const description=make('p','', 'muted');
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
    detail.append(description,progress,stepTitle,stepText,actions);
    const privacy=make('p','Je voortgang wordt alleen op dit toestel bewaard. Dit is een stappenhulp met vaste uitleg; de aparte echte AI-chat is nog niet actief.','small muted');
    block.append(heading,intro,choices,detail,privacy);
    panel.insertBefore(block,panel.firstElementChild);

    const key='allbiz-guided-help-v1';
    let saved=null;
    try { saved=JSON.parse(localStorage.getItem(key)||'null'); } catch {}
    let chosen=saved&&Object.prototype.hasOwnProperty.call(flows,saved.flow)?saved.flow:'website';
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
      progress.textContent='Stap '+(current+1)+' van '+flow.steps.length;
      stepTitle.textContent=step.title;
      stepText.textContent=step.detail;
      go.textContent=step.action;
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
      const tab=flows[chosen].steps[current].tab;
      // Gebruik de bestaande abonnementscontrole; activeer nooit verborgen functies.
      if (typeof switchTab==='function') switchTab(tab);
      else document.querySelector('[data-tab="'+tab+'"]')?.click();
    });
    draw();
  };
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();