#!/usr/bin/env node
/**
 * Menutoets (CONTRACT 7.2, DESIGNSYSTEEM 7.3): het menu toont in elke taal altijd
 * de zeven punten plus Bağış, op de startpagina en op binnenpagina's, en elk adres
 * is een echte pagina in dist (200, geen doorverwijzing, geen 404).
 *
 * Gelezen uit de gebouwde HTML zoals een bezoeker zonder JavaScript hem krijgt:
 * de `a` binnen `header nav ul`. De taalkeuze staat in een nav zonder ul en telt
 * dus niet mee.
 *
 * Uitgang 1 bij een afwijking, anders 0.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer, distFileFor } from './lib/keuring.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const LOCALES = ['tr', 'nl', 'fr'];
/** De volgorde uit STORYBOARD D.2; Bağış als achtste. */
const PUNTEN = ['', 'hakkimizda', 'haberler', 'bolge-derneklerimiz', 'subelerimiz', 'namaz-vakitleri', 'cuma-hutbesi', 'bagislar'];
/** Start, een actieve en een uitgezette binnenpagina. */
const PAGINAS = ['', 'hakkimizda', 'namaz-vakitleri'];

const pad = (locale, slug) => (locale === 'tr' ? '/' : `/${locale}/`) + (slug ? `${slug}/` : '');

/** Alle href's van `a` in een `ul` binnen een `nav` binnen de `header`. */
function menuLinks(html) {
  const kop = html.match(/<header[\s>][\s\S]*?<\/header>/i)?.[0] ?? '';
  const links = [];
  for (const nav of kop.match(/<nav[\s>][\s\S]*?<\/nav>/gi) ?? []) {
    for (const ul of nav.match(/<ul[\s>][\s\S]*?<\/ul>/gi) ?? []) {
      for (const a of ul.matchAll(/<a\s[^>]*?href="([^"]*)"/gi)) links.push(a[1]);
    }
  }
  return links;
}

if (!existsSync(DIST)) {
  console.error('verify:menu: dist/ ontbreekt. Eerst npm run build.');
  process.exit(1);
}

const fouten = [];
const adressen = new Set();
for (const locale of LOCALES) {
  const verwacht = PUNTEN.map((s) => pad(locale, s));
  for (const slug of PAGINAS) {
    const pagina = pad(locale, slug);
    const bestand = distFileFor(DIST, pagina);
    if (!existsSync(bestand)) {
      fouten.push(`${pagina}: pagina ontbreekt in dist`);
      continue;
    }
    const links = menuLinks(readFileSync(bestand, 'utf8'));
    if (JSON.stringify(links) !== JSON.stringify(verwacht)) {
      fouten.push(`${pagina}: menu is [${links.join(', ')}], verwacht [${verwacht.join(', ')}]`);
    }
    for (const l of links) adressen.add(l);
  }
}

const server = await startStaticServer(DIST);
try {
  for (const adres of [...adressen].sort()) {
    const r = await fetch(server.baseUrl + adres, { redirect: 'manual' });
    if (r.status !== 200) fouten.push(`${adres}: status ${r.status}`);
    else if (!existsSync(distFileFor(DIST, adres))) fouten.push(`${adres}: geen eigen pagina in dist`);
  }
} finally {
  await server.close();
}

if (fouten.length) {
  console.error(`verify:menu: ${fouten.length} fout(en)`);
  for (const f of fouten) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `verify:menu OK: ${LOCALES.length} talen x ${PAGINAS.length} pagina's met elk ${PUNTEN.length} menupunten; ` +
    `${adressen.size} adressen geven 200 zonder doorverwijzing.`,
);
