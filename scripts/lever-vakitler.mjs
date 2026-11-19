#!/usr/bin/env node
/**
 * Legt de gebedstijden van Brussel vast vóór de bouw: `src/data/vakitler.json`.
 *
 * Waarom vastleggen en niet elke keer ophalen: een site die niet bouwt omdat een
 * bron van een derde partij even niet antwoordt, is erger dan een site met de
 * tijden van gisteren. De pagina leest dit bestand bij de bouw, zodat er ook
 * zonder JavaScript en zonder bereik tijden staan; de browser haalt daarna de
 * verse tijden op via `/api/vakitler?stad=<stad>`.
 *
 * Draait `npm run build` dit script en antwoordt de bron niet, dan blijft het
 * bestaande bestand staan (geen schrijfactie) en gaat de bouw gewoon door. Is er
 * nog helemaal geen bestand, dan schrijft het alleen `null` en toont de pagina
 * de boodschap dat de tijden tijdelijk niet beschikbaar zijn: nooit verzonnen.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { haalStad, STEDEN } from '../functions/_lib/vakitler.js';

const DOEL = resolve('src/data/vakitler.json');
const STAD = process.env.VAKITLER_STAD || 'brussel';

/** Zeven dagen is genoeg: drie van de bron plus de vorige, zodat een oude build niet meteen leeg is. */
function lees() {
  if (!existsSync(DOEL)) return null;
  try {
    return JSON.parse(readFileSync(DOEL, 'utf8'));
  } catch {
    return null;
  }
}

const oud = lees();
const dagen = await haalStad(STAD, { timeoutMs: 8000 });

if (dagen.length === 0) {
  const heeftOud = oud && Array.isArray(oud.dagen) && oud.dagen.length > 0;
  console.warn(
    `[vakitler] de bron antwoordde niet voor ${STAD}; ` +
      (heeftOud ? `de tijden van ${oud.opgehaald} blijven staan.` : 'er staan geen tijden in de pagina.'),
  );
  process.exit(0);
}

/**
 * Samenvoegen met wat er al lag: een build op woensdag mag de dag van dinsdag
 * niet wissen, want de pagina toont ook "gisteren" in de weektabel.
 */
const samen = new Map();
for (const dag of [...(oud?.dagen ?? []), ...dagen]) samen.set(dag.datum, dag);

const dagenGesorteerd = [...samen.values()].sort((a, b) => (a.datum < b.datum ? -1 : 1)).slice(-9);

const inhoud = {
  stad: STAD,
  stadNaam: STEDEN.find((s) => s.slug === STAD)?.nl ?? STAD,
  tijdstreep: 'Europe/Brussels',
  bron: 'https://namaz-vakitleri.fazilettakvimi.com/nl/belgie/' + STAD,
  opgehaald: new Date().toISOString(),
  dagen: dagenGesorteerd,
};

writeFileSync(DOEL, JSON.stringify(inhoud, null, 2) + '\n', 'utf8');
console.log(`[vakitler] ${STAD}: ${dagenGesorteerd.length} dagen vastgelegd (${dagenGesorteerd[0].datum} t/m ${dagenGesorteerd.at(-1).datum}).`);
