# Albiz One — voortgangsregister (18 november 2026)

**Doel:** voorkom dubbel werk. Controleer dit bestand en de bestaande bestanden vóór nieuwe werkzaamheden. Werk na iedere afgeronde stap de status bij.

## AFGEROND — niet opnieuw maken
- [x] Productfoto-opslag eerder gecontroleerd in de webshop; DSers en TikTok-toestemming zijn extern in behandeling (status opnieuw controleren wanneer antwoord binnenkomt).
- [x] Mollie provider failure, checkout catch, buyer status, webhook replay, recovery ownership, expiry en candidate guards als review-only modules en tests.
- [x] Review-only recovery SQL schema, claim/finish RPC, before-provider phase RPC en voorstel voor atomair voorraad-/orderherstel.
- [x] Review-only atomaire payment attachment SQL en echte tests in tijdelijke PostgreSQL.
- [x] Review-only mocked checkout (6 scenario's), webhook/recovery combinaties (11 checks) en recovery worker prototype (15 scenario's).
- [x] GitHub Actions: 17 testreeksen geslaagd op commit 982be03ba97654609180f90036333bb11aa2cd27; PostgreSQL job 135050903947 geslaagd.
- [x] Review-only herstelworker implementatieplan gedocumenteerd.

## OPEN — in volgorde
1. [ ] Recovery worker + echte tijdelijke PostgreSQL claim/finish koppelen in integratietest; geen productiegegevens.
2. [ ] Testen van provider mock + DB + webhook race en verlopen lease.
3. [ ] Productie-SQL en Edge Functions als volledige, controleerbare wijzigingsset voorbereiden en rollbackplan uitwerken.
4. [ ] Pas na expliciete toestemming: productie-migraties en deploy; geen echte betalingen of automatische handel zonder aparte toestemming.
5. [ ] DSers/TikTok antwoorden verwerken zodra ontvangen; productimport en productradar vervolgens afwerken.

## Belangrijke grenzen
- De actieve webshop, Supabase productie en Mollie live blijven onaangeroerd bij review-only werk.
- Geslaagde geïsoleerde tests betekenen NIET dat de live checkout veilig is.
- Niets dubbel maken: eerst bestaande GitHub-bestanden, PR #4 en dit register controleren.
