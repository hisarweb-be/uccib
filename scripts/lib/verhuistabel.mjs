/**
 * Leest en controleert de verhuistabel (scripts/data/verhuistabel.csv, de enige bron):
 * oud adres van uccib.com naar nieuw pad.
 * Kolommen: oud_adres, status_nu, soort, taal, nieuw_adres, actie, uitleg.
 * actie is gelijk (zelfde pad, of alleen schuine streep anders, of geen pad: hostregel),
 * doorverwijzen (301 naar nieuw_adres) of vangregel (jokerregel, 301 naar nieuw_adres).
 * nieuw_adres is een pad dat met / begint, of leeg; nooit een spatie of uitleg.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

/**
 * De enige verhuistabel: de generator, verify en verify:verhuis lezen alleen dit
 * bestand. Er is geen overname van een tabel buiten de repo.
 */
export const REPO_TABEL = fileURLToPath(new URL('../data/verhuistabel.csv', import.meta.url));

/** Geeft het pad van de tabel in de repo; fout als het bestand ontbreekt. */
export function vindTabel() {
  if (!existsSync(REPO_TABEL)) throw new Error(`verhuistabel niet gevonden: ${REPO_TABEL}`);
  return REPO_TABEL;
}

/** Pad (met query) van een oud adres op uccib.com, of null voor een hostregel of ander domein. */
export function oudPad(rij) {
  const u = new URL(rij.oud_adres);
  return u.hostname === 'uccib.com' ? u.pathname + u.search : null;
}

/**
 * Regels voor public/_redirects (Cloudflare Pages): { van, naar, rij }.
 * doorverwijzen = één vaste regel per rij; vangregel met * = één jokerregel;
 * een vangregel zonder * krijgt alleen een eigen regel als geen jokerregel hem dekt.
 * Vaste regels eerst, jokerregels daarna (Cloudflare neemt de eerste die past).
 * Gooit bij een rij die _redirects niet kan uitdrukken (query of * buiten het eind).
 */
export function redirectRegels(rijen) {
  const vast = [];
  const joker = [];
  const fouten = [];
  for (const rij of rijen) {
    if (rij.actie === 'gelijk') continue;
    const van = oudPad(rij);
    if (van === null) {
      fouten.push(`regel ${rij.regel}: ${rij.actie} buiten uccib.com kan niet in _redirects`);
      continue;
    }
    if (van.includes('?')) fouten.push(`regel ${rij.regel}: ${van} heeft een query, _redirects kan die niet lezen`);
    if (van.includes('*') && (rij.actie !== 'vangregel' || van.indexOf('*') !== van.length - 1)) {
      fouten.push(`regel ${rij.regel}: * mag alleen aan het eind van een vangregel staan`);
    }
    (van.endsWith('*') ? joker : vast).push({ van, naar: rij.nieuw_adres, rij });
  }
  if (fouten.length) throw new Error(fouten.join('\n'));
  const regels = [...vast.filter((r) => r.rij.actie === 'doorverwijzen' || !zoekRegel(joker, r.van)), ...joker];
  const dubbel = regels.map((r) => r.van).filter((v, i, a) => a.indexOf(v) !== i);
  if (dubbel.length) throw new Error(`dubbele bron in _redirects: ${[...new Set(dubbel)].join(', ')}`);
  return regels;
}

/** Eerste regel die op het pad past (vast: gelijk pad; joker: prefix voor de *), zoals Cloudflare Pages. */
export function zoekRegel(regels, pad) {
  return regels.find((r) => (r.van.endsWith('*') ? pad.startsWith(r.van.slice(0, -1)) : pad === r.van));
}

export const REDIRECTS_KOP = [
  '# Doorverwijzingen van de oude adressen van uccib.com (Cloudflare Pages).',
  '# Gegenereerd door `node scripts/lib/verhuis.mjs` uit scripts/data/verhuistabel.csv.',
  '# Niet met de hand wijzigen: pas de tabel aan en draai de generator; `npm run verify` vergelijkt.',
];

