/* AllBiz One — releasecontrole voor de geverifieerde eigenaar.
   Dit scherm is een checklist, geen automatische veiligheidscertificering. */
(() => {
  'use strict';
  function init() {
    const host = document.getElementById('allbizOwnerDashboard');
    if (!host || document.getElementById('allbizLaunchAudit')) return;
    const panel = document.createElement('section');
    panel.id = 'allbizLaunchAudit';
    panel.setAttribute('aria-label', 'Lanceringscontrole');
    panel.style.cssText = 'margin:16px 0 22px;padding:17px;border:1px solid #d5c7ee;border-radius:15px;background:#faf8ff;color:#251b3c';
    const h = document.createElement('h3');
    h.textContent = '🚀 Lanceringscontrole AllBiz One';
    panel.append(h);
    const intro = document.createElement('p');
    intro.textContent = 'Controle voor de eigenaar. De groene onderdelen zijn technisch aanwezig; de overige zaken vragen nog een echte eindtest vóór je betalende klanten toelaat.';
    intro.className = 'small';
    panel.append(intro);
    const checks = [
      ['✅', 'Account en database', 'Supabase-authenticatie en privé-opslag zijn aanwezig. Test ook registratie en wachtwoordherstel met een nieuw account.'],
      ['✅', 'Stripe testmodus', 'De webhook en testabonnementen bestaan. Een testbetaling is geen echte omzet.'],
      ['⚠️', 'Live abonnement → klanttoegang', 'Nog geen volledige succesvolle live eindtest bevestigd. Test een echte betaling, activatie, verlenging, opzegging en terugbetaling.'],
      ['⚠️', 'Website online publiceren', 'Publicatie is serverbeveiligd en vereist een echt actief abonnement. Controleer de volledige klantreis.'],
      ['⚠️', 'Webshop en digitale levering', 'Afrekenen en bestellingen zijn momenteel demo. Er is nog geen echte checkout, veilige digitale levering of automatische verzending.'],
      ['⚠️', 'Trading met echt geld', 'Nog niet beschikbaar. Er is geen toegelaten, werkende brokerkoppeling voor echte orders.'],
      ['⚠️', 'Bedrijfs- en klantinformatie', 'Controleer vóór verkoop ondernemingsgegevens, privacy, voorwaarden, herroepingsrecht, klantenservice en duidelijke abonnementsprijzen.']
    ];
    const list = document.createElement('ul');
    list.style.cssText = 'list-style:none;padding:0;display:grid;gap:8px;margin:12px 0';
    for (const [mark, title, description] of checks) {
      const li = document.createElement('li');
      li.style.cssText = 'padding:11px;background:white;border:1px solid #e6dff4;border-radius:10px';
      const strong = document.createElement('strong');
      strong.textContent = mark + ' ' + title;
      const detail = document.createElement('p');
      detail.className = 'small muted';
      detail.style.margin = '4px 0 0';
      detail.textContent = description;
      li.append(strong, detail);
      list.append(li);
    }
    panel.append(list);
    const note = document.createElement('p');
    note.className = 'small';
    note.textContent = 'Status: voorbereiding / bèta. Dit is geen bevestiging dat alle functies verkoopklaar of juridisch volledig zijn.';
    panel.append(note);
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:9px';
    for (const [label, tab] of [['💎 Abonnementen bekijken', 'plans'], ['🏪 Webshop testen', 'shop'], ['📈 Tradingdemo openen', 'trading']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.className = 'secondary';
      button.addEventListener('click', () => {
        const nav = document.querySelector('nav.nav button[data-tab="' + tab + '"]');
        if (nav) nav.click();
      });
      actions.append(button);
    }
    panel.append(actions);
    host.prepend(panel);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();