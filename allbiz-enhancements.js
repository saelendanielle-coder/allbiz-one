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
    '.abo-demo-badge{font-weight:700;font-size:13px;color:#77502b}';
  document.head.append(css);

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

  checkBtn.addEventListener('click', () => {
    const pages = savedPages().filter(p => p.visible && String(p.text || '').trim());
    const hasPage = expression => pages.some(p => expression.test(String(p.title || '')));
    const ownProducts = validProducts().filter(p => p.visibility !== 'draft' && !p.demoProduct && p.name && Number(p.price) > 0);
    const contact = $('siteEmail')?.value?.trim() || '';
    const checks = [
      [Boolean($('brand')?.value?.trim()), 'Bedrijfsnaam', 'Vul je bedrijfsnaam in bij Website & domein.'],
      [ownProducts.length > 0, 'Eigen producten en prijzen', 'Voeg een echt product met een prijs toe; voorbeeldproducten tellen niet mee.'],
      [/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact), 'Contact-e-mailadres', 'Vul een geldig contact-e-mailadres in bij Website & domein.'],
      [hasPage(/verzend|lever|shipping/i), 'Pagina over verzending', 'Maak onder de geavanceerde webshopbouwer een zichtbare verzendpagina.'],
      [hasPage(/retour|return|terugstuur/i), 'Pagina over retouren', 'Maak onder de geavanceerde webshopbouwer een zichtbare retourpagina.'],
      [false, 'Echte betalingen en orderverwerking', 'Stripe Connect voor klantwebshops is nog niet live. Gebruik alleen testbestellingen.'],
      [false, 'Webshop openbaar publiceren', 'De webshopbouwer is momenteel een privé-ontwerp en geen openbare verkoopwinkel.']
    ];
    checkList.replaceChildren();
    checks.forEach(([ready, title, missing]) => {
      const li = make('li');
      li.append(make('strong', (ready ? '✅ ' : '⬜ ') + title));
      li.append(make('small', ready ? 'Aanwezig in de demo.' : missing));
      checkList.append(li);
    });
    status.textContent = checks.filter(c => c[0]).length + ' van ' + checks.length + ' punten aanwezig. Dit geeft geen toestemming voor echte verkoop.';
  });

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

  if (typeof helpTopics !== 'undefined' && Array.isArray(helpTopics)) {
    helpTopics.unshift({
      keys: ['retour','terugsturen','terugbetaling','verzending','levering','pakket'],
      name: 'Verzending en retour', tab: 'shop',
      reply: 'Voorlopig zijn er alleen testbestellingen. Maak via de geavanceerde webshopbouwer zichtbare pagina’s voor verzending en retouren. Echte zendingen, retouren en terugbetalingen zijn nog niet beschikbaar.'
    });
  }
  const quick = $('allbizHelpQuick');
  if (quick) [
    ['📦 Verzending & retour', 'Hoe werken verzending en retouren?'],
    ['🧾 Testbestellingen', 'Waar kan ik mijn bestellingen bekijken?']
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