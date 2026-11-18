# Albiz One — Mollie checkout safety review (18 november 2026)

Status: **voorbereiding; niet gedeployed; geen echte betaling uitvoeren**.

## Bestaande implementatie (gecontroleerd)
- Edge Function `allbiz-store-mollie-checkout` reserveert voorraad via `allbiz_reserve_mollie_store_checkout` en maakt daarna een Mollie-betaling aan.
- De functie koppelt het Mollie-betaal-ID via `allbiz_attach_mollie_store_payment`.
- In het algemene `catch`-blok wordt `allbiz_cancel_mollie_store_checkout` aangeroepen met `p_payment:null`.
- De annulering zet voorraad terug wanneer de order nog `pending` is.
- `allbiz-store-mollie-webhook` zoekt een order op aan de hand van het opgeslagen Mollie-betaal-ID en verifieert de betaalstatus bij Mollie.

## Beveiligingsprobleem
Als Mollie een betaling succesvol aanmaakt maar het koppelen van het betaal-ID aan de order mislukt, kan het `catch`-blok de order annuleren en voorraad vrijgeven. De betaling kan intussen nog bestaan en door de klant betaald worden. De webhook kan die betaling niet aan de order koppelen als het betaal-ID niet opgeslagen is.

## Vereiste oplossing vóór activatie
1. **Vóór de externe API-aanroep** een unieke checkoutpoging en idempotency key duurzaam registreren.
2. Na een succesvolle Mollie-response eerst het betaal-ID duurzaam koppelen; als dat mislukt, de order **niet** annuleren en de voorraad **niet** vrijgeven. Markeer voor herstel/onderzoek.
3. Annuleer een bestaande Mollie-betaling via de API waar mogelijk en verifieer de definitieve status vóór voorraad wordt vrijgegeven.
4. Een herstelproces moet verweesde pogingen op basis van ordermetadata en idempotency key kunnen reconciliëren. Vertrouw niet uitsluitend op een webhook die het betaal-ID in de order opzoekt.
5. Bij verlopen `pending`-orders zonder betaal-ID: eerst vaststellen of nooit een Mollie-betaling is aangemaakt. Zonder dit bewijs niet automatisch voorraad vrijgeven.
6. Maak alle afhandeling idempotent; test dubbele webhooks, gelijktijdige annulering/betaling, netwerkfouten, timeouts en dubbele checkoutaanvragen.
7. Pas de checkout-code en eventuele SQL-functies pas na een aparte review aan. Houd `MOLLIE_STORE_CHECKOUT_ENABLED` uitgeschakeld tijdens de testfase.

## Acceptatietests (zonder geld)
- Mollie-aanmaak faalt vóór het ontstaan van een betaal-ID: veilige annulering en voorraadherstel.
- Mollie-aanmaak slaagt, databasekoppeling faalt: **geen** voorraadherstel; herstelbare checkoutpoging.
- Betaling betaald + webhook tweemaal: order eenmaal betaald, voorraad eenmaal gereserveerd.
- Betaling geannuleerd/verlopen: voorraad precies eenmaal terug.
- Betaalstatus onbekend of Mollie tijdelijk onbereikbaar: order en reservering behouden.
- Twee klanten bestellen het laatste stuk: maximaal één succesvolle reservering.
- Geen echte betaaltransacties, geen wijzigingen aan gepubliceerde webshop of bestaande producten tijdens tests.

## Reeds geobserveerd
Eén verlopen pending €1-testorder van 14 november 2026 zonder gekoppeld Mollie-betaal-ID. Niet handmatig geannuleerd of gewijzigd. Geen bewijs dat de betaling nooit bij Mollie is aangemaakt.

Deze notitie is geen bewijs dat de problemen zijn opgelost. Implementatie en test blijven open.
