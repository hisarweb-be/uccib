/**
 * Toets op de statische server die elke keuring gebruikt.
 *
 * Aanleiding: F5 verloor twee metingen omdat `startStaticServer` met een pad als
 * `D:/.../dist` niets serveerde. De keuring las de HTML wel van schijf, zag daar
 * alles kloppen, en keek met de browser naar een 403-pagina. Zo kan een keuring
 * groen melden over een site die niets toont.
 *
 * Deze toets heeft twee soorten gevallen nodig: één dat MOET afkeuren en één dat
 * schoon moet blijven. Zonder het eerste geval bewijst de toets niets.
 *
 * Draait met `npm run verify:server`. Exitcode 1 bij elke afwijking.
 */
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { startStaticServer } from './lib/keuring.mjs';

const DIST = resolve('dist');
const BACKSLASH = String.fromCharCode(92);
let fouten = 0;

function oordeel(goed, regel) {
  console.log(goed ? 'OK   ' + regel : 'FOUT ' + regel);
  if (!goed) fouten += 1;
}

/** Moet weigeren: een map zonder wortelindex mag nooit stil doorgaan. */
async function moetAfkeuren(pad, waarom) {
  try {
    const server = await startStaticServer(pad);
    await server.close();
    oordeel(false, waarom + ': de server startte toch, de keuring zou groen melden op niets');
  } catch (fout) {
    const melding = String(fout.message ?? fout);
    oordeel(melding.includes('serveert'), waarom + ': geweigerd met een leesbare melding');
  }
}

/**
 * Moet slagen: deze map moet geserveerd worden, anders keurt de keuring een
 * foutpagina. Een uitzondering van de server is hier ook een fout, geen crash:
 * de toets moet hem als FOUT tellen en met exitcode 1 eindigen.
 */
async function moetServeren(pad, label) {
  let server;
  try {
    server = await startStaticServer(pad);
  } catch (fout) {
    oordeel(false, label + ': de server weigerde (' + String(fout.message ?? fout) + ')');
    return;
  }
  try {
    for (const route of ['/', '/hakkimizda/']) {
      const antwoord = await fetch(server.baseUrl + route);
      oordeel(antwoord.status === 200, label + ' ' + route + ': status ' + antwoord.status + ' (verwacht 200)');
    }
  } finally {
    await server.close();
  }
}

// 1. Backslashes, zoals `resolve('dist')` ze op Windows oplevert. Dit is het pad
//    dat de keuringsscripts zelf doorgeven, dus dit moet hoe dan ook werken.
await moetServeren(DIST, 'backslashes');

// 2. Hetzelfde pad met schuine strepen. Dit is het geval dat F5 twee metingen
//    kostte: een aanroep met `D:/.../dist` serveerde niets en de keuring keek
//    naar een 403-pagina. Zonder `resolve()` in de server faalt juist deze regel
//    en blijft regel 1 groen, dus deze proef is de echte tegentoets.
{
  const vooruit = DIST.split(BACKSLASH).join('/');
  if (!vooruit.includes('/')) throw new Error('de proef met schuine strepen bouwt geen pad met schuine strepen');
  await moetServeren(vooruit, 'schuine strepen');
}



// 3. Een lege map en een lege submap. Beide moeten afkeuren.
{
  const leeg = await mkdtemp(join(tmpdir(), 'uccib-leeg-'));
  try {
    await moetAfkeuren(leeg, 'lege map');
    await mkdir(join(leeg, 'onder'));
    await moetAfkeuren(join(leeg, 'onder'), 'lege submap');
  } finally {
    await rm(leeg, { recursive: true, force: true });
  }
}

// 4. Een map met een bestand maar zonder wortelindex. Elke keuring begint bij /,
//    dus ook dit moet afkeuren.
{
  const half = await mkdtemp(join(tmpdir(), 'uccib-half-'));
  try {
    await writeFile(join(half, 'iets.html'), '<h1>iets</h1>', 'utf8');
    await moetAfkeuren(half, 'map zonder wortelindex');
  } finally {
    await rm(half, { recursive: true, force: true });
  }
}

if (fouten > 0) {
  console.log('');
  console.log('verify-server: ' + fouten + ' fout(en)');
  process.exit(1);
}
console.log('');
console.log('verify-server: alles klopt');
