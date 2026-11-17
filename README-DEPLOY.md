# Uitrollen op Cloudflare Pages

Deze site is statisch: Cloudflare Pages bouwt `npm run build` en serveert `dist/`.
Er is geen server, geen database en geen betaalde dienst nodig. Het gratis plan
van Cloudflare Pages volstaat (plan §3).

Dit bestand beschrijft de stappen. Er is in F0 **geen** Cloudflare-account
aangemaakt en niets aan het domein gewijzigd; dat gebeurt in F2 samen met Altuner.

## Eenmalig: project aanmaken

1. Log in op https://dash.cloudflare.com en kies **Workers & Pages**.
2. Kies **Create** en dan de tab **Pages**, daarna **Connect to Git**.
3. Geef Cloudflare toegang tot de GitHub-organisatie `hisarweb-be` en kies de
   repo **hisarweb-be/uccib**.
4. Vul het bouwformulier in:

   | Veld | Waarde |
   |---|---|
   | Project name | `uccib` |
   | Production branch | `main` |
   | Framework preset | `Astro` (of `None`, de commando's hieronder gelden dan) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | leeg laten |

5. Zet onder **Environment variables** één variabele:

   | Naam | Waarde |
   |---|---|
   | `NODE_VERSION` | `22` |

   Zonder deze variabele bouwt Cloudflare met een oudere Node en stopt Astro 5.

6. Kies **Save and Deploy**. De eerste bouw duurt ongeveer een minuut. Daarna
   staat de site op `https://uccib.pages.dev` en bouwt elke push naar `main`
   opnieuw.

## Preview-adressen

Elke pull request die Cloudflare bouwt, krijgt een eigen adres van de vorm
`https://<uitrol-id>.uccib.pages.dev`, waarbij de uitrol-id de eerste acht tekens
van de uitrol zijn (`f7d228ef` bijvoorbeeld). Dat is het adres waarop F1 en F2
keuren voordat er iets naar het echte domein gaat.

Het is niet het commit-hash-adres: `https://<commit-hash>.uccib.pages.dev` geeft
404 (gemeten 17 nov 2026 op `14dc567`). De id staat in Cloudflare onder
**Deployments**, of komt uit
`npx --yes wrangler@4.97.0 pages deployment list --project-name uccib`.

## Publiceren zonder Deploy Hook (17 nov 2026)

Sinds de herbouw van 17 november 2026 is Sanity vervallen (besluit 56 in
`docs/BESLUITEN.md`) en is er geen Deploy Hook meer nodig. De redactie werkt in
Sveltia CMS op `/admin/`, en dat schrijft rechtstreeks naar deze repo:

1. De voorzitter bewerkt een pagina in `https://uccib.pages.dev/admin/`.
2. Sveltia doet een commit op `main` (via de GitHub-token in het bewerkscherm).
3. Cloudflare ziet de push en bouwt opnieuw. Doorlooptijd 45 tot 90 seconden.

Er is dus geen webhook, geen geheim en geen instelling in Cloudflare voor nodig:
de push naar `main` is de trigger. Wie handmatig wil uitrollen, kan dat met
`npx --yes wrangler@4.97.0 pages deploy dist --project-name uccib --branch main`.

De oude Sanity-keten staat hieronder als historie; die is niet meer van
toepassing.

### Vervallen: Deploy Hook via Sanity

De keten uit plan §4 was: voorzitter publiceert in Sanity, Sanity stuurt een
webhook, Cloudflare bouwt opnieuw. Daarvoor was één Deploy Hook nodig
(`sanity-publicatie`, branch `main`). Met Sanity eruit is die hook nergens meer
voor nodig; hij kan in Cloudflare worden ingetrokken.

## Eigen domein (F2, niet in F0)

Pas doen als de site op het preview-adres gekeurd is:

1. In Cloudflare Pages onder **Custom domains** het domein toevoegen.
2. Cloudflare zet zelf de juiste DNS-records als het domein al bij Cloudflare
   loopt. Loopt het elders, dan volgen de CNAME-records uit het scherm.
3. De bestaande WordPress-site blijft staan tot de nieuwe site op het echte
   domein groen is. Omzetten is een bewuste handeling van Altuner, geen
   automatische stap.

## Wat de bouw doet

| Stap | Commando | Wat het doet |
|---|---|---|
| Typen | `npm run check` | Controleert de `.astro`- en `.ts`-bestanden |
| Bouwen | `npm run build` | Veertien slugs in drie talen (42 routes) plus een 404; de bouw meldt 43 pagina's. `dist/admin/` komt uit `public/` |
| Keuren | `npm run verify` | Titel, beschrijving, één h1, afbeeldingen, interne links, canonical, drie hreflang en axe-core |
| Links | `npm run verify:links` | Elke interne verwijzing in `dist/` moet bestaan |
| Server | `npm run verify:server` | De statische server zelf, met een tegenproef die MOET afkeuren |
| Elke pagina | `npm run verify:elke` | Elke pagina apart met een eigen regel in de uitkomst, ook tegen de levende site (`--basis`) |
| Telefoon | `npm run verify:mobiel` | Tikdoelen van 44 px, niets buiten het scherm, scrollen met een echte vinger |
| Scherm | `npm run verify:scherm` | Het eerste scherm in pixels: gemiddelde helderheid en spreiding, met drie tegenproeven |

Op Cloudflare draait alleen `npm run build`. In GitHub Actions
(`.github/workflows/ci.yml`) draaien `check`, `build`, `verify` en
`verify:links`; die vier zijn de poort voor samenvoegen. De vier zware poorten
eronder (`verify:server`, `verify:elke`, `verify:mobiel`, `verify:scherm`)
vragen een browser en draaien op de laptop vóór de uitrol. Een groene CI zegt dus
niets over het eerste scherm; die meting staat in `verify:scherm` en hoort bij
elke oplevering.

## Lokaal naspelen

```bash
npm ci
npm run check
npm run build
npm run verify
npm run verify:links
```

Voor de keuring is Chromium nodig. Op deze laptop staat hij in
`D:\cache\ms-playwright`; de keuring zet `PLAYWRIGHT_BROWSERS_PATH` zelf goed.
Op een andere machine eenmalig `npx playwright install chromium`.
