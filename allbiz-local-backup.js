/* AllBiz One — lokale reservekopie zonder API of accounttoegang. */
(() => {
  'use strict';
  const dashboard = document.getElementById('allbizBackupPanel');
  if (!dashboard || !document.getElementById('allbizBackupDownload')) return;
  // Alleen eigen website- en webshopontwerpen; nooit login, Stripe- of brokersleutels.
  const keys = [
    'business-studio-products-v2',
    'business-studio-affiliate-v1',
    'allbiz-pro-builder-v1',
    'allbiz-pro-storefront-v1',
    'business-studio-brand',
    'business-studio-description',
    'business-studio-about',
    'business-studio-services',
    'business-studio-email',
    'business-studio-theme',
    'business-studio-domain',
    'business-studio-extension',
    'business-studio-adplan',
    'allbiz-affiliate-campaign-draft-v1',
    'allbiz-marketing-campaigns-v1',
    'allbiz-marketing-posts-v1'
  ];
  const structured = new Set([
    'business-studio-products-v2','business-studio-affiliate-v1',
    'allbiz-pro-builder-v1','allbiz-pro-storefront-v1',
    'business-studio-adplan','allbiz-affiliate-campaign-draft-v1',
    'allbiz-marketing-campaigns-v1','allbiz-marketing-posts-v1'
  ]);
  const arrayKeys = new Set(['business-studio-products-v2','business-studio-affiliate-v1',
    'allbiz-marketing-campaigns-v1','allbiz-marketing-posts-v1']);
  const status = document.getElementById('allbizBackupStatus');
  const download = document.getElementById('allbizBackupDownload');
  const restore = document.getElementById('allbizBackupRestore');
  const input = document.getElementById('allbizBackupFile');
  const notify = msg => { status.textContent = msg; };
  download.addEventListener('click', () => {
    try {
      if (typeof saveSiteSettings === 'function') saveSiteSettings();
      const saved = {};
      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value !== null) saved[key] = value;
      }
      if (!Object.keys(saved).length) {
        notify('Er zijn nog geen opgeslagen ontwerpen gevonden. Maak eerst een website, webshop of affiliateproduct.');
        return;
      }
      const backup = {
        format: 'allbiz-one-local-v1',
        createdAt: new Date().toISOString(),
        data: saved
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'allbiz-one-reservekopie-' + new Date().toISOString().slice(0,10) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      notify('✅ Reservekopie gedownload. Bewaar dit privébestand veilig; het kan je bedrijfsgegevens en affiliate-links bevatten.');
    } catch (error) {
      notify('Reservekopie maken is mislukt. Controleer of downloads in de browser zijn toegestaan.');
    }
  });
  restore.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      notify('Dit bestand is te groot voor een lokale reservekopie (maximaal 15 MB).');
      return;
    }
    try {
      const backup = JSON.parse(await file.text());
      if (!backup || backup.format !== 'allbiz-one-local-v1' ||
          !backup.data || Array.isArray(backup.data) || typeof backup.data !== 'object') {
        throw new Error('Geen AllBiz One-reservekopie');
      }
      const toWrite = [];
      for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(backup.data, key)) continue;
        const value = backup.data[key];
        if (typeof value !== 'string' || value.length > 8 * 1024 * 1024) {
          throw new Error('Ongeldige gegevens');
        }
        if (structured.has(key)) {
          const parsed = JSON.parse(value);
          if (arrayKeys.has(key) ? !Array.isArray(parsed) :
              (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) {
            throw new Error('Ongeldig gegevensformaat');
          }
        }
        toWrite.push([key, value]);
      }
      if (!toWrite.length) throw new Error('Geen ondersteunde ontwerpen');
      const approve = window.confirm(
        'Reservekopie terugzetten?\n\n' +
        'De gegevens uit het bestand vervangen dezelfde opgeslagen ontwerpen op dit toestel. ' +
        'Je online account wordt niet gewijzigd. Wil je doorgaan?'
      );
      if (!approve) { notify('Terugzetten geannuleerd; je gegevens zijn niet gewijzigd.'); return; }
      const before = toWrite.map(([key]) => [key, localStorage.getItem(key)]);
      try {
        for (const [key,value] of toWrite) localStorage.setItem(key,value);
      } catch (err) {
        for (const [key,value] of before) {
          try {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key,value);
          } catch (_) {}
        }
        throw new Error('Lokale opslag onvoldoende');
      }
      notify('✅ Reservekopie teruggezet. De app wordt vernieuwd om je ontwerpen te tonen.');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      notify('Terugzetten mislukt: kies een geldige AllBiz One-reservekopie. Je ontwerpen zijn niet bewust gewist.');
    }
  });
})();