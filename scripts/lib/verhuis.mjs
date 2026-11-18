#!/usr/bin/env node
/**
 * Schrijft public/_redirects uit de verhuistabel (F3 D4).
 *
 * Gebruik: node scripts/lib/verhuis.mjs
 * Enige bron: scripts/data/verhuistabel.csv in de repo. Een wijziging aan de verhuizing
 * is een wijziging aan dat bestand, met daarna deze generator.
 * Herhaalbaar: dezelfde tabel geeft byte voor byte hetzelfde bestand.
 * Uitgang 1 bij een tabelfout of een rij die _redirects niet kan uitdrukken.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REPO_TABEL, keurRedirects, leesTabel, redirectRegels, redirectsTekst } from './verhuistabel.mjs';

const UIT = fileURLToPath(new URL('../../public/_redirects', import.meta.url));
const bron = REPO_TABEL;
const { rijen, fouten } = leesTabel(bron);
if (fouten.length) {
  console.error(`Tabel ${bron}: ${fouten.length} fout(en)`);
  for (const f of fouten.slice(0, 20)) console.error(`  ${f}`);
  process.exit(1);
}

let tekst;
try {
  tekst = redirectsTekst(redirectRegels(rijen));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const keuring = keurRedirects(tekst, rijen);
if (keuring.fouten.length) {
  for (const f of keuring.fouten) console.error(f);
  process.exit(1);
}

const oud = (() => {
  try {
    return readFileSync(UIT, 'utf8');
  } catch {
    return '';
  }
})();
writeFileSync(UIT, tekst);
console.log(
  `${UIT}: ${keuring.vast} vaste en ${keuring.dynamisch} dynamische regels, dekken ${keuring.gedekt} rijen` +
    ` (${oud === tekst ? 'ongewijzigd' : 'bijgewerkt'})`,
);
