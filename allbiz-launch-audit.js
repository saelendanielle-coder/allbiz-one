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
      ['⚠️', 'Echte betalingen', 'De echte Stripe-abonnementslinks zijn geactiveerd. Een volledige live betaalcyclus (betaling, toegang, verlenging en opzegging) moet nog worden bevestigd. Dit is iets anders dan webshopcheckout.'],
      ['⚠️', 'Website online publiceren', 'Publicatie is serverbeveiligd en vereist een echt actief abonnement. Controleer de volledige klantreis.'],
      ['⚠️', 'Webshop en digitale levering', 'De webshop, privé-bestanden en beveiligde downloadcontrole zijn technisch aanwezig. De webshopcheckout staat nog uit tot Stripe Connect, betaalbevestiging en bezorging van downloads aantoonbaar werken.'],
      ['⚠️', 'Trading met echt geld', 'Nog niet beschikbaar. Er is geen toegelaten, werkende brokerkoppeling voor echte orders.'],
      ['⚠️', 'Bedrijfs- en klantinformatie', 'Controleer vóór verkoop ondernemingsgegevens, privacy, voorwaarden, herroepingsrecht, klantenservice en duidelijke abonnementsprijzen.']
    ];
    // Exactly five launch blockers, separate from the working infrastructure.
    const remaining = document.createElement('p');
    remaining.className = 'small';
    remaining.style.fontWeight = '700';
    remaining.textContent = 'Nog 5 lanceringspunten: live betaling bevestigen, websitepublicatie testen, webshopcheckout & levering, brokerkoppeling en bedrijfsinformatie.';
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
    const checkoutCheck = document.createElement('button');
    checkoutCheck.type = 'button';
    checkoutCheck.className = 'secondary';
    checkoutCheck.textContent = '↻ Controleer echte webshopcheckout';
    const checkoutStatus = document.createElement('p');
    checkoutStatus.className = 'small muted';
    checkoutStatus.setAttribute('role', 'status');
    checkoutStatus.textContent = 'Webshopbetalingen nog niet gecontroleerd.';
    checkoutCheck.addEventListener('click', async () => {
      checkoutCheck.disabled = true;
      checkoutStatus.textContent = 'Beveiligde betaalstatus ophalen…';
      try {
        const response = await fetch('https://woaifabvfqnnunxmhpkc.supabase.co/functions/v1/allbiz-store-checkout', {
          method: 'POST',
          headers: {'content-type':'application/json'},
          body: JSON.stringify({action:'status'})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server niet bereikbaar');
        checkoutStatus.textContent = data.live_checkout_enabled
          ? '✅ Live webshopcheckout is aan volgens de server; controleer nog de volledige aankoop en aflevering.'
          : '⚠️ Live webshopcheckout blijft uit. ' + (data.reason || 'Een volledige veilige eindtest ontbreekt.') +
            (data.live_checkout_configured ? ' Stripe-sleutel is aanwezig.' : ' Live Stripe-sleutel ontbreekt of is niet bevestigd.');
      } catch (error) {
        checkoutStatus.textContent = '⚠️ Webshopstatus onbekend: ' + error.message;
      } finally {
        checkoutCheck.disabled = false;
      }
    });
    server.append(serverHeading, serverStatus, refresh, serverNote, checkoutCheck, checkoutStatus);
    panel.append(server);
    const euroBox=document.createElement('div');
    euroBox.style.cssText='background:white;border:1px solid #ddd3ee;border-radius:12px;padding:13px;margin:12px 0';
    const euroHeading=document.createElement('h4');euroHeading.textContent='💶 Eenmalige €1-proefbetaling';
    const euroDescription=document.createElement('p');euroDescription.className='small';
    euroDescription.textContent='Alleen voor de eigenaar. Geen abonnement. Je betaalt pas wanneer je zelf afrekent op Stripe.';
    const euroButton=document.createElement('button');euroButton.type='button';
    euroButton.className='secondary';euroButton.textContent='Open veilige €1-proefbetaling';
    const euroStatus=document.createElement('p');euroStatus.setAttribute('role','status');
    euroStatus.className='small muted';euroStatus.textContent='Er is nog niets betaald.';
    euroButton.addEventListener('click',async()=>{
      euroButton.disabled=true;euroStatus.textContent='Beveiligde betaalmogelijkheid controleren…';
      try{
        const supabase=window.allbizClient;
        if(!supabase)throw Error('Accountverbinding niet beschikbaar.');
        const {data,error}=await supabase.auth.getSession();
        if(error||!data?.session?.access_token)throw Error('Log eerst in bij Mijn account.');
        const url='https://woaifabvfqnnunxmhpkc.supabase.co/functions/v1/allbiz-store-checkout';
        const statusResponse=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status'})});
        const statusData=await statusResponse.json();
        if(!statusResponse.ok||!statusData.owner_one_euro_test_ready)throw Error('De live Stripe-koppeling is nog niet klaar. Er is niets afgeschreven.');
        if(!confirm('Echte eenmalige testbetaling van €1,00 openen? Dit is geen abonnement.')){euroStatus.textContent='Geen betaling gestart.';return;}
        const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action:'owner_test_checkout'})});
        const result=await response.json();
        if(!response.ok||!result.checkout_url)throw Error(result.error||'De betaalpagina kon niet worden aangemaakt.');
        if(!/^https:\/\/checkout\.stripe\.com\//.test(result.checkout_url))throw Error('Ongeldige Stripe-link.');
        location.assign(result.checkout_url);
      }catch(e){euroStatus.textContent='⚠️ '+e.message;}finally{euroButton.disabled=false;}
    });
    euroBox.append(euroHeading,euroDescription,euroButton,euroStatus);
    panel.append(euroBox);
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