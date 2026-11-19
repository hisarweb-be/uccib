#!/usr/bin/env node
/**
 * Legt vóór de bouw de gebedstijden van elke Belgische stad vast:
 * `src/data/vakitler.json` (één bestand, één ingang).
 *
 * Waarom vastleggen en niet elke keer ophalen: een site die niet bouwt omdat een
 * bron van een derde partij even niet antwoordt, is erger dan een site met de
 * tijden van gisteren. Elke stadspagina leest dit bestand bij de bouw, zodat er
 * ook zonder JavaScript en zonder bereik tijden staan; de browser haalt daarna
 * de verse tijden op via `/api/vakitler?stad=<stad>`.
 *
 * Waarom alle steden en niet alleen Brussel (19-11): elke stad heeft sinds deze
 * ronde een eigen adres (`/namaz-vakitleri/<stad>/`), en een gedeelde link moet
 * de juiste plaats tonen ook als de lezer geen JavaScript heeft. Zonder eigen
 * tijden per stad zou zo'n pagina Brussel tonen onder de naam van Gent.
 *
 * Faalt een stad, dan blijven haar eigen tijden uit de vorige bouw staan; faalt
 * de bron helemaal, dan blijft het bestand onaangeroerd en bouwt de site door.
 * Er wordt nooit iets verzonnen en nooit een halve tabel geschreven.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { bronPad, haalStad, STEDEN } from '../functions/_lib/vakitler.js';

const DOEL = resolve('src/data/vakitler.json');

/**
 * Vier verzoeken tegelijk: de bron antwoordt in ongeveer 150 ms, dus 34 steden
 * duren zo'n twee seconden. Acht seconden per stad is ruim; bij een trage bron
 * staat de bouw hooguit (34/4) × 8 ≈ 68 s stil en daarna gaat hij gewoon door.
 */
const TEGELIJK = 4;
const TIMEOUT_MS = 8000;

/** De vorige inhoud, in de vorm van dit script. Onbekend of onleesbaar telt als leeg. */
function lees() {
  if (!existsSync(DOEL)) return null;
  try {
    const oud = JSON.parse(readFileSync(DOEL, 'utf8'));
    return oud && typeof oud.steden === 'object' && oud.steden ? oud : null;
  } catch {
    return null;
  }
}

/** Elke stad ophalen, met een klein aantal verzoeken tegelijk. */
async function haalAlle(slugs) {
  const wachtrij = [...slugs];
  const uit = new Map();
  const werker = async () => {
    for (;;) {
      const slug = wachtrij.shift();
      if (slug === undefined) return;
      uit.set(slug, await haalStad(slug, { timeoutMs: TIMEOUT_MS }));
    }
  };
  await Promise.all(Array.from({ length: Math.min(TEGELIJK, slugs.length) }, werker));
  return uit;
}

const oud = lees();
const vers = await haalAlle(STEDEN.map((stad) => stad.slug));

const nu = new Date().toISOString();
const steden = {};
let gelukt = 0;
let bewaard = 0;
let leeg = 0;

for (const stad of STEDEN) {
  const nieuw = vers.get(stad.slug) ?? [];
  const eerder = oud?.steden?.[stad.slug];

  /**
   * Samenvoegen met wat er al lag: een bouw op woensdag mag de dag van dinsdag
   * niet wissen, want de pagina toont ook de dagen ervoor in de weektabel.
   */
  const samen = new Map();
  for (const dag of [...(eerder?.dagen ?? []), ...nieuw]) samen.set(dag.datum, dag);
  const dagen = [...samen.values()].sort((a, b) => (a.datum < b.datum ? -1 : 1)).slice(-9);

  if (dagen.length === 0) {
    leeg += 1;
    continue;
  }

  if (nieuw.length > 0) gelukt += 1;
  else bewaard += 1;

  steden[stad.slug] = {
    bron: bronPad(stad.slug),
    opgehaald: nieuw.length > 0 ? nu : (eerder?.opgehaald ?? nu),
    dagen,
  };
}

/*
 * Niets opgehaald én geen bruikbare oude inhoud: dan is er niets om te schrijven
 * en blijft het bestand zoals het was. De pagina's zeggen dan eerlijk dat de
 * tijden niet beschikbaar zijn in plaats van een lege tabel te tonen.
 */
if (gelukt === 0 && Object.keys(steden).length === 0) {
  console.warn('[vakitler] de bron antwoordde niet en er lag nog niets; het bestand blijft ongewijzigd.');
  process.exit(0);
}

const inhoud = { tijdstreep: 'Europe/Brussels', opgehaald: nu, steden };
writeFileSync(DOEL, JSON.stringify(inhoud, null, 2) + '\n', 'utf8');

const dagenVan = (slug) => steden[slug]?.dagen ?? [];
const eerste = dagenVan('brussel')[0]?.datum ?? '?';
const laatste = dagenVan('brussel').at(-1)?.datum ?? '?';
console.log(
  `[vakitler] ${gelukt} steden vers, ${bewaard} uit de vorige bouw, ${leeg} zonder tijden` +
    ` (Brussel: ${eerste} t/m ${laatste}).`,
);
