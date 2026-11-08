/* AllBiz One — duidelijke, veilige webshop-paginabouwer.
   Hergebruikt de bestaande ontwerpfunctie; start nooit betalingen. */
(() => {
  'use strict';

  function init() {
    const byId = id => document.getElementById(id);
    const shop = byId('shop');
    const legacy = byId('allbizShopPractice');
    const builder = byId('shopBuilderDetails');
    const preview = byId('shopPreview');
    const cloudSave = byId('shopCloudSave');
    const cloudLoad = byId('shopCloudLoad');
    const cloudStatus = byId('shopCloudStatus');
    if (!shop || !legacy || !builder || !preview || !cloudSave || !cloudLoad || !cloudStatus ||
        byId('allbizVisibleBuilder')) return;

    const panel = document.createElement('section');
    panel.className = 'card';
    panel.id = 'allbizVisibleBuilder';
    const heading = document.createElement('h2');
    heading.textContent = '📄 Pagina’s en menu van je webshop';
    const intro = document.createElement('p');
    intro.className = 'muted';
    intro.textContent = 'Maak pagina’s voor je eigen webshop. Je kunt teksten aanpassen en bewaren, maar er wordt niets gepubliceerd of afgerekend.';

    const actionTitle = document.createElement('h3');
    actionTitle.textContent = 'Welke pagina wil je maken?';
    const actions = document.createElement('div');
    actions.className = 'allbiz-page-actions';
    actions.setAttribute('role', 'group');
    actions.setAttribute('aria-label', 'Maak of bewerk een webshoppagina');

    const hints = {
      'Over ons': 'Vertel wie je bent, wat je bedrijf doet en waarom klanten bij je terechtkunnen.',
      'Contact': 'Vul je echte contactgegevens en bereikbaarheid in. Deel geen persoonlijke gegevens die je niet openbaar wilt maken.',
      'Verzending': 'Beschrijf de daadwerkelijke verzendkosten, landen, levertijden en bezorgdienst. Beloof geen termijn die je niet kunt halen.',
      'Retouren': 'Beschrijf je werkelijke retour- en herroepingsvoorwaarden. Controleer de regels voor jouw land en productcategorie.'
    };

    function currentDraftIsUnsaved() {
      const choose = byId('builderPageChoose');
      const name = byId('builderPageTitle');
      const body = byId('builderPageText');
      const visible = byId('builderPageVisible');
      if (!choose || !name || !body || !visible) return false;
      if (choose.value === 'new') return !!(name.value.trim() || body.value.trim());
      try {
        const raw = JSON.parse(localStorage.getItem('allbiz-pro-builder-v1') || '{}');
        const existing = Array.isArray(raw.pages) ? raw.pages.find(p => p.id === choose.value) : null;
        return !existing || name.value !== existing.title || body.value !== existing.text ||
          visible.checked !== (existing.visible !== false);
      } catch {
        // Bij onleesbare opslag nooit aannemen dat wijzigingen al bewaard zijn.
        return !!(name.value.trim() || body.value.trim());
      }
    }

    function openPage(title) {
      const choose = byId('builderPageChoose');
      const name = byId('builderPageTitle');
      const body = byId('builderPageText');
      const visible = byId('builderPageVisible');
      const status = byId('builderStatus');
      if (!choose || !name || !body || !visible || !status) return;
      const normalize = value => value.replace(/\s*\(verborgen\)\s*$/, '').trim().toLocaleLowerCase('nl');
      const target = [...choose.options].find(option =>
        option.value !== 'new' && normalize(option.textContent) === title.toLocaleLowerCase('nl'));
      const samePage = target ? choose.value === target.value :
        choose.value === 'new' && normalize(name.value) === title.toLocaleLowerCase('nl');
      if (!samePage && currentDraftIsUnsaved() &&
          !window.confirm('Je hebt mogelijk nog niet-bewaarde wijzigingen. Wil je toch naar "' + title +
            '" gaan? Bewaar eerst je tekst om niets kwijt te raken.')) return;

      builder.open = true;
      if (target) {
        choose.value = target.value;
        choose.dispatchEvent(new Event('change'));
        status.textContent = '✅ De bestaande pagina ' + title + ' staat klaar. Bewaar eventuele wijzigingen vóór je het voorbeeld bekijkt.';
      } else {
        choose.value = 'new';
        choose.dispatchEvent(new Event('change'));
        name.value = title;
        // Alleen bij Over ons kunnen we reeds door de eigenaar ingevulde websitetekst overnemen.
        if (title === 'Over ons') body.value = byId('siteAbout')?.value?.trim().slice(0,2500) || '';
        visible.checked = true;
        body.placeholder = hints[title];
        status.textContent = 'Vul de juiste tekst in en klik op “+ Pagina bewaren”. Deze pagina is nog niet gepubliceerd.';
      }
      name.scrollIntoView({behavior: 'smooth', block: 'center'});
      name.focus({preventScroll: true});
    }

    for (const [title, emoji] of [
      ['Over ons', '🏢'], ['Contact', '✉️'], ['Verzending', '📦'], ['Retouren', '↩️']
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = emoji + ' ' + title;
      button.setAttribute('aria-label', 'Maak of open de pagina ' + title);
      button.addEventListener('click', () => openPage(title));
      actions.append(button);
    }


    // Lokale ontwerpcontrole: geen juridische certificering en geen netwerkverzoeken.
    const audit = document.createElement('section');
    audit.id = 'allbizPageAudit';
    const auditHeading = document.createElement('h3');
    auditHeading.textContent = '✅ Controleer jouw webshoppagina’s';
    const auditIntro = document.createElement('p');
    auditIntro.className = 'small muted';
    auditIntro.textContent = 'Bekijk welke van de vier veelgebruikte pagina’s op dit toestel zijn bewaard en zichtbaar zijn in het voorbeeld. Controleer zelf of alle informatie klopt.';
    const auditButton = document.createElement('button');
    auditButton.type = 'button';
    auditButton.className = 'secondary';
    auditButton.textContent = '🔎 Controleer mijn pagina’s';
    const auditStatus = document.createElement('p');
    auditStatus.className = 'small';
    auditStatus.setAttribute('role', 'status');
    auditStatus.setAttribute('aria-live', 'polite');
    auditStatus.textContent = 'Nog niet gecontroleerd.';
    const auditList = document.createElement('ul');
    auditList.className = 'allbiz-page-audit-list';

    function auditPages() {
      let pages;
      try {
        const data = JSON.parse(localStorage.getItem('allbiz-pro-builder-v1') || 'null');
        pages = Array.isArray(data?.pages) ? data.pages : [];
      } catch {
        auditStatus.textContent = '⚠️ Je opgeslagen pagina’s kunnen niet worden gelezen op dit toestel.';
        auditList.replaceChildren();
        return;
      }
      auditList.replaceChildren();
      let complete = 0;
      for (const name of Object.keys(hints)) {
        const item = pages.find(page => page && typeof page.title === 'string' &&
          page.title.trim().toLocaleLowerCase('nl') === name.toLocaleLowerCase('nl'));
        const hasText = typeof item?.text === 'string' && !!item.text.trim();
        const shown = item?.visible !== false;
        const ok = !!item && hasText && shown;
        if (ok) complete += 1;
        const li = document.createElement('li');
        const description = !item ? 'nog niet bewaard' :
          !hasText ? 'tekst ontbreekt' :
          !shown ? 'verborgen in het menu' : 'bewaard en zichtbaar in het voorbeeld';
        li.textContent = (ok ? '✅ ' : '⚠️ ') + name + ' — ' + description;
        auditList.append(li);
      }
      auditStatus.textContent = complete + ' van 4 pagina’s hebben tekst en zijn zichtbaar in het winkelvoorbeeld. Dit controleert niet of je bedrijfsgegevens of voorwaarden juridisch correct zijn.';
    }

    auditButton.addEventListener('click', auditPages);
    // De bestaande opslaanknop schrijft eerst lokaal; daarna wordt de checklist vernieuwd.
    byId('builderSavePage')?.addEventListener('click', () => {
      if (auditList.childElementCount) auditPages();
    });
    audit.append(auditHeading, auditIntro, auditButton, auditStatus, auditList);

    const hint = document.createElement('p');
    hint.className = 'small muted';
    hint.textContent = 'Klik op een pagina, vul je tekst in en kies “+ Pagina bewaren”. Gebruik daarna “Bekijk deze pagina in de webshop”. Bestaande pagina’s blijven bewaard.';
    const title = document.createElement('h3');
    title.textContent = '👀 Voorbeeld van je webshop';
    const notice = document.createElement('p');
    notice.className = 'notice';
    notice.textContent = 'Dit is een ontwerpvoorbeeld. Er kunnen hier geen echte producten worden afgerekend, besteld of geleverd.';
    const cloudActions = cloudSave.closest('.import-buttons');
    if (!cloudActions) return;

    const style = document.createElement('style');
    style.textContent = [
      '#allbizVisibleBuilder .allbiz-page-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0 16px}',
      '#allbizVisibleBuilder .allbiz-page-actions button{min-height:48px;white-space:normal}',
      '#allbizVisibleBuilder #shopPreview{margin-top:12px;min-width:0;overflow-wrap:anywhere}',
      '#allbizVisibleBuilder #shopBuilderDetails{margin:14px 0}',
      '#allbizPageAudit{background:#faf8ff;border:1px solid #e2daf6;border-radius:14px;padding:14px;margin:14px 0}',
      '#allbizPageAudit .allbiz-page-audit-list{margin:10px 0 0;padding-left:19px;line-height:1.9}',
      '@media(max-width:420px){#allbizVisibleBuilder .allbiz-page-actions{grid-template-columns:1fr}}'
    ].join('');
    document.head.append(style);

    panel.append(heading, intro, actionTitle, actions, hint, audit);
    // Enkel de ontwerpfuncties verplaatsen. Het oude testmandje blijft verborgen.
    panel.append(builder, cloudActions, cloudStatus, title, notice, preview);
    const firstCard = byId('allbizStoreMain');
    if (firstCard && firstCard.parentElement === shop) firstCard.after(panel);
    else shop.prepend(panel);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
