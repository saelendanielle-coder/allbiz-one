/* AllBiz One: lokale concepten voor affiliatecampagnes. Geen externe publicatie. */
(() => {
  'use strict';
  const init = () => {
    const section = document.getElementById('aboAffiliateCampaign');
    const channel = document.getElementById('aboAffChannel');
    const note = document.getElementById('aboAffNote');
    const draft = document.getElementById('aboAffDraft');
    const status = section?.querySelector('[role="status"]');
    const product = document.getElementById('affiliateSelect');
    const actions = section?.querySelector('.abo-actions');
    if (!section || !channel || !note || !draft || !status || !actions ||
        document.getElementById('aboAffSaveDraft')) return;
    const storageKey = 'allbiz-affiliate-campaign-draft-v1';
    const choice = () => product?.value || '';
    const update = (msg) => { status.textContent = msg; };
    const saveDraft = (notify = false) => {
      try {
        const value = {
          channel: channel.value,
          note: note.value.slice(0, 220),
          text: draft.value.slice(0, 8000),
          productId: choice(),
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(value));
        if (notify) update('✅ Concept bewaard op dit toestel. Het is nog niet online gepubliceerd.');
        return true;
      } catch {
        if (notify) update('⚠️ Bewaren is mislukt. Controleer of je browser opslag toestaat.');
        return false;
      }
    };
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); }
      catch { return null; }
    })();
    if (stored && typeof stored === 'object') {
      if ([...channel.options].some(o => o.value === stored.channel)) channel.value = stored.channel;
      if (typeof stored.note === 'string') note.value = stored.note.slice(0, 220);
      if (typeof stored.text === 'string') draft.value = stored.text.slice(0, 8000);
      if (stored.productId && product &&
          [...product.options].some(o => o.value === stored.productId)) product.value = stored.productId;
      if (draft.value.trim() || note.value.trim())
        update('📝 Je laatst bewaarde concept is hersteld. Controleer of de gekozen partnerlink nog klopt.');
    }
    let timer;
    const queueSave = () => {
      clearTimeout(timer);
      timer = setTimeout(() => saveDraft(), 250);
    };
    channel.addEventListener('change', queueSave);
    note.addEventListener('input', queueSave);
    draft.addEventListener('input', queueSave);
    product?.addEventListener('change', () => {
      update('Je hebt een ander product gekozen. Maak een nieuw affiliatebericht zodat de juiste partnerlink erin staat.');
    });
    const makeButton = (id, label, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.id = id;
      b.className = 'secondary';
      b.textContent = label;
      b.addEventListener('click', fn);
      return b;
    };
    const generate = [...actions.querySelectorAll('button')].find(b => b.textContent.includes('Maak affiliatebericht'));
    generate?.addEventListener('click', () => { if (draft.value.trim()) saveDraft(); });
    // De test maakt alleen een fictief concept. Geen nep-partnerlink in echte productlijsten.
    const demoText = [
      '🧪 TESTVOORBEELD — FICTIEF PRODUCT — NIET PUBLICEREN',
      '🎧 Draadloze koptelefoon (fictief voorbeeld)',
      'Een voorbeeld van een korte Instagram-post over een draadloze koptelefoon. Vergelijk altijd de echte eigenschappen en prijs bij de verkoper.',
      'Er is GEEN echte affiliatelink gekoppeld. Dit voorbeeld levert GEEN commissie op.',
      'Advertentie / affiliate: als ik later een geldige partnerlink plaats, kan ik commissie ontvangen bij een aankoop.',
      'Om echt te publiceren: voeg eerst een bestaand product en je eigen goedgekeurde partnerlink toe.'
    ].join('\n\n');
    const fillDemo = (automatic = false) => {
      if (draft.value.trim()) {
        if (automatic) return;
        if (!window.confirm('Je bestaande promotietekst vervangen door een fictief testvoorbeeld?')) return;
      }
      draft.value = demoText;
      saveDraft();
      update('🧪 Fictief voorbeeld ingevuld en op dit toestel bewaard. Er is geen echt affiliateproduct of partnerlink toegevoegd.');
    };
    // Zichtbaar testvoorbeeld direct bovenaan Affiliate marketing.
    // Dit is bewust geen echt product of affiliate-link en wordt niet gepubliceerd.
    const demoPanel=document.createElement('section');
    demoPanel.id='aboAffiliateDemoPreview';
    demoPanel.className='card';
    demoPanel.style.cssText='border:2px solid #ac9ce9;background:#faf8ff;scroll-margin-top:160px';
    const demoHeading=document.createElement('h3');
    demoHeading.textContent='🎧 Voorbeeld: zo werkt affiliate marketing';
    const demoInfo=document.createElement('p');
    demoInfo.textContent='Dit is een fictief promotiebericht. Je hoeft niets in te vullen of te betalen.';
    const demoPreview=document.createElement('p');
    demoPreview.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7;background:white;border:1px solid #d7ccf6;border-radius:12px;padding:12px';
    demoPreview.textContent='🧪 TEST — GEEN ECHTE AFFILIATE-LINK\\n\\n🎧 Draadloze koptelefoon\\n\\nOntdek een draadloze koptelefoon en vergelijk het aanbod van verschillende winkels.\\n\\nOm commissie te verdienen, heb je later een eigen goedgekeurde partnerlink nodig. Dit voorbeeld verdient niets.';
    const demoAction=makeButton('aboAffUseExample','✨ Zet voorbeeld in mijn promotietekst',()=>{
      fillDemo();
      draft.scrollIntoView({behavior:'smooth',block:'center'});
    });
    demoPanel.append(demoHeading,demoInfo,demoPreview,demoAction);
    const affiliatePage=document.getElementById('affiliate');
    if (affiliatePage) affiliatePage.insertBefore(demoPanel,affiliatePage.firstElementChild);
    actions.prepend(makeButton('aboAffTryExample', '🧪 Test voorbeeldbericht', () => fillDemo()));
    actions.append(
      makeButton('aboAffSaveDraft', '💾 Bewaar concept', () => saveDraft(true)),
      makeButton('aboAffDownloadDraft', '⬇️ Download tekst', () => {
        const text = draft.value.trim();
        if (!text) { update('Maak eerst een promotietekst om te downloaden.'); return; }
        const file = new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'allbiz-affiliatebericht.txt';
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        saveDraft();
        update('✅ Het tekstbestand is klaargezet voor downloaden. Publicatie gebeurt niet automatisch.');
      }),
      makeButton('aboAffClearDraft', '🗑️ Wis concept', () => {
        if (!window.confirm('Je bewaarde affiliateconcept en ingevulde promotietekst wissen?')) return;
        clearTimeout(timer);
        try { localStorage.removeItem(storageKey); } catch {}
        note.value = '';
        draft.value = '';
        update('Concept gewist op dit toestel. Je affiliateproducten zijn behouden.');
      })
    );
    // Alleen op expliciet geopende demokoppeling, zonder bestaande inhoud te overschrijven.
    try {
      if (new URLSearchParams(window.location.search).get('affiliateDemo') === '1')
        fillDemo(true);
    } catch {}
    // De directe voorbeeldlink springt naar de zichtbare uitleg in plaats van een leeg tekstvak.
    try {
      if (new URLSearchParams(location.search).get('affiliateDemo')==='1') {
        const jump=()=>{
          if(!affiliatePage?.classList.contains('active'))return;
          const top=Math.max(0,window.scrollY+demoPanel.getBoundingClientRect().top-170);
          window.scrollTo({top,behavior:'auto'});
        };
        setTimeout(jump,1200);
        setTimeout(jump,2200);
      }
    } catch {}
    const privacy = document.createElement('p');
    privacy.className = 'small muted';
    privacy.textContent = 'Je concept wordt alleen in deze browser bewaard. Op een andere gsm of laptop is het niet automatisch beschikbaar. Publicatie en commissie-uitbetaling gebeuren niet via deze knoppen.';
    section.append(privacy);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();