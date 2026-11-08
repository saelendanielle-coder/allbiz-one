/* AllBiz One — zichtbare, veilige webshop-paginabouwer.
   Hergebruikt de bestaande ontwerpfunctie; start nooit een betaling. */
(() => {
  'use strict';
  function init() {
    const shop = document.getElementById('shop');
    const legacy = document.getElementById('allbizShopPractice');
    const builder = document.getElementById('shopBuilderDetails');
    const preview = document.getElementById('shopPreview');
    const save = document.getElementById('shopCloudSave');
    const load = document.getElementById('shopCloudLoad');
    const cloudStatus = document.getElementById('shopCloudStatus');
    if (!shop || !legacy || !builder || !preview || !save || !load || !cloudStatus ||
        document.getElementById('allbizVisibleBuilder')) return;

    // De oude, verborgen testmandjes en betaalformulieren blijven in het testgedeelte.
    const panel = document.createElement('section');
    panel.className = 'card';
    panel.id = 'allbizVisibleBuilder';
    const heading = document.createElement('h2');
    heading.textContent = '📄 Webshoppagina’s, menu en Over ons';
    const intro = document.createElement('p');
    intro.className = 'muted';
    intro.textContent = 'Maak en bewaar extra pagina’s, zoals Over ons, Contact, Verzending en Retouren. Bekijk ze hieronder in jouw winkelvoorbeeld. Dit publiceert geen website en verwerkt geen betalingen.';
    const about = document.createElement('button');
    about.type = 'button';
    about.className = 'secondary';
    about.textContent = '✏️ Maak of open Over ons';
    const hint = document.createElement('p');
    hint.className = 'small muted';
    hint.textContent = 'Gebruik daarna “+ Pagina bewaren”. De tekst wordt eerst op dit toestel opgeslagen. Met “Bewaar webshopontwerp privé” zet je het ontwerp in je eigen account.';
    const title = document.createElement('h3');
    title.textContent = '👀 Mijn winkelvoorbeeld';
    const notice = document.createElement('p');
    notice.className = 'notice';
    notice.textContent = 'Dit is uitsluitend een ontwerpvoorbeeld. Er kunnen geen echte producten worden afgerekend, besteld of geleverd via dit voorbeeld.';
    const cloudActions = save.closest('.import-buttons');
    if (!cloudActions) return;
    panel.append(heading, intro, about, hint);
    panel.append(builder, cloudActions, cloudStatus, title, notice, preview);
    const firstCard = document.getElementById('allbizStoreMain');
    if (firstCard && firstCard.parentElement === shop) firstCard.after(panel);
    else shop.prepend(panel);

    about.addEventListener('click', () => {
      builder.open = true;
      const choice = document.getElementById('builderPageChoose');
      const name = document.getElementById('builderPageTitle');
      const body = document.getElementById('builderPageText');
      const visible = document.getElementById('builderPageVisible');
      const status = document.getElementById('builderStatus');
      if (!choice || !name || !body || !visible || !status) return;
      const existing = [...choice.options].find(o =>
        o.value !== 'new' && o.textContent.replace(/\s*\(verborgen\)$/, '').trim().toLocaleLowerCase('nl') === 'over ons');
      if (existing) {
        choice.value = existing.value;
        choice.dispatchEvent(new Event('change'));
        status.textContent = '✅ Je bestaande pagina Over ons is geopend. Bewaar je aanpassingen voordat je het voorbeeld bekijkt.';
      } else {
        choice.value = 'new';
        choice.dispatchEvent(new Event('change'));
        name.value = 'Over ons';
        body.value = document.getElementById('siteAbout')?.value?.trim().slice(0,2500) || '';
        visible.checked = true;
        status.textContent = 'Vul de tekst van Over ons in en klik op “+ Pagina bewaren”. Er is nog niets gepubliceerd.';
      }
      name.scrollIntoView({behavior:'smooth', block:'center'});
      name.focus({preventScroll:true});
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
