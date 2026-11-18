#!/usr/bin/env node
/**
 * Schrijft public/_redirects uit de verhuistabel (F3 D4).
 *
 * Gebruik: node scripts/lib/verhuis.mjs [--tabel=<pad>]
 *   zonder --tabel: leest scripts/data/verhuistabel.csv;
 *   met --tabel (bijv. ../herontwerp/VERHUISTABEL.csv): keurt die tabel, neemt hem over
 *   in scripts/data/verhuistabel.csv en schrijft daaruit _redirects.
 * Herhaalbaar: dezelfde tabel geeft byte voor byte hetzelfde bestand.
 * Uitgang 1 bij een tabelfout of een rij die _redirects niet kan uitdrukken.
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_TABEL, keurRedirects, leesTabel, redirectRegels, redirectsTekst } from './verhuistabel.mjs';

const UIT = fileURLToPath(new URL('../../public/_redirects', import.meta.url));
const tabelArg = process.argv.slice(2).find((a) => a.startsWith('--tabel='))?.slice(8);

const bron = tabelArg ? resolve(tabelArg) : REPO_TABEL;
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

if (bron !== REPO_TABEL) {
  copyFileSync(bron, REPO_TABEL);
  console.log(`Tabel overgenomen: ${bron} -> ${REPO_TABEL}`);
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
