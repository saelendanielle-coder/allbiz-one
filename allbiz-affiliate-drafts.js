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
    const privacy = document.createElement('p');
    privacy.className = 'small muted';
    privacy.textContent = 'Je concept wordt alleen in deze browser bewaard. Op een andere gsm of laptop is het niet automatisch beschikbaar. Publicatie en commissie-uitbetaling gebeuren niet via deze knoppen.';
    section.append(privacy);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();