# BESLUITEN

Elke keuze die tijdens F0 is gemaakt, met de reden in één regel. Wie later iets
wil terugdraaien, ziet hier waarom het zo staat.

## Repo en werkmap

| # | Besluit | Reden |
|---|---|---|
| 1 | Eigen repo in `D:\project\project\uccib\website`, niet in de bovenliggende repo | `D:/project` negeert `project/`; de site moet zelfstandig uitgerold kunnen worden. |
| 2 | Repo publiek op GitHub (`hisarweb-be/uccib`) | Cloudflare Pages en CI lezen een publieke repo zonder sleutel; er staan geen geheimen in. |
| 3 | Branch `main` als standaardtak | Eén tak voor een statische site; CI op elke push en pull request. |

## Framework en versies

| # | Besluit | Reden |
|---|---|---|
| 4 | Astro 5.18.2 in plaats van de nieuwste (7.4.12) | Astro 7 eist Node ≥22.23.4, deze laptop heeft 22.20.0; de brief vraagt Astro 5. |
| 5 | `@astrojs/sitemap` vastgezet op 3.7.4 | 3.7.5 trekt `sitemap@10` dat Node ≥22.22.1 eist; 3.7.4 werkt op 22.20.0. |
| 6 | `output: 'static'` | Cloudflare Pages Free serveert statische bestanden; geen server nodig (plan §3). |
| 7 | `trailingSlash: 'ignore'` | Bestaande links met en zonder slash blijven werken. |
| 8 | React-integratie meteen mee | Plan §3 voorziet React-eilanden (namaz-vakitleri, bağış); later toevoegen kost een migratie. |
| 9 | TypeScript strict plus `noUncheckedIndexedAccess` | Vangt ontbrekende sleutels in de vertaalwoordenboeken bij de build in plaats van op de pagina. |
| 10 | `astro check` in CI | Sjabloonfouten in `.astro`-bestanden komen zo boven water, niet pas in de browser. |

## Talen en routes

| # | Besluit | Reden |
|---|---|---|
| 11 | Turks op de root, Nederlands onder `/nl/`, Frans onder `/fr/` | Plan §3 en §8; de bestaande site is Turks op de root. |
| 12 | `prefixDefaultLocale: false` | De Turkse pagina's houden hun huidige adressen, dus geen omleidingen en geen gebroken QR-codes. |
| 13 | `redirectToDefaultLocale: false` | Voorkomt een omleiding die de canonical en de keuring zouden verstoren. |
| 14 | Slugs identiek in drie talen | Bestaande links en drukwerk blijven werken; de taalkeuze zit in het pad, niet in de slug. |
| 15 | Vertaalwoordenboeken in `src/i18n/{tr,nl,fr}.json` | Eén bestand per taal, leesbaar voor de redactie, geen code om een tekst te wijzigen. |
| 16 | `hreflang` gebruikt `tr-BE`, `nl-BE`, `fr-BE` | De vzw is Belgisch; de regionale variant helpt zoekmachines. |
| 17 | Ook `x-default` op de Turkse versie | De root is de standaard voor bezoekers zonder taalvoorkeur. |

## Huisstijl

| # | Besluit | Reden |
|---|---|---|
| 18 | Kleuren en maten letterlijk uit de themastijl van de huidige site | Brief eist: geen verzonnen kleuren, alles herleidbaar. |
| 19 | Tekst, links en knoppen op `#0f6b66` (`--cd`) in plaats van `#1f9e96` (`--c`) | `#1f9e96` haalt 3,29:1 op wit; tekst moet 4,5:1 halen. Meting in `TOKENS.md`. |
| 20 | `#1f9e96` alleen voor vlak, rand, icoon en focusring | Daar geldt de tekstnorm niet en blijft de huisstijl herkenbaar. |
| 21 | Open Sans en Noto Serif zelf gehost via fontsource | Zelfde twee families als nu, geen oproep naar Google, geen toestemmingsvraag en geen derde partij. |
| 22 | Vijf ongebruikte fontfamilies uit de huidige pagina weggelaten | Dosis, Roboto, Roboto Serif, Roboto Slab en Shanti worden door de site niet gebruikt. |
| 23 | Logo overgenomen als PNG van 1600×503 in `public/brand/` | Byte-identiek aan het origineel; later levert F3 een SVG of AVIF als dat beter uitkomt. |
| 24 | Favicon zelf getekend als SVG in de huisstijlkleuren | De huidige site heeft er geen die de keuring haalt; een SVG is klein en scherp. |

## Toegankelijkheid

