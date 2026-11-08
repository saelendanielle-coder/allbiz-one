# Tastytrade-integratie — veilige ontwikkelstatus (8 november 2026)

## Huidige toestand
- Website: `index.html` bevat een trading-oefenonderdeel; geen live brokerorders.
- Supabase Edge Function: `allbiz-tastytrade-callback` bestaat maar is een placeholder die geen autorisatiecodes omwisselt of tokens bewaart.
- De aanvraag voor trusted third-party OAuth-toegang loopt bij tastytrade API Support. Productietoegang is niet bevestigd.
- De bestaande callback-URL is `https://woaifabvfqnnunxmhpkc.supabase.co/functions/v1/allbiz-tastytrade-callback`.
- Er zijn geen API-sleutels of refresh tokens in dit document opgenomen.

## Vereiste stappen voor sandbox
1. Verifieer bij tastytrade de exacte sandboxgebruikersnaam, OAuth-clientnaam, geregistreerde redirect URI en scopes; stuur **nooit** client secret of refresh token via e-mail of publieke GitHub.
2. Bepaal veilige server-side secret-opslag en per-gebruiker versleutelde tokenopslag. Controleer toegangsbeleid (RLS), gebruikersidentiteit, herroepbaarheid en auditlogs.
3. Bouw een geauthenticeerd startpunt voor OAuth met een willekeurige, eenmalige, kortlevende `state` en koppel de callback aan de juiste ingelogde gebruiker. Geen tokens of autorisatiecodes in logs.
4. Wissel pas na verificatie van `state` de autorisatiecode server-side uit. Sandbox-API: `https://api.cert.tastyworks.com`; stuur `User-Agent: allbiz-one/1.0`.
5. Test alleen sandbox-leestoegang, tokenvernieuwing, 401/403-afhandeling, afmelden en herroepen. Voer geen echte transacties uit.
6. Test daarna sandboxorder-preview/dry-run en orderbevestiging, met dubbele-orderbeveiliging en duidelijke risicowaarschuwingen.

## Vereisten voor productie (niet activeren zonder akkoord)
- Schriftelijke trusted third-party-goedkeuring van tastytrade en correcte production OAuth-client.
- Belgische/EU juridische beoordeling van de aangeboden handelsdiensten, brokerbeschikbaarheid, vergunningen en klantbescherming.
- Penetratietest/beveiligingsreview, privacybeleid, incidentproces, monitoring en klantondersteuning.
- Scheid sandbox- en productieconfiguratie strikt. Productieorders alleen na expliciete gebruikersbevestiging en afzonderlijke vrijgave.

## Veiligheidsregels
- Nooit `client_secret`, `refresh_token`, `service_role` of private gebruikersgegevens in `index.html`, publieke repository of browseropslag.
- Nooit orders automatisch indienen of een mislukte/ondubbelzinnige order blind opnieuw proberen.
- De huidige oefenfunctie blijft ongewijzigd tot de koppeling aantoonbaar veilig werkt.

Documentatie: https://developer.tastytrade.com/docs/authentication/oauth2/
