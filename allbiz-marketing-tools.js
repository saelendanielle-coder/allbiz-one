/* AllBiz One — marketingplanner, berichtbibliotheek en SEO-conceptcontrole.
   Volledig lokaal. Geen advertenties, verkoopcijfers of automatische publicatie. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const hub = $('allbizDigitalMarketingHub');
  if (!hub || $('aboMarketingPlanner')) return;
  // Lokale concepten zijn aan het ingelogde account gekoppeld, niet aan het toestel als geheel.
  const canEdit = () => window.allbizMarketingUnlocked === true && !!currentUserId;
  const legacyMarketingKey = 'allbiz-marketing-campaigns-v1';
  const legacyPostsKey = 'allbiz-marketing-posts-v1';
  const marketingKey = () => currentUserId ? 'allbiz-marketing-campaigns-v2:' + currentUserId : null;
  const postsKey = () => currentUserId ? 'allbiz-marketing-posts-v2:' + currentUserId : null;
  const MAX_CAMPAIGNS = 40;
  const MAX_POSTS = 40;
  const today = () => new Date().toISOString().slice(0,10);
  const text = (tag, content, cls) => {
    const n = document.createElement(tag);
    if (content !== undefined) n.textContent = content;
    if (cls) n.className = cls;
    return n;
  };
  const btn = (label, action) => {
    const n = document.createElement('button');
    n.type = 'button';
    n.className = 'secondary';
    n.textContent = label;
    n.addEventListener('click', action);
    return n;
  };
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + 'T00:00:00Z'));
  function load(key, limit, normalize) {
    try {
      const rows = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(rows) ? rows.slice(0,limit).map(normalize).filter(Boolean) : [];
    } catch { return []; }
  }
  const channels = ['Instagram','Facebook','TikTok','LinkedIn','Google Ads','YouTube','E-mail','Anders'];
  const states = ['Concept','Gepland','Handmatig gepubliceerd','Afgerond'];
  function normalizeCampaign(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = String(raw.title || '').trim().slice(0,100);
    if (!title) return null;
    const budget = Number(raw.budget);
    return {
      id: String(raw.id || '').slice(0,100) || String(Date.now()),
      title,
      channel: channels.includes(raw.channel) ? raw.channel : 'Anders',
      goal: String(raw.goal || '').slice(0,160),
      budget: Number.isFinite(budget) && budget >= 0 && budget <= 1000000 ? budget : 0,
      date: validDate(String(raw.date || '')) ? raw.date : today(),
      state: states.includes(raw.state) ? raw.state : 'Concept'
    };
  }
  function normalizePost(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const content = String(raw.content || '').trim().slice(0,3000);
    if (!content) return null;
    return {id:String(raw.id || '').slice(0,100) || String(Date.now()),
      channel:String(raw.channel || '').slice(0,30), content,
      savedAt:String(raw.savedAt || '').slice(0,24)};
  }
  let campaigns = [];
  let posts = [];
  let currentUserId;
  const store = (key, value, status) => {
    if (!key) { status.textContent = 'Log eerst in bij Mijn account.'; return false; }
    try { localStorage.setItem(key,JSON.stringify(value)); return true; }
    catch { status.textContent = 'Opslaan mislukt. Controleer de opslagruimte van je browser.'; return false; }
  };
  const makeId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  };
  const style = document.createElement('style');
  style.textContent = '#aboMarketingPlanner,#aboMarketingSEO,#aboMarketingSavedPosts{border:1px solid #ddd4f2;border-radius:16px;padding:16px;margin:16px 0;background:#faf8ff;color:#241c39}' +
    '.abo-market-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}' +
    '.abo-market-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}' +
    '.abo-market-item{background:white;border:1px solid #e1d9f2;border-radius:12px;padding:12px;margin:10px 0;overflow-wrap:anywhere}' +
    '.abo-market-item p{white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.abo-market-item button{width:auto;min-height:42px}' +
    '.abo-market-status{min-height:24px;white-space:pre-wrap}' +
    '.abo-market-preview{border:1px solid #d8d2ea;border-radius:12px;background:white;padding:14px;overflow-wrap:anywhere}' +
    '.abo-market-preview strong{color:#24477b}' +
    '#aboMarketingPlanner input,#aboMarketingPlanner textarea,#aboMarketingPlanner select,#aboMarketingSEO input,#aboMarketingSEO textarea{width:100%;min-width:0;box-sizing:border-box;font-size:16px}' +
    '@media(max-width:650px){.abo-market-grid{grid-template-columns:1fr}#aboMarketingPlanner,#aboMarketingSEO,#aboMarketingSavedPosts{padding:12px}.abo-market-actions button{flex:1}}';
  document.head.append(style);
  const host = text('div');
  host.id = 'aboMarketingPlanner';
  host.innerHTML = '<h3>🗓️ Mijn marketingcampagnes</h3>' +
    '<p class="small muted">Plan campagnes. Concepten worden per ingelogd account op dit toestel bewaard, niet in de cloud. Gebruik dit niet voor gevoelige gegevens; er is geen echte koppeling met advertentieaccounts.</p>' +
    '<form id="aboCampaignForm"><div class="abo-market-grid">' +
    '<div><label for="aboCampTitle">Campagnenaam</label><input id="aboCampTitle" maxlength="100" required placeholder="Bijv. Herfstactie"></div>' +
    '<div><label for="aboCampChannel">Kanaal</label><select id="aboCampChannel"></select></div>' +
    '<div><label for="aboCampDate">Geplande datum</label><input type="date" id="aboCampDate" required></div>' +
    '<div><label for="aboCampBudget">Maximaal gepland budget (€)</label><input type="number" min="0" max="1000000" step="0.01" value="0" id="aboCampBudget"></div>' +
    '<div><label for="aboCampState">Status (handmatig)</label><select id="aboCampState"></select></div>' +
    '<div><label for="aboCampGoal">Doel</label><input id="aboCampGoal" maxlength="160" placeholder="Bijv. meer websitebezoekers"></div>' +
    '</div><div class="abo-market-actions"><button type="submit" id="aboCampSave">💾 Campagne bewaren</button><button type="button" class="secondary" id="aboCampReset">Nieuw formulier</button></div>' +
    '<p id="aboCampStatus" role="status" class="toast abo-market-status"></p></form>' +
    '<div class="abo-market-actions"><button type="button" class="secondary" id="aboCampExport">⬇️ Export CSV</button></div>' +
    '<div id="aboCampList"></div><p class="small muted">Budgetten en statussen vul je zelf in; er worden geen advertenties gestart, geen echte kosten gemaakt en geen resultaten uit platforms opgehaald.</p>';
  hub.after(host);
  const postSection = text('div');
  postSection.id = 'aboMarketingSavedPosts';
  postSection.innerHTML = '<h3>📚 Mijn bewaarde berichten</h3>' +
    '<p class="small muted">Bewaar de tekst uit de socialmedia-maker. Concepten zijn per account gescheiden op dit toestel en worden niet naar andere apparaten gesynchroniseerd.</p>' +
    '<div class="abo-market-actions"><button type="button" class="secondary" id="aboPostSave">💾 Bewaar huidig bericht</button></div>' +
    '<p id="aboPostStatus" role="status" class="toast abo-market-status"></p><div id="aboPostList"></div>';
  host.after(postSection);
  const legacyBox = text('div');
  legacyBox.id = 'aboOldMarketingImport';
  legacyBox.hidden = true;
  legacyBox.className = 'abo-market-item';
  legacyBox.append(text('p','Oude marketingconcepten van dit toestel gevonden. Die zijn nog niet aan een account gekoppeld. Importeer ze alleen als ze van jou zijn.','small'));
  const legacyButton = btn('📥 Mijn oude concepten overnemen', () => {
    if (!canEdit()) {postStatus.textContent='Log eerst in met een actief abonnement.';return;}
    const oldCampaigns = load(legacyMarketingKey,MAX_CAMPAIGNS,normalizeCampaign);
    const oldPosts = load(legacyPostsKey,MAX_POSTS,normalizePost);
    if (!oldCampaigns.length && !oldPosts.length) {legacyBox.hidden=true;return;}
    if (!window.confirm('Zijn dit jouw eigen concepten? Ze worden toegevoegd aan dit ingelogde account op dit toestel.')) return;
    const campaignIds = new Set(campaigns.map(c=>c.id));
    const postIds = new Set(posts.map(p=>p.id));
    const nextCampaigns = [...campaigns,...oldCampaigns.filter(c=>!campaignIds.has(c.id))].slice(0,MAX_CAMPAIGNS);
    const nextPosts = [...posts,...oldPosts.filter(p=>!postIds.has(p.id))].slice(0,MAX_POSTS);
    if (store(marketingKey(),nextCampaigns,postStatus) && store(postsKey(),nextPosts,postStatus)) {
      campaigns=nextCampaigns;posts=nextPosts;
      localStorage.removeItem(legacyMarketingKey);
      localStorage.removeItem(legacyPostsKey);
      legacyBox.hidden=true;renderCampaigns();renderPosts();
      postStatus.textContent='✅ Oude concepten aan jouw account op dit toestel toegevoegd.';
    }
  });
  legacyBox.append(legacyButton);
  postSection.append(legacyBox);
  const seo = text('div');
  seo.id = 'aboMarketingSEO';
  seo.innerHTML = '<h3>🔎 Mijn SEO-controle</h3>' +
    '<p class="small muted">Controleer teksten voor een website in Google. Dit is een lokale inhoudscontrole, geen zoekmachine-audit of garantie op indexering.</p>' +
    '<div class="abo-market-actions"><button type="button" class="secondary" id="aboSeoFromSite">↙ Gebruik mijn websitegegevens</button></div>' +
    '<label for="aboSeoTitle">Paginatitel</label><input id="aboSeoTitle" maxlength="140" placeholder="Bijv. Schoonheidssalon Zonhoven | Bedrijfsnaam">' +
    '<label for="aboSeoDescription">Beschrijving voor zoekmachines</label><textarea id="aboSeoDescription" rows="3" maxlength="360" placeholder="Wat biedt je bedrijf aan en waarom is het interessant?"></textarea>' +
    '<label for="aboSeoKeyword">Belangrijk zoekwoord (optioneel)</label><input id="aboSeoKeyword" maxlength="70" placeholder="Bijv. schoonheidssalon Zonhoven">' +
    '<div class="abo-market-actions"><button type="button" id="aboSeoCheck">🔎 Controleer mijn teksten</button></div>' +
    '<div class="abo-market-preview"><strong id="aboSeoPreviewTitle">Paginatitel verschijnt hier</strong><p id="aboSeoPreviewDescription" class="small muted">De beschrijving verschijnt hier.</p></div>' +
    '<div id="aboSeoReport" role="status" class="abo-market-status" style="margin-top:10px"></div>' +
    '<p class="small muted">Google bepaalt zelf wat het toont. Deze controle verstuurt geen gegevens naar Google en registreert geen domein.</p>';
  postSection.after(seo);
  const campaignChannel = $('aboCampChannel'), campaignState = $('aboCampState');
  channels.forEach(name => { const opt=text('option',name); opt.value=name; campaignChannel.append(opt); });
  states.forEach(name => { const opt=text('option',name); opt.value=name; campaignState.append(opt); });
  $('aboCampDate').value = today();
  const form = $('aboCampaignForm'), status = $('aboCampStatus'), list = $('aboCampList');
  let editing = null;
  function renderCampaigns() {
    list.replaceChildren();
    const sorted = [...campaigns].sort((a,b)=>a.date.localeCompare(b.date));
    const header = text('p', sorted.length + ' bewaarde campagnes · gepland budget samen: ' +
      new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'}).format(
        sorted.reduce((sum,x) => sum+x.budget,0)), 'small');
    list.append(header);
    if (!sorted.length) list.append(text('p','Nog geen campagnes opgeslagen.','small muted'));
    sorted.forEach(item => {
      const card = text('article',undefined,'abo-market-item');
      card.append(text('strong',item.title));
      card.append(text('p',item.date+' · '+item.channel+' · '+item.state,'small'));
      card.append(text('p','Doel: '+(item.goal||'niet ingevuld')+' | Budget: '+
        new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'}).format(item.budget),'small muted'));
      const actions=text('div',undefined,'abo-market-actions');
      actions.append(btn('✏️ Bewerken',() => {
        if (!canEdit()) {status.textContent='Log in met een actief abonnement om te bewerken.';return;}
        editing=item.id;
        $('aboCampTitle').value=item.title;
        campaignChannel.value=item.channel;
        $('aboCampGoal').value=item.goal;
        $('aboCampDate').value=item.date;
        $('aboCampBudget').value=String(item.budget);
        campaignState.value=item.state;
        $('aboCampSave').textContent='💾 Wijzigingen bewaren';
        form.scrollIntoView({behavior:'smooth',block:'start'});
      }));
      actions.append(btn('🗑️ Verwijderen',() => {
        if (!canEdit()) {status.textContent='Log in met een actief abonnement om te verwijderen.';return;}
        if (!window.confirm('Deze campagne van dit toestel verwijderen?')) return;
        const next=campaigns.filter(x=>x.id!==item.id);
        if (store(marketingKey(),next,status)) {
          campaigns=next;resetCampaignForm();renderCampaigns();
          status.textContent='Campagne verwijderd.';
        }
      }));
      card.append(actions);list.append(card);
    });
    $('aboCampExport').disabled = !campaigns.length;
  }
  function resetCampaignForm() {
    editing=null;form.reset();$('aboCampDate').value=today();
    $('aboCampSave').textContent='💾 Campagne bewaren';
  }
  $('aboCampReset').addEventListener('click',resetCampaignForm);
  form.addEventListener('submit',event => {
    event.preventDefault();
    if (!canEdit()) {status.textContent='💎 Log in met Starter of hoger om campagnes te bewaren.';return;}
    const item=normalizeCampaign({id:editing||makeId(),title:$('aboCampTitle').value,
      channel:campaignChannel.value,goal:$('aboCampGoal').value,
      date:$('aboCampDate').value,budget:$('aboCampBudget').value,state:campaignState.value});
    if (!item || !validDate($('aboCampDate').value)) {
      status.textContent='Vul een naam en geldige datum in.';return;
    }
    const amount=Number($('aboCampBudget').value);
    if(!Number.isFinite(amount)||amount<0||amount>1000000){
      status.textContent='Het budget moet tussen 0 en 1.000.000 euro liggen.';return;
    }
    if(!editing&&campaigns.length>=MAX_CAMPAIGNS){
      status.textContent='Maximaal 40 campagnes. Verwijder eerst een oud concept.';return;
    }
    const next=editing?campaigns.map(x=>x.id===editing?item:x):[...campaigns,item];
    if(store(marketingKey(),next,status)){
      campaigns=next;resetCampaignForm();renderCampaigns();
      status.textContent='✅ Campagne op dit toestel bewaard. Er is niets gepubliceerd of betaald.';
    }
  });
  function csvValue(v) {
    const raw=String(v==null?'':v);
    // Voorkom formule-uitvoering wanneer een CSV in Excel wordt geopend.
    const escaped=/^[\s]*[=+\-@]/.test(raw) ? "'" + raw : raw;
    return '"' + escaped.replace(/"/g,'""') + '"';
  }
  $('aboCampExport').addEventListener('click',() => {
    if (!canEdit()) {status.textContent='Log in met een actief abonnement om te exporteren.';return;}
    if (!campaigns.length) {status.textContent='Bewaar eerst een campagne.';return;}
    const lines=[['Naam','Kanaal','Doel','Budget EUR','Geplande datum','Status'].map(csvValue).join(';')];
    campaigns.forEach(c => lines.push([c.title,c.channel,c.goal,c.budget,c.date,c.state].map(csvValue).join(';')));
    const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download='allbiz-marketingcampagnes.csv';
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),15000);
    status.textContent='✅ CSV gedownload met jouw handmatig ingevulde campagnegegevens.';
  });
  const postStatus=$('aboPostStatus'),postList=$('aboPostList');
  async function copyPost(content) {
    try{await navigator.clipboard.writeText(content);postStatus.textContent='✅ Tekst gekopieerd.';}
    catch{postStatus.textContent='Kopiëren niet beschikbaar. Open het concept en selecteer de tekst.';}
  }
  function renderPosts() {
    postList.replaceChildren();
    if (!posts.length) postList.append(text('p','Nog geen berichten bewaard.','small muted'));
    posts.forEach(p => {
      const card=text('article',undefined,'abo-market-item');
      card.append(text('strong',p.channel||'Socialmedia-bericht'));
      card.append(text('p',p.content,'small'));
      const actions=text('div',undefined,'abo-market-actions');
      actions.append(btn('↗ Open concept',() => {
        if (!canEdit()) {postStatus.textContent='Log in om concepten te openen.';return;}
        $('marketingOutput').value=p.content;
        $('marketingCopy').disabled=false;
        $('marketingOutput').scrollIntoView({behavior:'smooth',block:'center'});
        postStatus.textContent='Concept geopend. Er is niets geplaatst.';
      }));
      actions.append(btn('📋 Kopieer',()=> {
        if (!canEdit()) {postStatus.textContent='Log in om te kopiëren.';return;}
        void copyPost(p.content);
      }));
      actions.append(btn('🗑️ Verwijder',() => {
        if (!canEdit()) {postStatus.textContent='Log in om te verwijderen.';return;}
        if (!window.confirm('Dit bewaarde bericht verwijderen?')) return;
        const next=posts.filter(x=>x.id!==p.id);
        if(store(postsKey(),next,postStatus)){posts=next;renderPosts();postStatus.textContent='Bericht verwijderd.';}
      }));
      card.append(actions);postList.append(card);
    });
  }
  $('aboPostSave').addEventListener('click',() => {
    if (!canEdit()) {postStatus.textContent='💎 Log in met Starter of hoger om berichten te bewaren.';return;}
    const content=$('marketingOutput')?.value?.trim()||'';
    if(!content){postStatus.textContent='Maak eerst een socialmedia-bericht.';return;}
    if(posts.length>=MAX_POSTS){postStatus.textContent='Maximaal 40 berichten. Verwijder eerst een oud concept.';return;}
    const c=$('marketingChannel');
    const post=normalizePost({id:makeId(),content,channel:c?.selectedOptions?.[0]?.textContent||'Social media',
      savedAt:new Date().toISOString()});
    if(!post)return;
    const next=[post,...posts];
    if(store(postsKey(),next,postStatus)){posts=next;renderPosts();postStatus.textContent='✅ Concept lokaal bewaard; niets gepubliceerd.';}
  });
  function seoReport() {
    const title=$('aboSeoTitle').value.trim(),desc=$('aboSeoDescription').value.trim();
    const word=$('aboSeoKeyword').value.trim().toLowerCase();
    $('aboSeoPreviewTitle').textContent=title||'Paginatitel verschijnt hier';
    $('aboSeoPreviewDescription').textContent=desc||'De beschrijving verschijnt hier.';
    const checks=[];
    if(title.length>=30&&title.length<=60)checks.push('✅ Titel heeft een gebruikelijke lengte (30–60 tekens).');
    else checks.push('ℹ️ Maak de titel bij voorkeur 30–60 tekens ('+title.length+' nu).');
    if(desc.length>=70&&desc.length<=160)checks.push('✅ Beschrijving heeft een gebruikelijke lengte (70–160 tekens).');
    else checks.push('ℹ️ Maak de beschrijving bij voorkeur 70–160 tekens ('+desc.length+' nu).');
    if(word){
      checks.push((title.toLowerCase().includes(word)?'✅':'ℹ️')+' Zoekwoord '+(title.toLowerCase().includes(word)?'staat in':'ontbreekt in')+' de titel.');
      checks.push((desc.toLowerCase().includes(word)?'✅':'ℹ️')+' Zoekwoord '+(desc.toLowerCase().includes(word)?'staat in':'ontbreekt in')+' de beschrijving.');
    }
    checks.push('ℹ️ Controleer ook de inhoud, mobiele weergave en indexering van de echte online website.');
    const area=$('aboSeoReport');
    area.replaceChildren();
    checks.forEach(line=>area.append(text('p',line,'small')));
  }
  $('aboSeoCheck').addEventListener('click',seoReport);
  $('aboSeoFromSite').addEventListener('click',() => {
    const brand=$('brand')?.value?.trim()||'';
    const slogan=$('description')?.value?.trim()||'';
    const about=$('siteAbout')?.value?.trim()||'';
    $('aboSeoTitle').value=(brand+(slogan?' | '+slogan:'')).slice(0,140);
    $('aboSeoDescription').value=(about||slogan).slice(0,360);
    seoReport();
  });
  function reloadForAccount() {
    const id = typeof window.allbizCurrentUserId === 'string' &&
      /^[0-9a-f-]{36}$/i.test(window.allbizCurrentUserId) ? window.allbizCurrentUserId : null;
    if (id === currentUserId) return;
    currentUserId = id;
    campaigns = id ? load(marketingKey(),MAX_CAMPAIGNS,normalizeCampaign) : [];
    posts = id ? load(postsKey(),MAX_POSTS,normalizePost) : [];
    resetCampaignForm();
    ['marketingSubject','marketingAudience','marketingOutput','aboSeoTitle','aboSeoDescription','aboSeoKeyword']
      .forEach(field => { const input=$(field); if(input)input.value=''; });
    if($('marketingCopy'))$('marketingCopy').disabled=true;
    $('aboSeoPreviewTitle').textContent='Paginatitel verschijnt hier';
    $('aboSeoPreviewDescription').textContent='De beschrijving verschijnt hier.';
    $('aboSeoReport').replaceChildren();
    legacyBox.hidden = !id || !(load(legacyMarketingKey,MAX_CAMPAIGNS,normalizeCampaign).length ||
      load(legacyPostsKey,MAX_POSTS,normalizePost).length);
    renderCampaigns();renderPosts();
    status.textContent = id ? 'Marketingconcepten van jouw account op dit toestel geladen.' :
      'Log in om je marketingconcepten te bekijken.';
  }
  window.addEventListener('allbiz-user-changed',reloadForAccount);
  reloadForAccount();
})();
