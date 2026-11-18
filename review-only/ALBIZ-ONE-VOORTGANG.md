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
- [x] Recovery worker + tijdelijke PostgreSQL claim/finish geïntegreerd en succesvol getest (commit 5eaa414798d002b49089a7346a0fab3f9f3873b0, run 44375622763). De eerdere fixture-triggerfout is verholpen.
- [x] Verlopen lease, herstel na worker-crash, oude-tokenbeveiliging getest in tijdelijke PostgreSQL (commit e53d58364cc8258ff03efa55bb1e251583613197, run 44375905478; 17/17 workflows geslaagd).
- [x] Gelijktijdige worker/webhook-achtige betaal-ID-koppeling getest in tijdelijke PostgreSQL (commit d1531508f3084a8589e24590dcb7eef518dfb07a, run 44376265121; 17/17 workflows geslaagd). Dit simuleert de attachment-race, niet de volledige live webhook.
- [x] Gelijktijdige worker/webhook-achtige betalingskoppeling getest in tijdelijke PostgreSQL (commit d1531508f3084a8589e24590dcb7eef518dfb07a, run 44376265121; 17/17 workflows geslaagd). Dit is nog geen volledige webhook/provider-integratietest.
- [x] Gelijktijdige webhook-achtige/worker payment attachment getest met twee echte PostgreSQL-sessies; één winnaar, consistente order/recovery (commit d1531508f3084a8589e24590dcb7eef518dfb07a, run 44376265121). Dit is nog geen echte webhookintegratie.

## OPEN — in volgorde
1. [ ] Provider mock met tijdelijke DB combineren en echte webhook-/worker-statusovergangen testen; de attachment-race is al afgerond.
2. [ ] Productie-SQL en Edge Functions als volledige, controleerbare wijzigingsset voorbereiden en rollbackplan uitwerken.
3. [ ] Pas na expliciete toestemming: productie-migraties en deploy; geen echte betalingen of automatische handel zonder aparte toestemming.
4. [ ] DSers/TikTok antwoorden verwerken zodra ontvangen; productimport en productradar vervolgens afwerken.

## Belangrijke grenzen
- De actieve webshop, Supabase productie en Mollie live blijven onaangeroerd bij review-only werk.
- Geslaagde geïsoleerde tests betekenen NIET dat de live checkout veilig is.
- Niets dubbel maken: eerst bestaande GitHub-bestanden, PR #4 en dit register controleren.
