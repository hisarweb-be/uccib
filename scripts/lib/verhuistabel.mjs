/**
 * Leest en controleert herontwerp/VERHUISTABEL.csv (oud adres van uccib.com naar nieuw pad).
 * Kolommen: oud_adres, status_nu, soort, taal, nieuw_adres, actie, uitleg.
 * actie is gelijk (zelfde pad, of alleen schuine streep anders, of geen pad: hostregel),
 * doorverwijzen (301 naar nieuw_adres) of vangregel (jokerregel, 301 naar nieuw_adres).
 * nieuw_adres is een pad dat met / begint, of leeg; nooit een spatie of uitleg.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const KOLOMMEN = ['oud_adres', 'status_nu', 'soort', 'taal', 'nieuw_adres', 'actie', 'uitleg'];
export const ACTIES = ['gelijk', 'doorverwijzen', 'vangregel'];

/** Kleine CSV-lezer met aanhalingstekens, "" en regeleinden binnen een veld. */
export function parseCsv(tekst) {
  const t = tekst.replace(/^﻿/, '');
  const rijen = [];
  let rij = [];
  let veld = '';
  let tussen = false;
  for (let i = 0; i < t.length; i += 1) {
    const c = t[i];
    if (tussen) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          veld += '"';
          i += 1;
        } else tussen = false;
      } else veld += c;
    } else if (c === '"') tussen = true;
    else if (c === ',') {
      rij.push(veld);
      veld = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i += 1;
      rij.push(veld);
      veld = '';
      rijen.push(rij);
      rij = [];
    } else veld += c;
  }
  if (veld !== '' || rij.length) {
    rij.push(veld);
    rijen.push(rij);
  }
  return rijen;
}

export function csvVeld(waarde) {
  return `"${String(waarde ?? '').replace(/"/g, '""')}"`;
}

/** Zoekt de tabel: expliciet pad, anders herontwerp/ in of naast de werkmap. */
export function vindTabel(pad) {
  const kandidaten = pad
    ? [pad]
    : [
        join(process.cwd(), 'herontwerp', 'VERHUISTABEL.csv'),
        join(process.cwd(), '..', 'herontwerp', 'VERHUISTABEL.csv'),
      ];
  const gevonden = kandidaten.find((p) => existsSync(p));
  if (!gevonden) throw new Error(`VERHUISTABEL.csv niet gevonden (gezocht: ${kandidaten.join(', ')})`);
  return gevonden;
}

/** Geeft { rijen, fouten }; rijen zijn objecten met de zeven kolommen plus regel. */
export function leesTabel(pad) {
  const ruw = parseCsv(readFileSync(pad, 'utf8')).filter((r) => r.some((v) => v !== ''));
  const fouten = [];
  const kop = ruw.shift() ?? [];
  if (kop.join('|') !== KOLOMMEN.join('|')) {
    fouten.push(`kolommen zijn ${kop.join(',')}, verwacht ${KOLOMMEN.join(',')}`);
  }
  const gezien = new Set();
  const rijen = ruw.map((r, i) => {
    const regel = i + 2;
    const rij = Object.fromEntries(KOLOMMEN.map((k, n) => [k, r[n] ?? '']));
    rij.regel = regel;
    if (r.length !== KOLOMMEN.length) fouten.push(`regel ${regel}: ${r.length} kolommen`);
    if (!ACTIES.includes(rij.actie)) {
      fouten.push(`regel ${regel}: actie "${rij.actie}" is niet gelijk, doorverwijzen of vangregel`);
    }
    if (/\s/.test(rij.nieuw_adres) || (rij.nieuw_adres && !rij.nieuw_adres.startsWith('/'))) {
      fouten.push(`regel ${regel}: nieuw_adres "${rij.nieuw_adres}" is geen pad`);
    }
    if (rij.actie !== 'gelijk' && !rij.nieuw_adres) fouten.push(`regel ${regel}: ${rij.actie} zonder nieuw_adres`);
    if (!/^https?:\/\//.test(rij.oud_adres)) fouten.push(`regel ${regel}: oud_adres "${rij.oud_adres}" is geen adres`);
    if (gezien.has(rij.oud_adres)) fouten.push(`regel ${regel}: oud_adres komt dubbel voor`);
    gezien.add(rij.oud_adres);
    return rij;
  });
  return { rijen, fouten };
}
