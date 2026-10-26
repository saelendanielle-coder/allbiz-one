/* AllBiz One — Saxo OpenAPI SIM login smoke test. NO LIVE TRADING, NO ORDERS. */
(() => {
  'use strict';
  const REDIRECT = 'https://saelendanielle-coder.github.io/allbiz-one/';
  const AUTHORIZE = 'https://sim.logonvalidation.net/authorize';
  const TOKEN = 'https://sim.logonvalidation.net/token';
  const USER_URL = 'https://gateway.saxobank.com/sim/openapi/port/v1/users/me';
  const PENDING_KEY = 'allbiz-saxo-sim-pkce-v1';
  let accessToken = null;
  const trading = document.getElementById('trading');
  if (!trading || document.getElementById('allbizSaxoSimTest')) return;

  const css = document.createElement('style');
  css.textContent = '#allbizSaxoSimTest{border:2px solid #9a83e2}#allbizSaxoSimTest .saxo-actions{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}#allbizSaxoSimTest button{min-height:44px}#allbizSaxoSimTest input{font-size:16px}#allbizSaxoSimStatus{white-space:pre-wrap;overflow-wrap:anywhere}';
  document.head.appendChild(css);
  const box = document.createElement('section');
  box.id = 'allbizSaxoSimTest';
  box.className = 'card';
  box.innerHTML = '<h2>🧪 Saxo koppelen — alleen testomgeving</h2>' +
    '<p>Test de beveiligde Saxo-login zonder echt geld. Deze proef controleert alleen of Saxo een account kan teruggeven. <strong>Er worden geen orders geplaatst, en je krijgt hier geen toegang tot echte handel.</strong></p>' +
    '<label for="allbizSaxoAppKey">Saxo App Key (van je Simulation App)</label>' +
    '<input id="allbizSaxoAppKey" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Plak de App Key via COPY uit Saxo">' +
    '<p class="small muted">Gebruik alleen de App Key (publieke applicatie-ID), nooit een wachtwoord, App Secret of access token. De sleutel wordt alleen in dit browsertabblad bewaard tijdens de test.</p>' +
    '<div class="saxo-actions"><button type="button" id="allbizSaxoConnect">🔒 Koppel Saxo DEMO</button><button type="button" class="secondary" id="allbizSaxoStop">Testverbinding stoppen</button></div>' +
    '<p id="allbizSaxoSimStatus" role="status" class="notice">Niet verbonden. Er is geen saldo opgehaald en er kunnen geen transacties uitgevoerd worden.</p>' +
    '<p class="small muted">De bij Saxo geregistreerde Redirect URL moet exact overeenkomen met <code>https://saelendanielle-coder.github.io/allbiz-one/</code>. Saxo kan toestemming of aanvullende vereisten vragen. Tokens worden niet opgeslagen of naar AllBiz One verzonden.</p>';
  trading.querySelector('.card')?.after(box);

  const keyInput = document.getElementById('allbizSaxoAppKey');
  const status = document.getElementById('allbizSaxoSimStatus');
  const connect = document.getElementById('allbizSaxoConnect');
  const stop = document.getElementById('allbizSaxoStop');
  function say(message) { status.textContent = message; }
  function cleanAuthQuery() {
    const u = new URL(location.href);
    ['code','state','error','error_description'].forEach(k => u.searchParams.delete(k));
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  }
  function b64url(bytes) {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  async function begin() {
    const appKey = keyInput.value.trim();
    if (!/^[a-zA-Z0-9._-]{16,128}$/.test(appKey)) {
      say('Plak eerst de volledige App Key met de COPY-knop op Saxo. Geen App Secret of wachtwoord invoeren.');
      return;
    }
    if (location.origin + location.pathname !== REDIRECT) {
      say('Open eerst de gepubliceerde AllBiz One-website op ' + REDIRECT + '. Een lokale kopie kan de Saxo-login niet afhandelen.');
      return;
    }
    if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
      say('Deze browser ondersteunt geen beveiligde PKCE-login. Gebruik de actuele https-versie in Chrome.');
      return;
    }
    connect.disabled = true;
    try {
      const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      const challenge = b64url(new Uint8Array(digest));
      const state = 'allbiz-saxo-' + b64url(crypto.getRandomValues(new Uint8Array(24)));
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({appKey, verifier, state, started: Date.now()}));
      const url = new URL(AUTHORIZE);
      url.search = new URLSearchParams({
        response_type:'code', client_id:appKey, redirect_uri:REDIRECT,
        code_challenge:challenge, code_challenge_method:'S256', state
      });
      location.assign(url.toString());
    } catch (err) {
      connect.disabled = false;
      say('Aanmelden kon niet starten. Controleer of cookies/opslag in Chrome zijn toegestaan en probeer opnieuw.');
    }
  }
  async function returnFromSaxo() {
    const u = new URL(location.href);
    const code = u.searchParams.get('code');
    const state = u.searchParams.get('state');
    const error = u.searchParams.get('error');
    if (!state?.startsWith('allbiz-saxo-')) return; // Do not interfere with Supabase.
    cleanAuthQuery(); // Remove authorization code from address bar immediately.
    let flow = null;
    try { flow = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); } catch {}
    sessionStorage.removeItem(PENDING_KEY);
    if (error) { say('Saxo heeft de login niet voltooid: ' + error + '. Controleer je Saxo-account.'); return; }
    if (!flow || !code || state !== flow.state || Date.now() - flow.started > 10 * 60 * 1000) {
      say('De beveiligde logincontrole is verlopen of klopt niet. Start de test opnieuw.'); return;
    }
    keyInput.value = flow.appKey;
    document.querySelector('[data-tab="trading"]')?.click();
    say('Saxo-login ontvangen. Beveiligde testverbinding controleren...');
    try {
      const response = await fetch(TOKEN, {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({
          grant_type:'authorization_code', client_id:flow.appKey,
          redirect_uri:REDIRECT, code, code_verifier:flow.verifier
        })
      });
      if (!response.ok) throw new Error('Saxo token endpoint HTTP ' + response.status);
      const result = await response.json();
      if (typeof result.access_token !== 'string' || !result.access_token) {
        throw new Error('Geen geldig toegangstoken ontvangen');
      }
      accessToken = result.access_token; // Only in JS memory, never persistent.
      const me = await fetch(USER_URL, {
        headers:{Authorization:'Bearer ' + accessToken, Accept:'application/json'},
        cache:'no-store'
      });
      if (!me.ok) throw new Error('Saxo API HTTP ' + me.status);
      say('✅ Saxo DEMO-test gelukt: de beveiligde login en een alleen-lezen API-aanvraag werken. Er zijn geen orders geplaatst. Bij verversen moet je opnieuw verbinden.');
    } catch (err) {
      accessToken = null;
      say('⚠️ De Saxo-testverbinding is nog niet bevestigd (' + String(err.message || 'verbindingsfout') + '). Mogelijk is een veilige serverkoppeling nodig of klopt de geregistreerde Redirect URL niet. Er is niets verhandeld.');
    }
  }
  connect.addEventListener('click', begin);
  stop.addEventListener('click', () => {
    accessToken = null;
    sessionStorage.removeItem(PENDING_KEY);
    keyInput.value = '';
    say('Lokale testverbinding gestopt. Je bent hiermee niet automatisch bij Saxo zelf uitgelogd. Er zijn geen orders geplaatst.');
  });
  returnFromSaxo();
})();