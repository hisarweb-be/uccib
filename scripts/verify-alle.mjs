#!/usr/bin/env node
/**
 * De paginapoort. `npm run verify`.
 *
 * Twee metingen, twee meetlatten:
 *   1. de pagina's met echte inhoud halen de vijf controles uit plan §8
 *      (titel, beschrijving, één h1, canonical en drie hreflang, beelden en
 *      links, en axe-core zonder bevindingen);
 *   2. de tien pagina's zonder inhoud mogen die controles niet halen maar moeten
 *      wél verborgen zijn: route bestaat, één h1, noindex, geen link ernaartoe,
 *      niet in de sitemap.
 *
 * Daarnaast: er moet een echte 404 bestaan. Zonder dist/404.html ziet Cloudflare
 * Pages het project als single-page app en antwoordt elk onbekend pad met de
 * homepage en status 200. Dat is een gemeten fout, geen aanname.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  ACTIVE_SLUGS,
  CONCEPT_SLUGS,
  checkConcepten,
  runChecks,
  LOCALES,
  SLUGS as ALL_SLUGS,
} from './lib/keuring.mjs';

const distDir = resolve('dist');
const errors = [];

const actief = await runChecks({ distDir, slugs: ACTIVE_SLUGS });
errors.push(...actief.errors);

const concept = await checkConcepten({ distDir, slugs: CONCEPT_SLUGS });
errors.push(...concept.errors);

// De 404 moet echt bestaan en één h1 hebben.
const viernullvier = resolve(distDir, '404.html');
if (!existsSync(viernullvier)) {
  errors.push('404: dist/404.html ontbreekt, Cloudflare geeft dan de homepage met status 200 op elk fout pad');
} else {
  const html = await readFile(viernullvier, 'utf8');
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  if (h1Count !== 1) errors.push(`404: verwacht precies één <h1>, gevonden ${h1Count}`);
  if (!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) {
    errors.push('404: mist <meta name="robots" content="noindex">');
  }
}

if (errors.length > 0) {
  for (const line of errors) console.error(line);
  console.error(`\n${errors.length} fout(en) op ${actief.checked} pagina's en ${concept.checked} concepten.`);
  process.exit(1);
}

console.log(
  `OK ${actief.checked} pagina's met inhoud gekeurd (${ACTIVE_SLUGS.length} slugs x ${LOCALES.length} talen).`,
);
// Bij een lege conceptlijst valt er niets te verbergen. "OK 0 conceptpagina's
// verborgen" zou dan klinken als een geslaagde controle op niets; zeg liever
// wat er echt aan de hand is.
console.log(
  CONCEPT_SLUGS.length === 0
    ? `OK geen concepten: alle ${ALL_SLUGS.length} slugs hebben eigen inhoud, dus niets te verbergen.`
    : `OK ${concept.checked} conceptpagina's verborgen (${CONCEPT_SLUGS.length} slugs x ${LOCALES.length} talen): route bestaat, noindex, nergens gelinkt, niet in de sitemap.`,
);
console.log('OK 404: dist/404.html bestaat en draagt noindex.');
