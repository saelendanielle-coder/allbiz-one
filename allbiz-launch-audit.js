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
      ['✅', 'Stripe testmodus', 'Stripe Sandbox-betalingen en automatische testabonnementen zijn eerder gecontroleerd, inclusief Pro-toegang. Niet opnieuw testen; er is geen echt geld afgeschreven.'],
      ['⚠️', 'Echte betalingen', 'De sandbox-flow is getest. Een volledige live-betaalcyclus is nog niet aangetoond; daarom blijven betaalbuttons voor nieuwe klanten voorlopig dicht.'],
      ['⚠️', 'Website online publiceren', 'Publicatie is serverbeveiligd en vereist een echt actief abonnement. Controleer de volledige klantreis.'],
      ['⚠️', 'Webshop en digitale levering', 'Afrekenen en bestellingen zijn momenteel demo. Er is nog geen echte checkout, veilige digitale levering of automatische verzending.'],
      ['⚠️', 'Trading met echt geld', 'Nog niet beschikbaar. Er is geen toegelaten, werkende brokerkoppeling voor echte orders.'],
      ['⚠️', 'Bedrijfs- en klantinformatie', 'Controleer vóór verkoop ondernemingsgegevens, privacy, voorwaarden, herroepingsrecht, klantenservice en duidelijke abonnementsprijzen.']
    ];
    // Exactly five launch blockers, separate from the working infrastructure.
    const remaining = document.createElement('p');
    remaining.className = 'small';
    remaining.style.fontWeight = '700';
    remaining.textContent = 'Nog 5 lanceringspunten: live betaling, websitepublicatie, webshopbestellingen, brokerkoppeling en bedrijfsinformatie.';
    panel.append(remaining);
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
    // De eigenaar krijgt hier echte, alleen-lezen servercijfers. Een betaling
    // wordt NOOIT gesimuleerd of geactiveerd vanuit dit dashboard.
    const server = document.createElement('div');
    server.id = 'allbizLaunchServerCheck';
    server.style.cssText = 'padding:13px;margin:12px 0;border:1px solid #d9d0ef;border-radius:12px;background:white';
    const serverHeading = document.createElement('strong');
    serverHeading.textContent = '🔐 Live controle van abonnementen';
    const serverStatus = document.createElement('p');
    serverStatus.id = 'allbizLaunchServerStatus';
    serverStatus.setAttribute('role', 'status');
    serverStatus.setAttribute('aria-live', 'polite');
    serverStatus.style.margin = '8px 0';
    serverStatus.textContent = 'Nog niet gecontroleerd. De cijfers worden via jouw beveiligde beheerdersaccount opgehaald.';
    const serverNote = document.createElement('p');
    serverNote.className = 'small muted';
    serverNote.textContent = 'Alleen-lezen controle: geen betaling, afschrijving of wijziging van abonnementen. Ook bij een actief abonnement blijft een volledige live eindtest nodig.';
    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.className = 'secondary';
    refresh.textContent = '↻ Controleer echte abonnementen';
    refresh.addEventListener('click', () => {
      const existing = document.getElementById('aboReloadStats');
      if (!existing) {
        serverStatus.textContent = 'Het beveiligde overzicht is nog niet geladen. Controleer eerst je beheerdersrechten.';
        return;
      }
      serverStatus.textContent = 'De actuele betaalstatus wordt beveiligd opgevraagd…';
      existing.click();
    });
    server.append(serverHeading, serverStatus, refresh, serverNote);
    panel.append(server);
    window.addEventListener('allbiz-owner-stats-loaded', event => {
      const data = event.detail || {};
      const count = data.active_subscriptions;
      const sites = data.published_websites;
      if (!Number.isInteger(count) || count < 0) {
        serverStatus.textContent = 'De server is bereikbaar, maar het aantal echte abonnementen is momenteel onbekend.';
        return;
      }
      const suffix = Number.isInteger(sites) && sites >= 0
        ? ' · ' + sites + ' gepubliceerde websites.'
        : '.';
      serverStatus.textContent = '✅ Server bereikbaar: ' + count +
        ' echte actieve abonnementen' + suffix +
        (count === 0 ? ' De Stripe Sandbox-tests zijn al uitgevoerd. Er is nog geen live-abonnement geregistreerd.' :
          ' Live betalingen, verlenging en opzegging zijn nog niet definitief bevestigd.');
    });
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