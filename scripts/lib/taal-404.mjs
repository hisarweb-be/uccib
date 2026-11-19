#!/usr/bin/env node
/**
 * Zet de 404 van elke niet-standaardtaal op de plek waar Cloudflare Pages hem zoekt (F3 D6).
 *
 * Pages toont bij een onbekend pad de 404.html die het dichtst bij dat pad staat:
 * /nl/iets krijgt dist/nl/404.html, /iets krijgt dist/404.html, altijd met status 404.
 * Astro schrijft alleen de root-404 als 404.html; src/pages/nl/404.astro wordt
 * dist/nl/404/index.html en komt in de sitemap. Dit script, na `astro build`:
 *   1. verplaatst dist/<taal>/404/index.html naar dist/<taal>/404.html (de map gaat weg,
 *      zodat /nl/404/ geen pagina met status 200 is);
 *   2. haalt <taal>/404/ uit dist/sitemap-*.xml (een 404 hoort niet in de sitemap).
 * Herhaalbaar: een tweede run vindt niets meer en slaagt.
 * Uitgang 1 als dist/404.html ontbreekt of een taal geen 404 heeft.
 *
 * Gebruik: node scripts/lib/taal-404.mjs [--dist=<pad>]
 */
import { existsSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TALEN = ['nl', 'fr'];
const distArg = process.argv.slice(2).find((a) => a.startsWith('--dist='))?.slice(7);
const dist = distArg ? resolve(distArg) : fileURLToPath(new URL('../../dist', import.meta.url));

const fouten = [];
if (!existsSync(join(dist, '404.html'))) fouten.push('dist/404.html ontbreekt');

for (const taal of TALEN) {
  const map = join(dist, taal, '404');
  const doel = join(dist, taal, '404.html');
  if (existsSync(join(map, 'index.html'))) {
    renameSync(join(map, 'index.html'), doel);
    rmSync(map, { recursive: true });
    console.log(`OK ${taal}/404/index.html -> ${taal}/404.html`);
  } else if (existsSync(doel)) {
    console.log(`OK ${taal}/404.html staat er al`);
  } else {
    fouten.push(`${taal}: geen 404 gebouwd (src/pages/${taal}/404.astro ontbreekt?)`);
  }
}

const sitemaps = readdirSync(dist).filter((f) => /^sitemap-\d+\.xml$/.test(f));
for (const bestand of sitemaps) {
  const pad = join(dist, bestand);
  const xml = readFileSync(pad, 'utf8');
  const schoon = xml.replace(/<url><loc>[^<]*\/(?:nl|fr)\/404\/<\/loc>(?:(?!<\/url>).)*<\/url>/g, '');
  if (schoon !== xml) {
    writeFileSync(pad, schoon);
    console.log(`OK ${bestand}: 404-adressen verwijderd`);
  }
  if (/\/404\/?<\/loc>/.test(schoon)) fouten.push(`${bestand}: bevat nog een 404-adres`);
}

if (fouten.length) {
  for (const f of fouten) console.error(`FOUT ${f}`);
  process.exit(1);
}
