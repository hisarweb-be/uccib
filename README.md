# UCCIB website

Statische site van UCCIB, de Unie van Islamitische Culturele Centra van België,
in drie talen: Turks op de root, Nederlands onder `/nl/`, Frans onder `/fr/`.

Gebouwd met Astro 5 en Tailwind 4, geen server, geen database, geen betaalde
dienst. Uitrollen gaat via Cloudflare Pages; de stappen staan in
[README-DEPLOY.md](README-DEPLOY.md). Elke keuze met reden staat in
[docs/BESLUITEN.md](docs/BESLUITEN.md).

## Snel starten

```bash
npm ci
npm run dev        # lokale ontwikkelserver
npm run build      # 42 pagina's naar dist/
npm run verify     # keuring over dist/: veertien slugs x drie talen
```

## Waar staat wat

| Pad | Inhoud |
|---|---|
| `src/pages/` | Turkse routes (de root) |
| `src/pages/nl/`, `src/pages/fr/` | Nederlandse en Franse routes, zelfde slugs |
| `src/layouts/Layout.astro` | `<head>`, canonical, hreflang, skip-link, `main#hw-main` |
| `src/components/Header.astro` | Topbar met telefoon, e-mail en taalkeuze; logo, menu, doneerknop |
| `src/components/Footer.astro` | Adres, vijf snelkoppelingen, contactgegevens, onderste regel |
| `src/components/LeegPagina.astro` | Tijdelijke paginabasis met titel en h1 |
| `src/data/site.ts` | Vaste gegevens van de vzw en de veertien slugs |
| `src/i18n/{tr,nl,fr}.json` | Alle zichtbare tekst per taal |
| `src/styles/tokens.css` | Huisstijl-tokens uit de huidige site |
| `src/styles/TOKENS.md` | Herkomst en contrastmeting per token |
| `scripts/verify-pagina.mjs` | Keuring van één slug |
| `scripts/verify-alle.mjs` | Keuring van alle veertien slugs in drie talen |
| `scripts/verify-links.mjs` | Linkcontrole over `dist/` |

## Keuring van één pagina

```bash
node scripts/verify-pagina.mjs hakkimizda
node scripts/verify-pagina.mjs hakkimizda nl
```

Zonder slug keurt hij de hoofdpagina. Zonder taal alle drie de talen.
