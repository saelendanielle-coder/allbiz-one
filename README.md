# AllBiz One

AllBiz One is een webapplicatie voor ondernemers. De publieke webapplicatie staat in `index.html`.

## Betalingen

Mollie is de beoogde betaalprovider voor abonnementen (Starter €10, Pro €20, Business €30 per maand). De testomgeving heeft een geregistreerde succesvolle testverlenging; dit bevestigt niet automatisch dat live betalingen of toekomstige echte maandelijkse incasso's werken.

Oude Stripe-integraties kunnen nog aanwezig zijn in frontend, Edge Functions of database. Verwijder die pas na controle van alle aanroepen en vervangingen, zodat webshop en digitale downloads niet stukgaan.

## Andere integraties

Tastytrade OAuth en advertentieverbindingen (Google, Meta en TikTok) moeten onafhankelijk op werking, toestemming en tokenverval worden gecontroleerd. Schakel live trading niet in zonder vereiste goedkeuring en veiligheidscontroles.

## Veiligheid

Bewaar nooit geheime API-sleutels, OAuth-tokens of service-role sleutels in deze publieke repository. Gebruik uitsluitend server-side secrets.