| # | Besluit | Reden |
|---|---|---|
| 25 | `skip-link` naar `hw-main`, zichtbaar bij focus | Brief eist deze id; toetsenbordgebruikers slaan het menu over. |
| 26 | Focusring 3 px in `--c`, op donkere vlakken in `--cl` | Zichtbaar op zowel wit als `#2d3436`. |
| 27 | Alle topbar- en footertekst op een vlak dat 6,3:1 of meer haalt | De hele pagina moet nul axe-bevindingen geven. |
| 28 | `prefers-reduced-motion` schakelt alle animatie uit | Nu alvast, zodat de scrollcinema van F4 het niet kan vergeten. |
| 29 | Eén `<h1>` per pagina, koppen in het menu als `<h2>` | Kopniveau volgt de structuur; de keuring telt de h1. |

## Keuring en CI

| # | Besluit | Reden |
|---|---|---|
| 30 | Keuring leest `dist/`, niet de dev-server | Wat gekeurd wordt is precies wat uitgerold wordt. |
| 31 | Eigen statische server op een vrije poort in `scripts/lib/keuring.mjs` | Geen extra dependency (`http-server`, `serve`) en geen poortconflict. |
| 32 | Playwright met Chromium uit `D:\cache\ms-playwright` | Browser staat al op de laptop; `PLAYWRIGHT_BROWSERS_PATH` voorkomt schrijven op C:. |
| 33 | axe met de tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `best-practice` | Dekking van de norm die de brief noemt, plus de structuurregels. |
| 34 | Eén leesbare regel per fout, exitcode 1 | Zo leest CI meteen wat er stuk is, zonder logboek te ontleden. |
| 35 | Interne links in de HTML getoetst én apart in `verify-links.mjs` | De paginakeuring dekt de veertien slugs; de linkcontrole dekt ook sitemap en bestanden. |
| 36 | CI draait `npm ci`, `check`, `build`, `verify`, `verify:links` | Groen is de poort; `check` staat ervoor zodat een sjabloonfout eerder stopt. |
| 37 | CI bewaart `dist` zeven dagen als bewijs | Bij een rode run is meteen te zien wat er gebouwd is. |

## Wat bewust nog niet is gedaan

| # | Besluit | Reden |
|---|---|---|
| 38 | Geen Cloudflare-account, geen Sanity-account, geen DNS-wijziging | Brief verbiedt het; F1 en F2 doen de accounts met Altuner. |
| 39 | Niets aan de bestaande WordPress-site | Brief verbiedt het; de huidige site blijft live tot de nieuwe bewezen is. |
| 40 | Geen echte paginainhoud | Brief: veertien lege routes met titel en h1; F2 en F3 vullen de inhoud. |
| 41 | Geen GSAP of scrollcinema | Plan §3 zet dat in F4; nu zou het de laadtijd zonder inhoud meten. |
| 42 | Geen cookiebar | Plan §4: de site plaatst geen cookies, dus geen toestemmingsvraag. |
| 43 | Geen database, geen PHP, geen VPS | Plan §3: alles statisch op Cloudflare Pages Free. |

## CMS en Studio (F2)

> **Vervallen op 17 nov 2026.** De besluiten 44 tot en met 55 hieronder zijn
> historie: Sanity is die dag uit het project gehaald en vervangen door Sveltia
> CMS in `public/admin/` (besluit 56, onderaan dit bestand). Ze blijven staan
> omdat ze laten zien waarom de Studio zo gebouwd was; niets ervan geldt nog.

