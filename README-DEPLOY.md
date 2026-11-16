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

Elke pull request krijgt een eigen adres van de vorm
`https://<commit-hash>.uccib.pages.dev`. Dat is het adres waarop F1 en F2 keuren
voordat er iets naar het echte domein gaat.

## Deploy Hook (voor F2)

De keten uit plan §4 is: voorzitter publiceert in Sanity, Sanity stuurt een
webhook, Cloudflare bouwt opnieuw. Daarvoor is één Deploy Hook nodig.

1. Open het project in Cloudflare, kies **Settings** en dan **Builds & deployments**.
2. Scrol naar **Deploy hooks** en kies **Add deploy hook**.
3. Naam: `sanity-publicatie`. Branch: `main`.
4. Cloudflare toont één keer een adres van de vorm
   `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/<id>`.
   Kopieer dat meteen; het is daarna niet meer volledig zichtbaar.
5. Bewaar het adres als geheim in Sanity (of in de webhook-instelling van Sanity),
   nooit in deze repo. Zet het in `D:/paperclip`-kluisbeheer zoals de andere
   sleutels, niet in een bestand hier.

Een lege push of een nieuwe publicatie in Sanity start daarna binnen enkele
seconden een bouw. De doorlooptijd is volgens plan §4 45 tot 90 seconden.

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
| Bouwen | `npm run build` | Maakt 42 pagina's in `dist/` (veertien slugs in drie talen) |
| Keuren | `npm run verify` | Titel, beschrijving, één h1, afbeeldingen, interne links, canonical, drie hreflang en axe-core |
| Links | `npm run verify:links` | Elke interne verwijzing in `dist/` moet bestaan |

Op Cloudflare draait alleen `npm run build`; de keuringen draaien in GitHub
Actions (`.github/workflows/ci.yml`) en zijn de poort voor samenvoegen.

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
