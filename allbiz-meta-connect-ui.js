/* AllBiz One — echte Meta-accountautorisatie (geen advertentiepublicatie). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const state = $('aboMetaAdsLiveStatus');
  if (!state || $('aboMetaConnectControls')) return;
  const card = state.parentElement;
  const controls = document.createElement('div');
  controls.id = 'aboMetaConnectControls';
  controls.style.cssText = 'display:grid;gap:9px;margin:13px 0';
  const connect = document.createElement('button');
  connect.type = 'button'; connect.textContent = 'Verbind Facebook & Instagram'; connect.disabled = true;
  const disconnect = document.createElement('button');
  disconnect.type = 'button'; disconnect.textContent = 'Ontkoppel Meta'; disconnect.className = 'secondary'; disconnect.hidden = true;
  const list = document.createElement('div');
  list.hidden = true;
  const label = document.createElement('label');
  label.textContent = 'Kies je eigen Meta-advertentieaccount';
  const select = document.createElement('select');
  select.id = 'aboMetaAdAccountSelect';
  label.htmlFor = select.id;
  const choose = document.createElement('button');
  choose.type = 'button'; choose.className = 'secondary'; choose.textContent = 'Bewaar advertentieaccount';
  const listStatus = document.createElement('p');
  listStatus.className = 'small muted'; listStatus.setAttribute('role', 'status');
  list.append(label, select, choose, listStatus);
  const status = document.createElement('p');
  status.className = 'small'; status.setAttribute('role', 'status');
  controls.append(connect, disconnect, list, status);
  card.append(controls);
  const oldDescription = state.nextElementSibling;
  if (oldDescription && oldDescription.tagName === 'P') {
    oldDescription.textContent = 'Verbind via je eigen Facebook-account na het instellen van de Meta-ontwikkelaarsapp. Alleen bestaande advertentieaccounts kunnen worden geselecteerd; er worden geen advertenties geplaatst.';
  }
  const oldNote = [...card.querySelectorAll('p.small.muted')].find(x => x !== listStatus && x.textContent.includes('aanmeldkoppeling'));
  if (oldNote) oldNote.textContent = 'Voor de beheerder: Meta App ID, App Secret en een beveiligde tokensleutel horen uitsluitend in de serverinstellingen. De callback is https://woaifabvfqnnunxmhpkc.supabase.co/functions/v1/allbiz-social-ads-connect . Deel geen geheime sleutels.';
  const endpoint = 'https://woaifabvfqnnunxmhpkc.supabase.co/functions/v1/allbiz-social-ads-connect';
  async function request(action, extra = {}) {
    const auth = window.allbizAuth;
    if (!auth) throw new Error('Log eerst in bij Mijn account.');
    const {data, error} = await auth.getSession();
    if (error || !data?.session?.access_token) throw new Error('Log eerst in bij Mijn account.');
    const response = await fetch(endpoint, {
      method:'POST', headers:{
        'Content-Type':'application/json', 'Authorization':'Bearer ' + data.session.access_token,
        'apikey':window.allbizPublicApiKey || ''
      }, body:JSON.stringify({action, ...extra})
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'De Meta-koppeling kan niet worden gecontroleerd.');
    return result;
  }
  let active = false;
  async function accounts() {
    list.hidden = false; choose.disabled = true;
    select.replaceChildren(); listStatus.textContent = 'Toegankelijke Meta-accounts ophalen…';
    try {
      const result = await request('list_meta_accounts');
      const rows = Array.isArray(result.accounts) ? result.accounts : [];
      for (const a of rows) {
        const option = new Option((a.name ? a.name + ' · ' : '') + a.id, a.id);
        select.add(option);
      }
      if (rows.some(a => a.id === result.selected_account_id)) select.value = result.selected_account_id;
      choose.disabled = !rows.length;
      listStatus.textContent = rows.length ? rows.length + ' advertentieaccount(s) gevonden. Je kiest zelf welk account.' : 'Geen toegankelijke Meta-advertentieaccounts gevonden.';
    } catch(e) {
      listStatus.textContent = '⚠️ ' + e.message;
    }
  }
  async function reload() {
    connect.disabled = true; disconnect.hidden = true; list.hidden = true;
    try {
      const d = await request('status');
      const meta = d.meta || {};
      active = !!meta.connected;
      connect.hidden = active; disconnect.hidden = !active;
      connect.disabled = active || !meta.configured || !d.eligible;
      if (active) {
        state.textContent = '✅ Meta gekoppeld. Advertenties publiceren is nog niet beschikbaar.';
        status.textContent = 'Kies hieronder het Meta-advertentieaccount dat je wilt bekijken.';
        await accounts();
      } else if (!meta.configured) {
        state.textContent = '⚠️ Nog niet klaar: de Meta-ontwikkelaarsapp moet op de server worden ingesteld.';
        status.textContent = 'Open Meta for Developers en maak de app aan. Er is nog niets gekoppeld.';
      } else if (!d.eligible) {
        state.textContent = 'Meta-koppeling staat klaar, maar je account heeft nog geen toegang.';
        status.textContent = 'Log in als geverifieerde eigenaar of met het Business-abonnement.';
      } else {
        state.textContent = 'Meta is klaar om te verbinden.';
        status.textContent = 'Klik op Verbind Facebook & Instagram om toestemming te geven.';
      }
    } catch (e) {
      active = false; connect.hidden = false; connect.disabled = true;
      state.textContent = 'Meta nog niet gecontroleerd.';
      status.textContent = e.message;
    }
  }
  connect.addEventListener('click', async () => {
    connect.disabled = true; status.textContent = 'Beveiligde Meta-toestemming openen…';
    try {
      const result = await request('connect_meta');
      const url = new URL(result.authorization_url);
      if (url.protocol !== 'https:' || url.hostname !== 'www.facebook.com' || !url.pathname.includes('/dialog/oauth'))
        throw new Error('De Meta-toestemmingslink is ongeldig.');
      location.assign(url.href);
    } catch (e) { status.textContent = '⚠️ ' + e.message; await reload(); }
  });
  choose.addEventListener('click', async () => {
    if (!active || !select.value) return;
    choose.disabled = true; listStatus.textContent = 'Accountkeuze bewaren…';
    try {
      await request('select_meta_account', {account_id:select.value});
      listStatus.textContent = '✅ Meta-account geselecteerd. Er wordt geen advertentie gepubliceerd.';
    } catch (e) { listStatus.textContent = '⚠️ ' + e.message; }
    finally { choose.disabled = false; }
  });
  disconnect.addEventListener('click', async () => {
    if (!confirm('Wil je Meta loskoppelen van AllBiz One?')) return;
    disconnect.disabled = true;
    try { await request('disconnect_meta'); await reload(); status.textContent = 'Meta is ontkoppeld.'; }
    catch (e) { status.textContent = '⚠️ ' + e.message; }
    finally { disconnect.disabled = false; }
  });
  const params = new URLSearchParams(location.search);
  if (params.get('ads') === 'meta') {
    const results = {connected:'✅ Meta heeft toestemming gegeven. Controleer je account hieronder.',
      cancelled:'De Meta-koppeling is afgebroken.', expired:'De Meta-koppeling is verlopen.',
      token_error:'Meta heeft geen geldige toegang gegeven.', save_error:'Koppeling kon niet worden opgeslagen.',
      invalid:'Ongeldige toestemmingsaanvraag.', error:'Meta-koppeling mislukt.'};
    if (results[params.get('result')]) status.textContent = results[params.get('result')];
    location.hash = 'adaccounts';
    history.replaceState(null, '', location.pathname + location.hash);
  }
  const refresh = $('aboAdsRefresh');
  refresh?.addEventListener('click', () => {void reload();});
  window.addEventListener('allbiz-user-changed', () => {void reload();});
  void reload();
})();
