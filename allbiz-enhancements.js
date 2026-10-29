/* AllBiz One - veilige uitbreidingen voor hulp en webshopdemo, 26-10-2026. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const shop = $('shop'), help = $('help'), orders = $('orders');
  if (!shop || !help || !orders) return;

  const css = document.createElement('style');
  css.textContent = '.abo-check{border:1px solid #dcd3f3;background:#faf8ff;border-radius:15px;padding:16px;margin:18px 0}' +
    '.abo-check ul{list-style:none;padding:0;display:grid;gap:9px;margin:12px 0}' +
    '.abo-check li{border:1px solid #e9e3f5;background:white;border-radius:10px;padding:10px 12px}' +
    '.abo-check li small{display:block;color:#6f6680;margin-top:4px}' +
    '.abo-check button{margin:4px 8px 4px 0}' +
    '.abo-order-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin:12px 0}' +
    '.abo-order-actions select{width:auto;margin:0}.abo-order-actions button{padding:10px 13px}' +
    '.abo-demo-badge{font-weight:700;font-size:13px;color:#77502b}' +
    '.abo-check .abo-next{width:auto;max-width:100%;padding:9px 13px;font-size:14px;margin:9px 0 0;white-space:normal}' +
    '.abo-mobile-guide{border:1px solid #dcd3f3;background:#faf8ff;border-radius:15px;padding:16px;margin:14px 0}' +
    '.abo-mobile-guide h3{margin:0 0 8px}.abo-mobile-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}' +
    '.abo-mobile-actions button{min-height:48px;width:100%;padding:10px;font-size:14px;white-space:normal}' +
    '.abo-product-draft-note{margin:9px 0;font-size:13px}' +
    '@media(max-width:650px){.abo-mobile-actions{grid-template-columns:1fr}.abo-mobile-guide{padding:13px}.abo-mobile-actions button{font-size:15px}#productForm button[type="submit"]{width:100%;min-height:48px}#productForm input,#productForm textarea{font-size:16px}}';
  document.head.append(css);


  // Klanten- en beheerdersweergave. Geen gegevens van andere accounts ophalen.
  // Dit is presentatie; alle echte rechten blijven server-side met RLS gecontroleerd.
  const accountPanel = $('account');
  if (accountPanel && !$('allbizCustomerDashboard')) {
    const dashboardStyle = document.createElement('style');
    dashboardStyle.textContent =
      '#allbizCustomerDashboard,#allbizOwnerDashboard{margin:12px 0 18px;padding:18px;border:1px solid #ddd3f1;border-radius:16px;background:#faf8ff;color:#231a39}' +
      '#allbizCustomerDashboard h2,#allbizOwnerDashboard h2{margin:0 0 10px;font-size:21px}' +
      '.abo-dashboard-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:15px 0}' +
      '.abo-dashboard-links button{min-width:0;width:100%;min-height:48px;white-space:normal}' +
      '#allbizCustomerDashboard p,#allbizOwnerDashboard p{overflow-wrap:anywhere}' +
      '@media(max-width:650px){#allbizCustomerDashboard,#allbizOwnerDashboard{padding:13px}.abo-dashboard-links{grid-template-columns:1fr}}';
    document.head.append(dashboardStyle);

    const customer = document.createElement('section');
    customer.id = 'allbizCustomerDashboard';
    customer.setAttribute('aria-label','Mijn klantendashboard');
    const heading = document.createElement('h2');
    heading.textContent = '👤 Mijn klantendashboard';
    const welcome = document.createElement('p');
    welcome.id = 'allbizCustomerWelcome';
    welcome.setAttribute('role','status');
    welcome.textContent = 'Log in om je persoonlijke account te bekijken.';
    const plan = document.createElement('p');
    plan.id = 'allbizCustomerPlan';
    plan.textContent = 'Je abonnementsstatus verschijnt na het inloggen.';
    const links = document.createElement('div');
    links.className = 'abo-dashboard-links';
    const targets = [
      ['🎨 Mijn website','site'],
      ['🏪 Mijn webshop','shop'],
      ['📦 Mijn producten','products'],
      ['💎 Abonnement','plans'],
      ['💾 Reservekopie','dashboard'],
      ['🤖 Hulp nodig?','help']
    ];
    for (const [label,tab] of targets) {
      const button = document.createElement('button');
      button.type='button';
      button.className='secondary';
      button.textContent=label;
      button.addEventListener('click',() => {
        if (typeof switchTab === 'function') switchTab(tab);
        else document.querySelector('nav.nav button[data-tab="'+tab+'"]')?.click();
        if(tab==='dashboard'){
          window.setTimeout(()=>{
            if(!$('dashboard')?.classList.contains('active'))return;
            $('allbizBackupPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
          },230);
        }
      });
      links.append(button);
    }
    const note = document.createElement('p');
    note.className = 'small muted';
    note.textContent = 'Let op: sommige ontwerpen zijn nog alleen op dit toestel opgeslagen en niet per account gescheiden. Gebruik privé opslaan en reservekopieën. Deel dit toestel niet met andere klanten.';
    customer.append(heading,welcome,plan,links,note);
    accountPanel.insertBefore(customer,accountPanel.firstElementChild);

    const owner = document.createElement('section');
    owner.id='allbizOwnerDashboard';
    owner.hidden=true;
    owner.setAttribute('aria-label','Beheerdersdashboard');
    const ownerTitle=document.createElement('h2');
    ownerTitle.textContent='🛡️ Beheerdersdashboard';
    const ownerInfo=document.createElement('p');
    ownerInfo.textContent='Je eigenaarsrol is herkend. Het beveiligde klanten- en omzetoverzicht is nog niet aangesloten. Er worden hier geen klantgegevens of betalingen opgehaald.';
    const ownerNote=document.createElement('p');
    ownerNote.className='small muted';
    ownerNote.textContent='Beheeracties en klantstatistieken komen pas beschikbaar na afzonderlijke serverbeveiliging. In deze testversie kun je geen abonnementen van klanten wijzigen.';
    owner.append(ownerTitle,ownerInfo,ownerNote);
    customer.after(owner);

    let authBound=false;
    let lastView='';
    const paint = async () => {
      const auth=window.allbizAuth;
      if(!auth || typeof auth.getUser!=='function')return;
      try {
        const {data,error}=await auth.getUser();
        const user=error?null:data?.user;
        welcome.textContent=user?'✅ Ingelogd met: '+(user.email||'je account'):'Log in om je persoonlijke account te bekijken.';
        links.hidden=!user;
        note.hidden=!user;
        plan.textContent=user?
          ($('accountSubscriptionStatus')?.textContent||'Je abonnementsstatus wordt gecontroleerd.'):
          'Log eerst in om je abonnement te bekijken.';
        // Deze claim is door de Auth-server toegekend, niet door gebruiker-aanpasbare metadata.
        // Alleen een zichtbare beheerplaceholder; geen client-side autorisatie voor gevoelige data.
        owner.hidden=!(user?.app_metadata?.allbiz_role==='owner');
        lastView=user?.id||'';
      }catch(_){
        welcome.textContent='De inlogstatus kon niet gecontroleerd worden. Probeer opnieuw.';
        links.hidden=true;note.hidden=true;owner.hidden=true;
      }
    };
    links.hidden=true;
    note.hidden=true;
    // Koppel zodra de reeds aanwezige Supabase-login geladen is.
    let attempts=0;
    const waitForAuth=window.setInterval(()=>{
      attempts++;
      if(window.allbizAuth && !authBound){
        authBound=true;
        window.clearInterval(waitForAuth);
        window.allbizAuth.onAuthStateChange?.(()=>{
          // Laat de bestaande inlogstroom eerst afhandelen.
          window.setTimeout(()=>{void paint();},250);
        });
        void paint();
      }else if(attempts>=40){
        window.clearInterval(waitForAuth);
        welcome.textContent='Inloggen is nog niet beschikbaar. Controleer de status bij Mijn account.';
      }
    },350);
    const subscription=$('accountSubscriptionStatus');
    if(subscription) new MutationObserver(()=>{
      if(lastView) plan.textContent=subscription.textContent;
    }).observe(subscription,{subtree:true,childList:true,characterData:true});
  }

  const make = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const validProducts = () => {
    try {
      if (typeof items !== 'undefined' && Array.isArray(items)) return items;
      const parsed = JSON.parse(localStorage.getItem('business-studio-products-v2') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };
  const savedPages = () => {
    try {
      if (typeof builderData !== 'undefined' && Array.isArray(builderData.pages)) return builderData.pages;
    } catch {}
    return [];
  };
  const checker = make('section', undefined, 'abo-check');
  checker.id = 'aboShopChecklist';
  checker.append(make('h3', '✅ Is jouw webshop klaar voor klanten?'));
  checker.append(make('p', 'Controleer je producten, contactgegevens en verplichte informatie. De webshop blijft een demo; echte betalingen en publicatie worden niet gestart.', 'muted'));
  const checkBtn = make('button', '🔍 Controleer mijn webshop');
  checkBtn.type = 'button';
  const askBtn = make('button', '🤖 Vraag hulp aan AllBiz Assistent', 'secondary');
  askBtn.type = 'button';
  const status = make('p', 'Nog niet gecontroleerd.', 'muted');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const checkList = make('ul');
  checker.append(checkBtn, askBtn, status, checkList);
  const studio = shop.querySelector('.shop-studio');
  if (studio) studio.before(checker);
  else shop.querySelector('.card')?.append(checker);

  // De controle doet geen betalingen en publiceert niets: hij helpt alleen het ontwerp nalopen.
  const shippingTitle = /verzend|lever|shipping/i;
  const returnsTitle = /retour|return|terugstuur|herroep/i;
  const unfinishedText = /\[(?:vul in|controleer)\]|^\s*CONCEPT\b|verwijder alle invulvragen|vul onderstaande gegevens in/i;
  const inspectPage = title => {
    const candidates = savedPages().filter(p => title.test(String(p.title || '')));
    if (!candidates.length) return {ready:false, state:'missing'};
    if (candidates.some(p => p.visible && String(p.text || '').trim().length >= 30 &&
        !unfinishedText.test(String(p.text || '')))) return {ready:true, state:'visible'};
    return {ready:false, state:'draft'};
  };
  const goToField = (tab, field) => {
    if (typeof switchTab !== 'function') return;
    switchTab(tab);  // gebruikt de bestaande abonnementscontrole
    window.setTimeout(() => {
      if (!$(tab)?.classList.contains('active')) return;
      $(field)?.scrollIntoView({behavior:'smooth', block:'center'});
    }, 300);
  };
  const openPageEditor = pattern => {
    const matching = savedPages().find(p => pattern.test(String(p.title || '')));
    if (!matching) {
      starterPagesBtn.click();  // maakt uitsluitend verborgen, bewerkbare concepten
      return;
    }
    const details = $('shopBuilderDetails');
    if (details) details.open = true;
    const select = $('builderPageChoose');
    if (select) {
      select.value = matching.id;
      select.dispatchEvent(new Event('change', {bubbles:true}));
    }
    window.setTimeout(() => $('builderPageText')?.scrollIntoView({behavior:'smooth',block:'center'}),80);
  };
  const runShopCheck = () => {
    const ownProducts = validProducts().filter(p => p.visibility !== 'draft' &&
      !p.demoProduct && p.name && Number(p.price) > 0);
    const contact = $('siteEmail')?.value?.trim() || '';
    const shipping = inspectPage(shippingTitle), returns = inspectPage(returnsTitle);
    const pageHint = (check, label) => check.state === 'draft'
      ? 'Er is al een concept voor '+label+'. Controleer en vul alle tekst in voordat je het in de demo zichtbaar maakt.'
      : 'Maak of open een verborgen concept voor '+label+' in de geavanceerde webshopbouwer.';
    const checks = [
      {ready:Boolean($('brand')?.value?.trim()),name:'Bedrijfsnaam',
        hint:'Vul je bedrijfsnaam in bij Website & domein.',action:'✏️ Bedrijfsnaam invullen',
        go:()=>goToField('site','brand')},
      {ready:ownProducts.length > 0,name:'Eigen producten en prijzen',
        hint:'Voeg een echt product met een prijs toe; voorbeeldproducten tellen niet mee.',
        action:'🛍️ Product toevoegen',go:()=>goToField('products','product')},
      {ready:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact),name:'Contact-e-mailadres',
        hint:'Vul een geldig contact-e-mailadres in bij Website & domein.',
        action:'✉️ E-mailadres invullen',go:()=>goToField('site','siteEmail')},
      {ready:shipping.ready,name:'Pagina over verzending',
        hint:pageHint(shipping,'verzending'),action:shipping.state==='draft'?'📄 Verzendconcept openen':'📄 Concept maken',
        go:()=>openPageEditor(shippingTitle)},
      {ready:returns.ready,name:'Pagina over retouren',
        hint:pageHint(returns,'retouren'),action:returns.state==='draft'?'📄 Retourconcept openen':'📄 Concept maken',
        go:()=>openPageEditor(returnsTitle)},
      {ready:false,name:'Echte betalingen en orderverwerking',
        hint:'Stripe Connect voor klantwebshops is nog niet live. Gebruik alleen testbestellingen.'},
      {ready:false,name:'Webshop openbaar publiceren',
        hint:'Dit is een privé-ontwerp. De checklist zet geen winkel openbaar.'}
    ];
    checkList.replaceChildren();
    for (const check of checks) {
      const li = make('li');
      li.append(make('strong', (check.ready?'✅ ':'⬜ ')+check.name));
      li.append(make('small', check.ready?'Aanwezig in de demo (niet juridisch of technisch gecertificeerd).':check.hint));
      if (!check.ready && check.go) {
        const button = make('button', check.action, 'secondary abo-next');
        button.type='button';
        button.addEventListener('click', check.go);
        li.append(button);
      }
      checkList.append(li);
    }
    status.textContent=checks.filter(x=>x.ready).length+' van '+checks.length+
      ' controlepunten aanwezig. Echte verkoop blijft uitgeschakeld; controleer de inhoud voordat je iets zichtbaar maakt.';
  };
  checkBtn.addEventListener('click', runShopCheck);

  // Mobiele snelstart: bestaande opslag- en navigatieknoppen hergebruiken.
  const mobileGuide = make('section', undefined, 'abo-mobile-guide');
  mobileGuide.id = 'allbizMobileShopGuide';
  mobileGuide.append(
    make('h3', '📱 Snel verder met je webshop'),
    make('p', 'Voeg een product toe of bewaar je ontwerp zonder te zoeken. De winkel blijft een demo.', 'muted')
  );
  const mobileActions = make('div', undefined, 'abo-mobile-actions');
  const mobileMessage = make('p', 'Tip: bewerk je een extra pagina of collectie? Druk daar eerst op Bewaren.', 'muted');
  mobileMessage.setAttribute('role', 'status');
  mobileMessage.setAttribute('aria-live', 'polite');
  const addMobileAction = (text, action) => {
    const button = make('button', text, 'secondary');
    button.type = 'button';
    button.addEventListener('click', action);
    mobileActions.append(button);
    return button;
  };
  addMobileAction('➕ Product toevoegen', () => {
    if (typeof switchTab !== 'function') return;
    switchTab('products'); // behoudt de bestaande abonnementstoegang
    window.setTimeout(() => {
      if (!$('products')?.classList.contains('active')) return;
      $('product')?.scrollIntoView({behavior:'smooth', block:'center'});
      mobileMessage.textContent = 'Vul je productnaam en prijs in. Je tekstconcept blijft in dit tabblad bewaard.';
    }, 260);
  });
  addMobileAction('💾 Op dit toestel bewaren', () => {
    const button = $('shopSaveDesign');
    if (!button) return;
    button.click();
    mobileMessage.textContent = $('shopDesignStatus')?.textContent || 'Controleer de opslagmelding bij je ontwerp.';
    $('shopDesignStatus')?.scrollIntoView({behavior:'smooth',block:'center'});
  });
  addMobileAction('☁️ Privé in mijn account bewaren', () => {
    const button = $('shopCloudSave');
    if (!button || button.disabled) {
      mobileMessage.textContent = 'Privé opslaan is nog bezig. Controleer de melding bij Bewaar webshopontwerp privé.';
      return;
    }
    button.click(); // bestaande beveiligde Supabase-opslag en RLS blijven ongewijzigd
    mobileMessage.textContent = 'Controleer hieronder of privé opslaan gelukt is. Log eerst in als daarom gevraagd wordt.';
    $('shopCloudStatus')?.scrollIntoView({behavior:'smooth',block:'center'});
  });
  mobileGuide.append(mobileActions, mobileMessage);
  checker.before(mobileGuide);

  // Ingevulde productteksten blijven alleen in het huidige browsertabblad.
  // GEEN bestanden, foto's, leverancierslinks of betaal-/accountgegevens bewaren.
  const productForm = $('productForm');
  if (productForm && typeof sessionStorage !== 'undefined') {
    const draftKey = 'allbiz-one-product-concept-tab-v1';
    const fieldIds = ['product','price','productDescription','productCategory','cost','shipping','stock'];
    const draftStatus = make('p',
      '📝 Productconcept: tekst wordt tijdelijk in dit tabblad bewaard. Foto’s en bestanden moet je opnieuw kiezen.',
      'muted abo-product-draft-note');
    draftStatus.setAttribute('role','status');
    draftStatus.setAttribute('aria-live','polite');
    const saveButton = productForm.querySelector('button[type="submit"]');
    if (saveButton) saveButton.before(draftStatus);
    const currentType = () => document.querySelector('input[name="type"]:checked')?.value === 'digital'
      ? 'digital' : 'physical';
    const persistDraft = () => {
      try {
        const fields = {};
        for (const id of fieldIds) fields[id] = String($(id)?.value || '').slice(0,1200);
        const hasText = Object.values(fields).some(v => v.trim().length);
        if (!hasText) {
          sessionStorage.removeItem(draftKey);
          return;
        }
        sessionStorage.setItem(draftKey, JSON.stringify({type:currentType(), fields}));
        draftStatus.textContent = '✅ Concept tijdelijk bewaard in dit tabblad. Foto’s, bestanden en leverancierlinks worden niet onthouden.';
      } catch {
        draftStatus.textContent = '⚠️ Dit toestel kan het concept niet tijdelijk bewaren. Bewaar je product nu.';
      }
    };
    try {
      const data = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (data && data.fields && typeof data.fields === 'object') {
        for (const id of fieldIds) {
          if (typeof data.fields[id] === 'string' && $(id)) $(id).value = data.fields[id].slice(0,1200);
        }
        const radio = document.querySelector('input[name="type"][value="'+
          (data.type === 'digital' ? 'digital' : 'physical')+'"]');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change',{bubbles:true}));
        }
        draftStatus.textContent = '✅ Je vorige productconcept is teruggezet. Selecteer foto’s en bestanden opnieuw.';
      }
    } catch {
      draftStatus.textContent = 'Je kunt opnieuw een product invullen. Oude tijdelijke gegevens zijn niet leesbaar.';
    }
    productForm.addEventListener('input', persistDraft);
    productForm.addEventListener('change', persistDraft);
    document.querySelectorAll('input[name="type"]').forEach(radio =>
      radio.addEventListener('change', persistDraft));
    // De bestaande product-opslag roept reset() alleen na een geslaagde opslag aan.
    // Zo wissen we het concept NIET bij een fout, maar wel nadat het product bewaard is.
    productForm.addEventListener('reset', () => {
      try { sessionStorage.removeItem(draftKey); } catch {}
      draftStatus.textContent = '✅ Productformulier geleegd. Je kunt nu een nieuw product toevoegen.';
    });
  }

  // Maak bewerkbare CONCEPT-pagina's. Nooit bestaande teksten vervangen of automatisch publiceren.
  const starterPagesBtn = make('button', '📄 Maak verzend- en retourconcepten', 'secondary');
  starterPagesBtn.type = 'button';
  starterPagesBtn.setAttribute('aria-describedby', 'aboTemplateNotice');
  const templateNote = make('p', 'Er worden alleen verborgen concepten gemaakt. Vul zelf de juiste gegevens in en zet ze daarna zichtbaar in de webshopdemo. Dit zijn geen juridisch gecontroleerde voorwaarden.', 'muted');
  templateNote.id = 'aboTemplateNotice';
  checker.insertBefore(starterPagesBtn, status);
  checker.insertBefore(templateNote, status);
  starterPagesBtn.addEventListener('click', () => {
    if (typeof builderData === 'undefined' || !Array.isArray(builderData.pages) ||
        typeof builderChanged !== 'function' || typeof newId !== 'function') {
      status.textContent = 'De webshopbouwer is nog niet geladen. Vernieuw de pagina en probeer opnieuw.';
      return;
    }
    const templates = [
      {
        title: 'Verzending',
        exists: /verzend|lever|shipping/i,
        text: [
          'CONCEPT — vul onderstaande gegevens in voordat je deze pagina toont.',
          'Vanuit welk land worden producten verzonden? [vul in]',
          'In welke landen lever je? [vul in]',
          'Wat zijn je werkelijke verwerkings- en levertijden? [vul in]',
          'Wat kost standaard- en eventuele expressverzending? [vul in]',
          'Hoe kan een klant de bestelling volgen? [vul in]',
          'Wat gebeurt er bij vertraging of een niet ontvangen pakket? [vul in]',
          'Contact voor vragen over verzending: [vul in]',
          'Verwijder alle invulvragen voordat je dit publiceert.'
        ].join('\n')
      },
      {
        title: 'Retouren en herroepingsrecht',
        exists: /retour|return|terugstuur|herroep/i,
        text: [
          'CONCEPT — pas dit aan jouw producten en de toepasselijke consumentenregels aan.',
          'Hoe meldt een klant een retour of herroeping? [vul in]',
          'Naar welk adres kan een retour worden gestuurd? [vul in]',
          'Wie betaalt de retourkosten en in welke gevallen? [vul in]',
          'Wanneer en via welke betaalmethode wordt een terugbetaling verwerkt? [vul in]',
          'Welke productcategorieën vereisen speciale informatie of wettelijke uitzonderingen? [controleer]',
          'Vermeld de wettelijk toepasselijke termijnen en voorwaarden pas na controle.',
          'Contact bij problemen: [vul in]',
          'Verwijder alle invulvragen en laat je beleid juridisch controleren voordat je verkoopt.'
        ].join('\n')
      }
    ];
    const missing = templates.filter(t => !builderData.pages.some(p => t.exists.test(String(p.title || ''))));
    if (!missing.length) {
      status.textContent = 'Je hebt al verzend- en retourpagina’s. Open de geavanceerde webshopbouwer om ze na te kijken.';
    } else if (builderData.pages.length + missing.length > 12) {
      status.textContent = 'Je hebt het maximum van 12 extra pagina’s bereikt. Verwijder eerst ongebruikte concepten.';
      return;
    } else {
      const created = missing.map(t => ({id:newId(),title:t.title,text:t.text,visible:false}));
      builderData.pages.push(...created);
      try {
        builderChanged('✅ Verborgen conceptpagina’s voor verzending en retouren toegevoegd.');
      } catch (error) {
        builderData.pages.splice(-created.length);
        status.textContent = 'Concepten konden niet worden opgeslagen. Probeer opnieuw.';
        return;
      }
      status.textContent = created.length + ' verborgen conceptpagina(’s) toegevoegd. Pas de tekst aan en zet ze zichtbaar in het menu wanneer ze volledig kloppen.';
    }
    const details = $('shopBuilderDetails');
    if (details) details.open = true;
    const chooser = $('builderPageChoose');
    const match = builderData.pages.find(p => /verzend|lever|shipping/i.test(p.title)) || builderData.pages[0];
    if (chooser && match) {
      chooser.value = match.id;
      chooser.dispatchEvent(new Event('change', {bubbles:true}));
    }
    details?.scrollIntoView({behavior:'smooth',block:'start'});
  });

  askBtn.addEventListener('click', () => {
    if (typeof switchTab === 'function') switchTab('help');
    if (typeof answerHelp === 'function') answerHelp('Hoe maak ik een webshop?');
    if (typeof addHelpMessage === 'function') addHelpMessage('Stap 1: Open Mijn webshop en controleer de checklist.\nStap 2: Vul producten, contactinformatie, verzend- en retourpagina in.\nStap 3: Probeer Test afrekenen. Een echte webshopcheckout is nog niet beschikbaar.', false);
  });

  // AllBiz Free Help v2: vaste, gratis antwoorden. Geen externe AI of betaalde API.
  if (typeof helpTopics !== 'undefined' && Array.isArray(helpTopics)) {
    helpTopics.unshift(...[
      {
        keys: ['wachtwoord vergeten','wachtwoord resetten','herstelmail','kan niet inloggen','inloggen lukt niet'],
        name: 'Wachtwoord herstellen', tab: 'account',
        reply: 'Open Mijn account. Vul je e-mailadres in en kies Wachtwoord vergeten of Wachtwoord herstellen. Controleer je inbox en je spammap. Open de herstelmail en kies een nieuw wachtwoord. Deel geen wachtwoorden of herstelcodes.'
      },
      {
        keys: ['testbestellingen','testbestelling','mijn bestellingen bekijken','bestelstatus','testorder','test afrekenen'],
        name: 'Testbestellingen bekijken', tab: 'orders',
        reply: 'Open Voorraad & testbestellingen. Daar vind je je TEST-bestellingen en hun status. Je kunt de status aanpassen en testgegevens exporteren. Het gaat niet om echte betalingen, leveringen of klantbestellingen.'
      },
      {
        keys: ['webshop controleren','controleer mijn webshop','webshop checklist','klaar voor klanten','webshop klaar'],
        name: 'Webshop controleren', tab: 'shop',
        reply: 'Open Mijn webshop en kies Controleer mijn webshop. Controleer je bedrijfsnaam, eigen producten, prijzen, contact-e-mailadres en informatiepagina’s. Ook wanneer de checklist grotendeels groen is, blijven echte webshopbetalingen en publicatie nog uitgeschakeld.'
      },
      {
        keys: ['product toevoegen','producten toevoegen','product aanmaken','prijs instellen','productprijs'],
        name: 'Product toevoegen', tab: 'products',
        reply: 'Open Producten. Voeg een productnaam, beschrijving en prijs toe en bewaar de wijzigingen. Controleer daarna de weergave in Mijn webshop. Dit is een demo: er worden geen echte bestellingen naar leveranciers gestuurd.'
      },
      {
        keys: ['verzendkosten','verzendpagina','verzendbeleid','levertijd','bezorging','verzendinformatie'],
        name: 'Verzendinformatie', tab: 'shop',
        reply: 'Open Mijn webshop → Geavanceerde webshopbouwer en kijk bij extra pagina’s naar Verzending. Vul alleen verzendkosten, landen en levertijden in die je daadwerkelijk kunt aanbieden. Houd de pagina verborgen totdat je gegevens kloppen. De webshop verstuurt nog geen echte pakketten.'
      },
      {
        keys: ['retourtermijn','retourpagina','herroepingsrecht','retourbeleid','omruilen','geld terug'],
        name: 'Retourinformatie', tab: 'shop',
        reply: 'Open Mijn webshop → Geavanceerde webshopbouwer → extra pagina’s en bewerk de verborgen retourpagina. Controleer je werkelijke retourprocedure en toepasselijke consumentenregels voordat je publiceert. De demo verwerkt geen echte retouren of terugbetalingen.'
      },
      {
        keys: ['domeinnaam','eigen domein','dns','website publiceren','site publiceren','website online zetten'],
        name: 'Domein en publicatie', tab: 'site',
        reply: 'Ga naar Website & domein, vul je bedrijfsgegevens in en bewaar het ontwerp. Een domeinnaam invoeren reserveert die naam niet. De voorbeeldwebsite is niet automatisch een openbaar gepubliceerde klantensite. Controleer domein, hosting en publicatie apart.'
      },
      {
        keys: ['gegevens verdwenen','ontwerp kwijt','wijzigingen kwijt','pagina opnieuw','alles opnieuw invullen','ontwerp bewaren','gegevens opslaan'],
        name: 'Ontwerp bewaren', tab: 'shop',
        reply: 'Bewaar je webshopontwerp eerst via de opslagknoppen in Mijn webshop. Sommige voorbeeldgegevens staan alleen op het huidige toestel of in deze browser. Gebruik Open bewaard webshopontwerp voor een eerder opgeslagen privéontwerp. Wis je browsergegevens niet voordat je weet dat alles bewaard is.'
      },
      {
        keys: ['abonnement niet actief','geen betaald abonnement','testabonnement','betaling gelukt','betaalstatus','mijn abonnement controleren'],
        name: 'Abonnementsstatus', tab: 'account',
        reply: 'Ga naar Mijn account en controleer je abonnementsstatus. Een geslaagde TEST-betaling is geen echt betaald abonnement. Staat er geen betaald abonnement, betaal dan niet opnieuw zonder eerst de status en Stripe-betaling te controleren.'
      },
      {
        keys: ['welk abonnement','verschil tussen starter','verschil tussen pro','verschil tussen business','abonnement kiezen'],
        name: 'Abonnement kiezen', tab: 'plans',
        reply: 'Open Abonnementen voor de actuele pakketten en prijzen. Vergelijk de functies per pakket en kijk welke onderdelen al echt werken. Een testabonnement en een echt betaald abonnement zijn verschillend. De externe AI-chat is nog niet actief.'
      },
      {
        keys: ['youtube video maken','youtube-video maken','shorts maken','video uploaden','video downloaden'],
        name: 'YouTube-video maken', tab: 'video',
        reply: 'Open YouTube-video’s, maak een concept met tekst en eigen materiaal en bekijk het voorbeeld. Download het resultaat wanneer deze optie beschikbaar is. Upload je video daarna zelf op YouTube. AllBiz One plaatst nog geen video’s automatisch.'
      },
      {
        keys: ['google ads campagne','facebook reclame','tiktok advertentie','advertentiebudget','advertentie plaatsen','reclame maken'],
        name: 'Gratis marketinghulp', tab: 'ads',
        reply: 'Open Advertenties & groei. Je kunt advertentieteksten en campagnevoorstellen voorbereiden zonder een betaalde AI-koppeling. Publiceren op Google, Meta of TikTok gebeurt niet automatisch. Controleer je budget vóór je een advertentie live zet.'
      },
      {
        keys: ['api sleutel','api-sleutel','gratis ai','echte ai','ai chat','ai-chat','waarom werkt ai niet'],
        name: 'AI zonder extra kosten', tab: 'help',
        reply: 'De gewone AllBiz Hulp-assistent met vaste antwoorden is gratis te gebruiken. De aparte echte AI-chat is nog uitgeschakeld omdat daarvoor een beveiligde API-koppeling met mogelijke kosten nodig is. Deel nooit een API-sleutel in de chat of op een openbare pagina.'
      },
      {
        keys: ['bestellen als klant','kan klant betalen','echte webshopbetaling','checkout live','stripe connect'],
        name: 'Echte webshopbetalingen', tab: 'shop',
        reply: 'De winkelwagen en afrekenstappen in Mijn webshop zijn momenteel demonstraties. Echte webshopbetalingen en automatische orderverwerking zijn niet actief. Gebruik alleen testbestellingen tot de betaalstroom gecontroleerd en veilig gepubliceerd is.'
      }
    ]);
  }
  const quick = $('allbizHelpQuick');
  if (quick) [
    ['📦 Verzending & retour', 'Hoe werken verzending en retouren?'],
    ['🧾 Testbestellingen', 'Waar kan ik mijn testbestellingen bekijken?'],
    ['🔑 Wachtwoord vergeten', 'Ik ben mijn wachtwoord vergeten'],
    ['🛍️ Product toevoegen', 'Hoe kan ik een product toevoegen?'],
    ['✅ Webshopcheck', 'Hoe kan ik mijn webshop controleren?'],
    ['💾 Ontwerp bewaren', 'Hoe kan ik mijn ontwerp bewaren?'],
    ['🌐 Domein & publiceren', 'Hoe kan ik mijn website publiceren?'],
    ['✨ Gratis AI-hulp', 'Waarom werkt echte AI nog niet?']
  ].forEach(([label, question]) => {
    const button = make('button', label, 'secondary');
    button.type = 'button';
    button.dataset.q = question;
    quick.append(button);
  });
  const ordersList = $('demoOrderList');
  if (ordersList) {
    const actions = make('div', undefined, 'abo-order-actions');
    const label = make('label', 'Filter testorders:');
    const filter = make('select');
    filter.id = 'aboDemoOrderFilter';
    ['Alle','Nieuw','In behandeling','Verzonden (test)','Afgerond (test)','Geannuleerd (test)'].forEach(x => {
      const option = make('option', x); option.value = x; filter.append(option);
    });
    label.htmlFor = filter.id;
    const exportBtn = make('button', '📥 Testorders exporteren (CSV)', 'secondary');
    exportBtn.type = 'button';
    actions.append(label, filter, exportBtn, make('span', 'Alleen testgegevens', 'abo-demo-badge'));
    ordersList.before(actions);
    const applyFilter = () => {
      let shown = 0;
      ordersList.querySelectorAll('.demo-order').forEach(card => {
        const orderStatus = card.querySelector('select')?.value || 'Nieuw';
        card.hidden = filter.value !== 'Alle' && filter.value !== orderStatus;
        if (!card.hidden) shown++;
      });
      exportBtn.disabled = ordersList.querySelectorAll('.demo-order').length === 0;
    };
    filter.addEventListener('change', applyFilter);
    ordersList.addEventListener('change', e => {
      if (e.target.matches('select')) applyFilter();
    });
    new MutationObserver(applyFilter).observe(ordersList, {childList:true});
    applyFilter();
    exportBtn.addEventListener('click', () => {
      let data = [];
      try { if (typeof demoOrders !== 'undefined' && Array.isArray(demoOrders)) data = demoOrders; } catch {}
      if (!data.length) return;
      const csvCell = value => {
        let s = String(value ?? '');
        if (/^\s*[=+@-]/.test(s)) s = "'" + s;
        return '"' + s.replace(/"/g, '""') + '"';
      };
      const rows = [['Testnummer','Datum','Status','Product','Aantal','Prijs EUR','Regeltotaal EUR','Opmerking']];
      data.forEach(o => (o.lines || []).forEach(line => {
        rows.push([o.number, o.when, o.status || 'Nieuw', line.name, line.qty,
          Number(line.price || 0).toFixed(2), (Number(line.price || 0) * Number(line.qty || 0)).toFixed(2),
          'TEST - geen echte betaling']);
      }));
      const blob = new Blob(['\uFEFF' + rows.map(r => r.map(csvCell).join(';')).join('\r\n')], {type:'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = make('a');
      link.href = url; link.download = 'allbiz-testbestellingen.csv';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      const msg = $('demoOrderMessage');
      if (msg) msg.textContent = '✅ CSV gedownload. Dit zijn uitsluitend testbestellingen.';
    });
  }
})();