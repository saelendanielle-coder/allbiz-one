# AllBiz One – echte aandelen- en ETF-handel (voorbereiding)

Status: **NIET LIVE**. Dit document is een technisch/operationeel voorbereidingsplan, geen ingeschakelde brokerkoppeling of juridische goedkeuring.

## Gekozen kandidaat: tastytrade (rechtstreekse Open API)

- tastytrade vermeldt België als toegelaten land voor internationale individuele rekeningen: https://support.tastytrade.com/support/s/solutions/articles/43000435355
- De officiële API biedt OAuth2, `read` en `trade` scopes en order-API's: https://developer.tastytrade.com/docs/authentication/oauth2/
- Een **persoonlijke** OAuth-app is beperkt tot één eigen account. Om klanten van AllBiz One te verbinden is **trusted third-party verification** bij tastytrade vereist. Aanvragen via **api.support@tastytrade.com**; nooit een persoonlijk account/refresh-token voor andere klanten hergebruiken.
- Een mogelijke tweede route is SnapTrade Commercial (tastytrade Read & Trade), met eigen productiegoedkeuring en kosten: https://docs.snaptrade.com/docs/broker-access-guide / https://snaptrade.com/pricing
- Saxo LIVE nieuwe toepassingen zijn volgens Saxo's ontvangen antwoord tijdelijk niet beschikbaar. Niet wachten op Saxo als enige route.

## Wat de klant uiteindelijk kan doen

1. Zich aanmelden bij AllBiz One en een **eigen** tastytrade-rekening openen/koppelen via het **door de broker gehoste OAuth-aanmeldscherm** met 2FA.
2. Saldo, posities en openstaande orders **alleen van die klant** in AllBiz One zien; rekening- en autorisatieniveau controleren.
3. Aandelen/ETF's selecteren (begin zonder opties, marge, futures, crypto of automatische handel).
4. Orderdetails en kosten/risico's zien, server-side dry-run/validatie door broker, dan **aparte expliciete bevestiging door de klant**.
5. Order eenmaal verzenden, status bij broker verifiëren en de echte status tonen. Geen verzonnen koers, saldo, winst of uitvoering.
6. Storten en opnemen gebeurt bij de broker, niet via AllBiz One.

## Vereiste vrijgaven vóór LIVE

- [ ] Bevestiging van tastytrade dat deze zakelijke use case en Belgische eindklanten worden toegelaten; officiële derde-partijgoedkeuring en eventuele overeenkomst.
- [ ] Belgische financiële-juridische beoordeling (onder meer FSMA, ontvangen/doorgeven orders, bemiddeling, marketing en voorwaarden), met schriftelijke conclusie over benodigde vergunning/registratie of geschikte uitzondering/constructie.
- [ ] Openbare professionele website met juiste ondernemingsgegevens en privacyverklaring; adreswijziging KBO nog apart te controleren.
- [ ] Een testbrokeraccount en OAuth-app voor ontwikkeling, beveiligde test van inloggen / lezen / orderpreview / orders op sandbox.
- [ ] Server-only OAuth client secret; klant-refresh-tokens versleuteld per gebruiker; geen gevoelige sleutels in publieke GitHub of JavaScript.
- [ ] Beveiligde Supabase Edge Functions met **geverifieerde gebruikersauthenticatie** en per-klant rechten; database RLS/isolatie; geen toegang tot accountnummer van andere gebruikers.
- [ ] OAuth `state` per sessie, korte levensduur, eenmalig gebruik; callback en scopes beperken; tokens kunnen intrekken.
- [ ] Brokerorder: strikte servervalidatie, orderpreview, bevestiging per order, identieke payload controleren, unieke orderreferentie, bescherming tegen dubbel verzenden, niet automatisch herhalen na timeout.
- [ ] Limits op inleg/risico, gebruikerswaarschuwingen, instrumentrestricties, logging zonder tokens, incidentprocedure en onafhankelijke test.
- [ ] Productiecredentials, toestemming van broker en compliance expliciet bevestigd, pas dan opt-in feature flag `ALLBIZ_TRADING_LIVE_ENABLED` inschakelen.

## Voorgestelde technische modules

- `supabase/functions/allbiz-trading-oauth`: alleen geverifieerde AllBiz One-gebruiker; OAuth start/callback met statuscontrole en beveiligde tokenopslag.
- `supabase/functions/allbiz-trading-accounts`: eigenaar/geautoriseerde brokeraccount controleren, balances/positions/open orders ophalen.
- `supabase/functions/allbiz-trading-orders`: valideren → broker dry-run → afzonderlijke user confirmation → trade plaatsen → orderstatus ophalen; éénmalige uitvoering.
- `allbiz-trading-client.js`: echte brokerstatus, login, portefeuille, ordervoorbereiding en bevestigingsstap; bij ontbrekende goedkeuring géén koop-/verkoopknop.
- `trading_connections` en `trading_order_intents` in database met RLS en versleutelde secrets. Geen publiek toegankelijke sleutels.

De code om echte orders te verzenden wordt **niet gedeployed** of geactiveerd tot externe goedkeuringen, beveiligingstests en gebruikersbevestigingsflow af zijn.

## Officiële documentatie

- https://tastytrade.com/api/
- https://developer.tastytrade.com/docs/authentication/oauth2/
- https://developer.tastytrade.com/docs/concepts/accounts-and-customers/
- https://www.fsma.be/nl/tussenpersonen-kredietgevers/wat-bemiddeling-bank-en-beleggingsdiensten
