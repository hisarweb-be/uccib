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