| # | Besluit | Reden |
|---|---|---|
| 44 | De Studio wordt bij elke bouw gemaakt, niet in de repo gezet | 22 MB en 787 bestanden; de map is een bouwproduct net als `dist/`. `npm run build` draait eerst `scripts/build-studio.mjs` (het `prebuild`-script), dus Cloudflare maakt `/beheer` zelf. Een map in de repo zou bij elke schemawijziging honderden bestanden in de historie zetten. |
| 45 | `sanity/` is een eigen npm-pakket met eigen `package-lock.json` | De Studio heeft Sanity 6, React 19 en styled-components nodig; die horen niet in de afhankelijkheden van de site. De bouwstap installeert ze één keer met `npm ci` als ze ontbreken. |
| 46 | `basePath: '/beheer'` staat op twee plekken: `sanity.config.ts` en `sanity.cli.ts` | Het eerste stuurt de router, het tweede de paden in de gebouwde HTML. Zonder het tweede schrijft de bouw `/static/...` en zoekt de browser de scripts op de wortel van de site. |
| 47 | Alle tekst uit `scripts/content/` komt één keer in de repo en gaat van daaruit twee kanten op | Naar `src/data/cms-fallback.json` en naar Sanity via `cms:import`. De site kan daardoor nooit iets anders tonen dan wat er in het CMS staat, en de offline kopie is per definitie gelijk. |
| 48 | De veertien pagina's staan er als 42 documenten (14 × 3 talen), elk met vaste `_id` | Eén document per combinatie; een dubbele slug kan niet ontstaan en een tweede import werkt bij in plaats van te verdubbelen. NL en FR hebben titel, h1 en beschrijving uit `src/i18n`; de body blijft Turks tot de redactie vertaalt. |
| 49 | De negen doneerbedragen zijn `sponsorblok`-documenten, geen proza op `/bagislar` | Het zijn knoppen met een betaallink; de redactie moet een bedrag kunnen uitzetten zonder de paginatekst te raken. |
| 50 | `getSponsorblokken()` valt bij een lege CMS-lijst terug op de offline kopie | Een verkeerd ingestelde filter of een half gevulde dataset mag de doneerknoppen niet laten verdwijnen. |
| 51 | `_redirects` bevat één regel: `/beheer` → `/beheer/` met status 301 | Cloudflare past `_redirects` toe vóór het zoeken van een bestand ("Redirects are always followed, regardless of whether or not an asset matches"). Een regel `/beheer/*` zou dus ook de 787 eigen js- en css-bestanden van de Studio vangen en hem leeg achterlaten. Diepe paden lost de bouw op met `public/beheer/404.html`, en de vier faviconpaden zet `scripts/build-studio.mjs` zelf recht naar `/beheer/static/...`. Beide staan met hun meting in `public/_redirects`. |
| 52 | Geen `404.html` voor de site in deze fase, wel `/beheer/404.html` | De Studio heeft er een nodig: Cloudflare zoekt bij een onbekend pad de dichtstbijzijnde `404.html` in de map zelf en anders omhoog, dus `/beheer/structuur/pagina` tekent de Studio en de router neemt het pad over. Voor de site zelf hoort een echte 404 met inhoud bij F3, samen met de paginatekst. |
| 53 | `sanity/structure.ts` heet `sanity/structuur.ts` | Een bestand met die naam naast het pakket `sanity` laat TypeScript `sanity/structure` als zichzelf oplossen: "Circular definition of import alias". Met een eigen naam kan die botsing niet ontstaan. |
| 54 | De wortel-`tsconfig.json` sluit `sanity/` uit | De Studio heeft eigen instellingen en eigen afhankelijkheden (`sanity/tsconfig.json`); `astro check` keurt de site, `npm run sanity:typecheck` keurt de Studio. |
| 55 | Een mislukte Studio-bouw stopt de hele bouw | Een site zonder werkende `/beheer` is niet wat uitgerold moet worden; stil doorgaan zou een groene uitrol met een kapot CMS geven. |

## Content layer en CMS (17 nov 2026)

| # | Besluit | Reden |
|---|---|---|
| 56 | Sanity gaat eruit; het bewerkscherm is Sveltia CMS in `public/admin/` | Sanity vroeg een account, een Studio-bouw van 787 bestanden en een webhook; de redactie gebruikt nu één scherm dat rechtstreeks Markdown in deze repo schrijft. Zonder database kan de site niets tonen wat niet in de repo staat, en elke wijziging van de voorzitter is een commit in de geschiedenis. Gratis, geen tweede account, geen server. |
| 57 | De inhoud staat als Markdown in `src/content/paginas/{tr,nl,fr}`, gelezen door `src/content.config.ts` | Eén bron voor de site en het bewerkscherm. `active: false` houdt een pagina op haar adres met noindex, buiten de sitemap en zonder link ernaartoe; `npm run verify` eist dat. |
| 58 | Verwijderen en aanmaken staan uit in het bewerkscherm (`create` en `delete` op false) | De veertien pagina's hebben elk een eigen plek in de menubalk en een eigen ontworpen kop. Een vijftiende pagina is een ontwerpbeslissing, geen schakelaar. |

### Vervallen door besluit 56 (Sanity eruit)

Deze nummers gelden niet meer; ze staan hierboven alleen als historie:
44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54 en 55.

Wat elk nummer verving:
- 44 tot en met 46 en 51 tot en met 55 gingen over de Studio-bouw, de paden en
  de pakketten; die zijn met de map `sanity/` verdwenen.
- 47 tot en met 50 gingen over de import vanuit `scripts/content/` naar Sanity en
  de offline kopie `cms-fallback.json`; de Markdown-bestanden zijn nu de enige
  bron (besluit 57).
- De Deploy Hook uit `README-DEPLOY.md` is niet meer nodig: een commit van het
  bewerkscherm is een push naar `main`, en die push is de trigger voor
  Cloudflare.
