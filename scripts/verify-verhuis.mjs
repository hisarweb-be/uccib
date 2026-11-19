#!/usr/bin/env node
/**
 * Meet elke rij van de verhuistabel (scripts/data/verhuistabel.csv) op de voorvertoning en schrijft
 * verhuis-<datum>.csv naar --uit=, anders naar ../herontwerp/bewijs-f3 als die map er is, anders naar de tijdmap.
 *
 * Gebruik: node scripts/verify-verhuis.mjs [basisadres] [--uit=map] [--alleen-tabel]
 * Standaard basisadres: https://herontwerp-wow.uccib.pages.dev (alleen GET, zonder redirects te volgen).
 *
 * Verwachting per rij:
 * - gelijk: 200 op hetzelfde pad; verschilt het pad alleen in de slotstreep, dan 301/308 naar nieuw_adres;
 *   een rij zonder nieuw_adres (hostregel of ander project) is niet te meten op een pad: "overgeslagen".
 * - doorverwijzen en vangregel: 301/308 met Location op nieuw_adres. Een * in oud_adres wordt met
 *   "verhuis-proef" ingevuld. Daarna volgt het script de doorverwijzing en eist eindstatus 200.
 * Slagen = geen rij fout of 404. Uitgang 1 bij een fout.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { csvVeld, leesTabel, vindTabel } from './lib/verhuistabel.mjs';

const args = process.argv.slice(2);
const optie = (naam) => args.find((a) => a.startsWith(`--${naam}=`))?.slice(naam.length + 3);
const basis = (args.find((a) => /^https?:\/\//.test(a)) ?? 'https://herontwerp-wow.uccib.pages.dev').replace(/\/+$/, '');
const tabelPad = vindTabel();
const { rijen, fouten } = leesTabel(tabelPad);

if (fouten.length) {
  console.error(`Tabel ${tabelPad}: ${fouten.length} fout(en)`);
  for (const f of fouten.slice(0, 20)) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`Tabel ${tabelPad}: ${rijen.length} rijen, geen tabelfouten`);
if (args.includes('--alleen-tabel')) process.exit(0);

const pad = (adres) => {
  const u = new URL(adres, basis);
  return u.pathname + u.search;
};

async function haal(p) {
  const r = await fetch(basis + p, { redirect: 'manual', headers: { 'user-agent': 'uccib-verify-verhuis' } });
  await r.arrayBuffer().catch(() => {});
  return { status: r.status, locatie: r.headers.get('location') ?? '' };
}

async function eindstatus(start) {
  let huidig = start;
  for (let hop = 0; hop < 4; hop += 1) {
    const r = await haal(huidig);
    if (r.status < 300 || r.status >= 400) return r.status;
    huidig = pad(r.locatie);
  }
  return 'lus';
}

async function meetRij(rij) {
  const oud = new URL(rij.oud_adres.replace('*', 'verhuis-proef'));
  if (oud.hostname !== 'uccib.com' || !rij.nieuw_adres) {
    return { gemeten: '', verwacht: 'niet te meten op een pad', status: 'n.v.t.', locatie: '', eind: '', uitslag: 'overgeslagen' };
  }
  const p = oud.pathname + oud.search;
  const r = await haal(p);
  const nieuw = rij.nieuw_adres;
  const wijstNaar = r.locatie ? pad(r.locatie) : '';
  const zelfdePad = rij.actie === 'gelijk' && oud.pathname === nieuw;
  const verwacht = zelfdePad ? '200' : `301/308 naar ${nieuw}`;
  let goed = zelfdePad ? r.status === 200 : [301, 308].includes(r.status) && wijstNaar === nieuw;
  const eind = r.status >= 300 && r.status < 400 ? await eindstatus(wijstNaar) : r.status;
  if (goed && eind !== 200) goed = false;
  return { gemeten: p, verwacht, status: r.status, locatie: r.locatie, eind, uitslag: goed ? 'ok' : r.status === 404 ? '404' : 'fout' };
}

const wachtrij = [...rijen];
const gemeten = [];
async function werker() {
  while (wachtrij.length) {
    const rij = wachtrij.shift();
    gemeten[rij.regel] = { rij, ...(await meetRij(rij)) };
  }
}
await Promise.all(Array.from({ length: 6 }, werker));
const lijst = gemeten.filter(Boolean);

const nu = new Date();
const herontwerp = resolve('..', 'herontwerp');
const uitMap = optie('uit') ?? (existsSync(herontwerp) ? join(herontwerp, 'bewijs-f3') : join(tmpdir(), 'uccib-verhuis'));
mkdirSync(uitMap, { recursive: true });
const kop = ['oud_adres', 'actie', 'nieuw_adres', 'gemeten_pad', 'verwacht', 'status', 'location', 'eindstatus', 'uitslag', 'gemeten_op'];
const regels = lijst.map(({ rij, gemeten: g, verwacht, status, locatie, eind, uitslag }) =>
  [rij.oud_adres, rij.actie, rij.nieuw_adres, g, verwacht, status, locatie, eind, uitslag, nu.toISOString()]
    .map(csvVeld)
    .join(','),
);
const bestand = join(uitMap, `verhuis-${nu.toISOString().slice(0, 10)}.csv`);
writeFileSync(bestand, `﻿${[kop.map(csvVeld).join(','), ...regels].join('\r\n')}\r\n`);

const tel = (u) => lijst.filter((x) => x.uitslag === u).length;
console.log(
  `Voorvertoning ${basis}: ${lijst.length} rijen, ok ${tel('ok')}, fout ${tel('fout')}, 404 ${tel('404')}, overgeslagen ${tel('overgeslagen')}`,
);
for (const x of lijst.filter((y) => y.uitslag === 'fout' || y.uitslag === '404').slice(0, 15)) {
  console.log(`  ${x.uitslag}: ${x.rij.oud_adres} gaf ${x.status}${x.locatie ? ` naar ${x.locatie}` : ''}, verwacht ${x.verwacht}`);
}
console.log(`Uitslag geschreven: ${bestand}`);
process.exit(tel('fout') + tel('404') ? 1 : 0);
