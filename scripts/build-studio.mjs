#!/usr/bin/env node
/**
 * Bouwt de Sanity Studio naar `public/beheer`. Draait als `prebuild`, dus bij
 * elke `npm run build` en dus ook in de bouw van Cloudflare Pages.
 *
 * Waarom dit een stap in de bouw is en geen map in de repo: de Studio is 22 MB
 * over 787 bestanden en verandert bij elke wijziging in een schema. In de repo
 * zou dat elke commit opblazen; als bouwproduct komt het er precies zo uit als
 * de schema's van dat moment. De map staat daarom in `.gitignore`, en `/beheer`
 * bestaat live doordat Cloudflare hem zelf maakt (`docs/BESLUITEN.md` #44).
 *
 * De afhankelijkheden van `sanity/` staan in een eigen `package-lock.json` en
 * worden niet door de `npm install` van de wortel geïnstalleerd. Ontbreekt de
 * map, dan installeert deze stap ze één keer met `npm ci`, zodat een verse
 * kloon en een Cloudflare-bouw hetzelfde werken.
 *
 * Mislukt de bouw van de Studio, dan stopt de hele bouw met exitcode 1: een
 * site zonder werkende `/beheer` is niet wat we willen uitrollen.
 *
 * Ontbreekt het Sanity-project zelf (nog geen projectId), dan wordt er niets
 * gebouwd en blijft `/beheer` weg. Dat is geen fout maar de eerlijke stand: een
 * Studio zonder project opent en toont daarna alleen "An error occurred"
 * (gemeten op de echte site, 17 nov 2026). De site bouwt in dat geval volledig
 * uit de offline kopie en heeft het beheer niet nodig; de keuring eist dan ook
 * geen `/beheer`. Zie `scripts/lib/studio.mjs`.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GEEN_PROJECT, heeftSanityProject } from './lib/studio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const studio = join(root, 'sanity');

if (!existsSync(join(studio, 'package.json'))) {
  console.error('NG  sanity/package.json ontbreekt: de Studio kan niet gebouwd worden.');
  process.exit(1);
}

// Geen project, geen Studio. Een oude bouw uit een vorige keer moet ook weg,
// anders staat er op /beheer een scherm dat bij deze bouw niet meer hoort.
const uitMap = join(root, 'public', 'beheer');
if (!heeftSanityProject()) {
  if (existsSync(uitMap)) rmSync(uitMap, { recursive: true, force: true });
  console.log(GEEN_PROJECT);
  process.exit(0);
}

/**
 * `shell: true` is nodig, en niet alleen voor de sier: op Windows is `npm` een
 * `npm.cmd`-omhulsel en dat kan `spawnSync` zonder shell niet starten (ENOENT,
 * en op nieuwere Node-versies EINVAL). Met een shell lost Node het via de PATH
 * op, op Windows en op de Linux-bouwer van Cloudflare hetzelfde. De argumenten
 * hieronder bevatten geen spaties of jokertekens, dus er valt niets te quoten.
 */
function draai(commando, argumenten, map) {
  console.log(`> ${commando} ${argumenten.join(' ')}`);
  const uitslag = spawnSync(commando, argumenten, { cwd: map, stdio: 'inherit', shell: true });
  if (uitslag.error) {
    console.error(`NG  ${commando} kon niet starten: ${uitslag.error.message}`);
    process.exit(1);
  }
  if (uitslag.status !== 0) {
    console.error(`NG  ${commando} ${argumenten.join(' ')} gaf exitcode ${uitslag.status}.`);
    process.exit(1);
  }
}

if (!existsSync(join(studio, 'node_modules'))) {
  console.log('sanity/node_modules ontbreekt; eenmalig installeren met npm ci.');
  draai('npm', ['ci', '--no-audit', '--no-fund'], studio);
}

draai('npm', ['run', 'build'], studio);

const outDir = uitMap;
const index = join(outDir, 'index.html');
if (!existsSync(index)) {
  console.error(`NG  de Studio-bouw liet ${index} niet achter.`);
  process.exit(1);
}

/*
 * Twee kleine reparaties op wat de Studio zelf achterlaat, allebei hier en niet
 * in een Cloudflare-regel. Waarom: Cloudflare past `_redirects` toe vóór het
 * zoeken van een bestand ("Redirects are always followed, regardless of whether
 * or not an asset matches the incoming request", developers.cloudflare.com,
 * geraadpleegd 16 nov 2026). Een regel `/beheer/* → /beheer/index.html` zou dus
 * ook de 787 eigen js- en css-bestanden van de Studio opvangen en de Studio
 * stukmaken. Wat je lokaal in dist/ kunt nameten, heeft de voorkeur boven een
 * regel die je pas live kunt bewijzen.
 *
 * 1. De Studio verwijst voor zijn favicon en manifest naar `/static/...`, terwijl
 *    de bouw ze onder `/beheer/static/...` zet (`project.basePath` in
 *    `sanity.cli.ts`). Zonder reparatie zijn dat vier dode verwijzingen. Het
 *    alternatief, vier eigen `_redirects`-regels op `/static/`, kaapt paden van
 *    de site zelf; dit raakt alleen de html van de Studio.
 *
 * 2. De Studio is één toepassing in de browser: `/beheer/structuur/pagina`
 *    bestaat niet als bestand. Cloudflare zoekt bij een onbekend pad de
 *    dichtstbijzijnde `404.html` in de map zelf en daarboven. Een kopie van de
 *    Studio-html als `public/beheer/404.html` laat dus elke diepe bladwijzer en
 *    elke verversing binnen de Studio werken, zonder een regel over alles.
 *    De statuscode van zo'n pagina is 404; de browser tekent hem gewoon en de
 *    Studio neemt het pad over. Dat is precies de bedoelde stand.
 */
const html = readFileSync(index, 'utf8');
const hersteld = html.replaceAll('href="/static/', 'href="/beheer/static/');
const overgebleven = [...hersteld.matchAll(/(?:href|src)="\/static\//g)].length;
if (overgebleven > 0) {
  console.error(`NG  ${overgebleven} verwijzing(en) naar /static/ bleven staan in ${index}.`);
  process.exit(1);
}
writeFileSync(index, hersteld, 'utf8');
writeFileSync(join(outDir, '404.html'), hersteld, 'utf8');

console.log('OK  Studio gebouwd naar public/beheer, met 404.html voor de diepe paden.');
