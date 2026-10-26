/* AllBiz One: gratis YouTube-uploadhulp en campagnecheck, geen externe API's. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const video = $('video'), ads = $('ads');
  if (!video || !ads || $('aboContentTools')) return;

  const style = document.createElement('style');
  style.textContent =
    '.abo-content-tools{border:1px solid #ddd3f2;background:#faf8ff;border-radius:16px;padding:17px;margin:15px 0}' +
    '.abo-content-tools h3{margin:0 0 8px}.abo-content-actions{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}' +
    '.abo-content-actions button{min-height:46px}.abo-content-tools textarea{width:100%;box-sizing:border-box;min-height:170px;line-height:1.55;font-size:15px}' +
    '.abo-content-checks{padding-left:20px;line-height:1.55}.abo-content-checks li{margin:8px 0;overflow-wrap:anywhere}' +
    '@media(max-width:650px){.abo-content-tools{padding:13px}.abo-content-actions{display:grid;grid-template-columns:1fr}.abo-content-actions button{width:100%;font-size:15px}}';
  document.head.append(style);

  const make = (tag, value, className) => {
    const el = document.createElement(tag);
    if (value !== undefined) el.textContent = value;
    if (className) el.className = className;
    return el;
  };
  const btn = (label, handler) => {
    const b = make('button', label, 'secondary');
    b.type = 'button';
    b.addEventListener('click', handler);
    return b;
  };
  const get = id => String($(id)?.value || '').trim();
  const copy = async (value, field, status) => {
    if (!value) {
      status.textContent = 'Maak eerst een concept.';
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) throw Error('Geen klembordtoegang');
      await navigator.clipboard.writeText(value);
      status.textContent = '✅ Gekopieerd. Controleer de tekst vóór je hem gebruikt.';
    } catch {
      field.focus();
      field.select();
      status.textContent = 'Selecteer de tekst en kies Kopiëren. Dit toestel gaf geen automatische klembordtoegang.';
    }
  };

  const you = make('section', undefined, 'abo-content-tools');
  you.id = 'aboContentTools';
  you.append(make('h3','📝 YouTube-titel en beschrijving (gratis)'),
    make('p','Maak op basis van je eigen scènes een tekst die je kunt kopiëren bij het uploaden naar YouTube. De app uploadt niets automatisch.','muted'));
  const youtubeLabel = make('label','Uploadtekst (je kunt hem nog aanpassen)');
  youtubeLabel.htmlFor='aboYoutubeDescription';
  const youtubeText = make('textarea');
  youtubeText.id='aboYoutubeDescription';
  youtubeText.rows=8;
  youtubeText.maxLength=3000;
  youtubeText.placeholder='Klik eerst op Maak uploadtekst';
  const youtubeStatus = make('p','Er zijn nog geen teksten gegenereerd.','muted');
  youtubeStatus.setAttribute('role','status');
  const youActions = make('div',undefined,'abo-content-actions');
  const makeYoutube = () => {
    const rawTitle = get('videoName') || 'Mijn video';
    const formatShort = get('videoFormat') === 'short';
    const title = rawTitle.slice(0, formatShort ? 89 : 100) + (formatShort && !/#shorts/i.test(rawTitle) ? ' #Shorts' : '');
    const scenes = [1,2,3].map(i=>get('videoText'+i)).filter(Boolean);
    const desc = scenes.length ? scenes.join('\n') : 'Bekijk onze video!';
    const result = [
      'TITEL', title, '',
      'BESCHRIJVING', desc,
      '',
      'Meer informatie: [voeg hier alleen je echte website- of kanaallink toe]',
      '',
      'HASHTAGS', formatShort ? '#Shorts #YouTubeShorts' : '#YouTube #Video'
    ].join('\n');
    youtubeText.value = result;
    youtubeStatus.textContent = '✅ Uploadtekst gemaakt. Controleer de inhoud en verwijder de invultekst vóór publicatie.';
  };
  youActions.append(btn('✨ Maak uploadtekst', makeYoutube),
    btn('📋 Kopieer uploadtekst', () => copy(youtubeText.value.trim(), youtubeText, youtubeStatus)));
  you.append(youActions,youtubeLabel,youtubeText,youtubeStatus,
    make('p','Gebruik alleen beeld, audio en tekst waarvoor je rechten hebt. Publicatie en videoweergaven zijn niet gegarandeerd.','small muted'));
  const videoCards = video.querySelectorAll('.card');
  if (videoCards.length) videoCards[videoCards.length-1].after(you);
  else video.append(you);

  const check = make('section',undefined,'abo-content-tools');
  check.id='aboAdPublicationCheck';
  check.append(make('h3','🔎 Controle vóór advertentiepublicatie'),
    make('p','Dit controleert alleen je ingevulde velden. Het activeert geen advertenties, koppelt geen account en kost niets.','muted'));
  const adStatus = make('p','Controleer eerst je advertentieplan.','muted');
  adStatus.setAttribute('role','status');
  const adList = make('ul',undefined,'abo-content-checks');
  const runAdCheck = () => {
    const url = get('adStoreUrl');
    let validUrl=false;
    if (url) {
      try {
        const parsed = new URL(url);
        validUrl = parsed.protocol === 'https:' && Boolean(parsed.hostname) &&
          !['localhost','127.0.0.1'].includes(parsed.hostname);
      } catch { validUrl=false; }
    }
    const budgetStr=get('adDailyBudget'),budget=Number(budgetStr);
    const audience=get('adAudience');
    const chosen=[...ads.querySelectorAll('input[name="adChannel"]:checked')];
    const checks = [
      [audience.length >= 5,'Doelgroep duidelijk omschreven (minstens 5 tekens).'],
      [chosen.length > 0,'Minstens één advertentiekanaal gekozen.'],
      [budgetStr !== '' && Number.isFinite(budget) && budget > 0,'Een positief dagbudget ingevuld voor eventuele toekomstige advertenties.'],
      [validUrl,'Een https-link naar een gepubliceerde landingspagina ingevuld (bereikbaarheid niet getest).'],
      [false,'Handmatig te controleren: landingspagina, contactgegevens, voorwaarden en werkende echte checkout.'],
      [false,'Handmatig te controleren: advertentiebeleid van het gekozen platform, doelgroep, betaalaccount en expliciete toestemming.']
    ];
    adList.replaceChildren();
    checks.forEach(([ready,label]) => {
      const li = make('li',(ready?'✅ ':'⬜ ')+label);
      adList.append(li);
    });
    const filled = checks.slice(0,4).filter(x=>x[0]).length;
    adStatus.textContent = filled + ' van 4 formulierpunten ingevuld. De laatste 2 controles vereisen menselijke beoordeling. Er wordt niets gepubliceerd.';
  };
  const actions=make('div',undefined,'abo-content-actions');
  actions.append(btn('✅ Controleer mijn advertentie',runAdCheck));
  check.append(actions,adList,adStatus,
    make('p','Een ingevulde https-link bewijst niet dat de website online is. Controleer dat zelf voordat je geld aan advertenties uitgeeft.','small muted'));
  const adCards=ads.querySelectorAll('.card');
  if (adCards.length) adCards[0].after(check);
  else ads.append(check);
})();