export function redirectsTekst(regels) {
  return `${[...REDIRECTS_KOP, ...regels.map((r) => `${r.van} ${r.naar} 301`)].join('\n')}\n`;
}

/** Leest de regels terug uit de tekst van een _redirects-bestand. */
export function leesRedirects(tekst) {
  return tekst
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [van, naar, status] = l.split(/\s+/);
      return { van, naar, status: Number(status ?? 302) };
    });
}

/** Cloudflare Pages: hooguit 2000 vaste en 100 dynamische regels (samen 2100). */
export const LIMIET = { vast: 2000, dynamisch: 100 };

/**
 * Keurt een _redirects-tekst tegen de tabel: gelijk aan de generatoruitvoer, elke rij
 * doorverwijzen/vangregel komt via de eerste passende regel met 301 op nieuw_adres,
 * geen gelijk-rij wordt omgeleid, geen bron is een bestand in dist, limieten gehaald.
 * Geeft { fouten, vast, dynamisch, gedekt }.
 */
export function keurRedirects(tekst, rijen, { distDir } = {}) {
  const fouten = [];
  let verwacht = '';
  try {
    verwacht = redirectsTekst(redirectRegels(rijen));
  } catch (e) {
    return { fouten: [String(e.message)], vast: 0, dynamisch: 0, gedekt: 0 };
  }
  if (tekst.replace(/\r\n/g, '\n') !== verwacht) {
    fouten.push('public/_redirects wijkt af van de tabel: draai `node scripts/lib/verhuis.mjs`');
  }
  const regels = leesRedirects(tekst);
  let gedekt = 0;
  for (const rij of rijen) {
    const pad = oudPad(rij);
    if (pad === null) continue;
    const proef = pad.replace('*', 'verhuis-proef');
    const regel = zoekRegel(regels, proef.split('?')[0]);
    if (rij.actie === 'gelijk') {
      if (regel) fouten.push(`regel ${rij.regel}: ${pad} is gelijk maar wordt omgeleid naar ${regel.naar}`);
      continue;
    }
    if (!regel) fouten.push(`regel ${rij.regel}: ${pad} (${rij.actie}) heeft geen regel in _redirects`);
    else if (regel.naar !== rij.nieuw_adres || regel.status !== 301) {
      fouten.push(`regel ${rij.regel}: ${pad} gaat naar ${regel.naar} ${regel.status}, verwacht ${rij.nieuw_adres} 301`);
    } else gedekt += 1;
  }
  if (distDir) {
    for (const r of regels) {
      if (r.van.includes('*')) continue;
      const kaal = r.van.replace(/^\/+|\/+$/g, '');
      const bestand = [join(distDir, kaal), join(distDir, kaal, 'index.html'), join(distDir, `${kaal}.html`)];
      if (kaal && bestand.some((b) => existsSync(b) && statSync(b).isFile())) {
        fouten.push(`${r.van} is een bestaande pagina of bestand in dist en mag niet omgeleid worden`);
      }
    }
    for (const r of regels) {
      const doel = r.naar.replace(/^\/+/, '');
      const kandidaten = doel === '' ? [join(distDir, 'index.html')] : [join(distDir, doel), join(distDir, doel, 'index.html')];
      if (!kandidaten.some((b) => existsSync(b) && statSync(b).isFile())) {
        fouten.push(`${r.van} wijst naar ${r.naar}, maar dat bestaat niet in dist`);
      }
    }
  }
  const dynamisch = regels.filter((r) => r.van.includes('*') || r.van.includes(':')).length;
  const vast = regels.length - dynamisch;
  if (vast > LIMIET.vast) fouten.push(`${vast} vaste regels, Cloudflare staat er ${LIMIET.vast} toe`);
  if (dynamisch > LIMIET.dynamisch) fouten.push(`${dynamisch} dynamische regels, Cloudflare staat er ${LIMIET.dynamisch} toe`);
  return { fouten, vast, dynamisch, gedekt };
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
