# Huisstijl-tokens en hun herkomst

Elke waarde in `src/styles/tokens.css` komt uit de huidige site. Bron: de themastijl
`style.css` (18 284 bytes) die bij de live site hoort, opgehaald naar
`D:\tmp\win\uccib-f0\css\style.css`, en de opgeslagen pagina `home2.html` op
`D:\tmp\win\uccib-analyse\home2.html`. Er is niets bijbedacht.

## Kleuren

| Token | Waarde | Herkomst | Rol |
|---|---|---|---|
| `--color-brand` | `#1f9e96` | `:root { --c }` | Vlakken, randen, iconen, focusring. **Nooit tekst.** |
| `--color-brand-dark` | `#0f6b66` | `:root { --cd }`, ook `.topbar` | Tekst, links, knoppen, topbarachtergrond |
| `--color-brand-light` | `#e8f5f4` | `:root { --cl }` | Zachte vlakken |
| `--color-ink` | `#33393b` | `:root { --t }` | Bodytekst en koppen |
| `--color-ink-muted` | `#5f6769` | `:root { --tm }` | Secundaire tekst |
| `--color-surface` | `#ffffff` | `:root { --w }`, `.hdr` | Pagina-achtergrond |
| `--color-surface-alt` | `#f5f7f7` | `:root { --g }`, `.sec.alt` | Afwisselende secties |
| `--color-line` | `#e3e8e8` | `:root { --line }` | Randen |
| `--color-footer` | `#2d3436` | `.ftr { background:#2d3436 }` | Footerachtergrond |
| `--color-footer-text` | `#cfd6d6` | `.ftr { color:#cfd6d6 }` | Footertekst |
| `--color-footer-line` | `#444b4d` | `.ftr-bottom { border-top:1px solid #444b4d }` | Scheidingslijn in de footer |

### Contrast (WCAG 2.1, gemeten met `D:\tmp\win\uccib-f0\contrast.mjs`)

Tekst moet 4,5:1 halen. Dat bepaalt welke kleur waar mag staan.

| Combinatie | Ratio | Oordeel |
|---|---|---|
| `#1f9e96` op wit | 3,29 | onder 4,5, dus geen tekst |
| wit op `#1f9e96` | 3,29 | onder 4,5, dus geen knoptekst |
| `#1f9e96` op `#f5f7f7` | 3,06 | onder 4,5 |
| `#1f9e96` op `#2d3436` | 3,86 | onder 4,5 |
| `#0f6b66` op wit | 6,33 | goed |
| `#0f6b66` op `#f5f7f7` | 5,89 | goed |
| `#0f6b66` op `#e8f5f4` | 5,67 | goed |
| wit op `#0f6b66` | 6,33 | goed, dus knoppen en topbar |
| `#e8f5f4` op `#0f6b66` | 5,67 | goed |
| `#33393b` op wit | 11,74 | goed |
| `#33393b` op `#f5f7f7` | 10,92 | goed |
| `#5f6769` op wit | 5,78 | goed |
| `#5f6769` op `#f5f7f7` | 5,38 | goed |
| `#cfd6d6` op `#2d3436` | 8,60 | goed |
| wit op `#2d3436` | 12,68 | goed |

Gevolg: de huidige site gebruikt `--c` ook voor kleine tekst; dat haalt de norm niet.
Hier is `--cd` de tekst- en linkkleur en blijft `--c` voor vlak en rand.

## Typografie

| Token | Waarde | Herkomst |
|---|---|---|
| `--font-body` | Open Sans, systeemfallback | `:root { --ff-body }`, Google Fonts-link in `home2.html` |
| `--font-head` | Noto Serif, Georgia-fallback | `:root { --ff-head }` |
| `--text-body` | 17px | `:root { --fs-body }` |
| `--text-small` | 14px | `:root { --fs-small }`, `.topbar` |
| `--text-nav` | 15px | `.nav a { font-size:15px }` |
| `--text-h1` | `clamp(28px,1.6rem + 1.6vw,42px)` | `:root { --fs-h1 }` |
| `--text-h2` | `clamp(24px,1.3rem + 1vw,34px)` | `:root { --fs-h2 }` |
| `--text-h3` | `clamp(20px,1.1rem + .5vw,24px)` | `:root { --fs-h3 }` |
| `--text-h4` | `clamp(18px,1rem + .3vw,20px)` | `:root { --fs-h4 }` |
| `--text-hero` | `clamp(26px,1.2rem + 2.6vw,50px)` | `.hero h1` |

De lettertypen worden zelf gehost via `@fontsource-variable/open-sans` en
`@fontsource-variable/noto-serif` in plaats van Google Fonts. Zelfde twee families,
geen externe oproep en geen toestemmingsvraag voor bezoekers.

## Vorm

| Token | Waarde | Herkomst |
|---|---|---|
| `--radius-pill` | 30px | `.btn { border-radius:30px }` |
| `--spacing-header` | 92px | `.hdr { min-height:92px }` |

## Wat bewust niet is overgenomen

- De hero-overlay `rgba(0,0,0,.25)` tot `rgba(0,0,0,.45)` hoort bij de diavoorstelling
  op de huidige startpagina. Die komt in een latere fase met echte beelden terug.
- De overige vijf fontfamilies die `home2.html` laadt (Dosis, Roboto, Roboto Serif,
  Roboto Slab, Shanti) worden door de huidige site niet gebruikt. Ze zijn weggelaten.
