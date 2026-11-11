# Mollie Connect — AllBiz One (voorbereiding)

Status op 11 november 2026: **geblokkeerd door Mollie-ontwikkelaarsbeoordeling**. Er is nog geen Mollie OAuth-app, client ID of client secret. Dit document is een implementatieplan, geen actieve betaalintegratie.

## Bestaande veilige status-endpoint

`GET https://woaifabvfqnnunxmhpkc.supabase.co/functions/v1/allbiz-mollie-connect`

De Supabase Edge Function `allbiz-mollie-connect` geeft een JSON-status terug met `configured:false`, `connected:false`, `payments_enabled:false`. Een OAuth-code wordt **niet** verwerkt; het endpoint geeft dan HTTP 503. Er worden geen API-sleutels of betaalgegevens gebruikt.

## Na Mollie-goedkeuring

1. Maak bij Mollie Developers → Your apps een Connect OAuth-app voor **AllBiz One**. Controleer bij Mollie welk Connect-product past bij het platformmodel en de gewenste betaalstromen.
2. Stel de redirect URI in op het **daadwerkelijk geïmplementeerde en geteste callback-endpoint**; een status-endpoint is nog geen OAuth-callback.
3. Bewaar de client secret uitsluitend als Supabase Edge Function Secret. Nooit in GitHub, HTML, JavaScript of chatberichten.
4. Implementeer OAuth authorization-code met een per-aanvraag cryptografisch willekeurige `state`, gekoppeld aan de ingelogde verkoper en korte vervaltijd. Verifieer de state vóór tokenuitwisseling.
5. Sla verkoperstokens versleuteld en uitsluitend server-side op; isoleer accounts per verkoper. Implementeer tokenvernieuwing, intrekken en herverbinden.
6. Implementeer een aparte webhook die gebeurtenissen als **signaal** gebruikt en de betaalstatus server-side bij Mollie opvraagt. Controleer verkoper, order, bedrag, valuta, idempotentie en status voordat digitale downloads of abonnementen worden vrijgegeven.
7. Test alle flows met Mollie-testbetalingen en zonder echte geldtransacties; controleer afgebroken, mislukte, dubbele en terugbetaalde betalingen.
8. Pas pas na geslaagde tests en vereiste goedkeuring de checkout en abonnementslogica aan. Verwijder Stripe niet eerder.

## Huidige beperkingen

- Geen Mollie OAuth-app of toestemming voor andere verkopers.
- Geen Mollie-betaalverwerking, webhook, subscriptions of verkopersuitbetaling.
- Bestaande Stripe-functies zijn ongemoeid gelaten.
- Live betalingen en live trading blijven buiten scope.

Beveiligingsprincipe: **fail closed** totdat alle benodigde koppelingen en controles aantoonbaar werken.
