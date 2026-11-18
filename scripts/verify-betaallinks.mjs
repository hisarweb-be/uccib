#!/usr/bin/env node
/**
 * Betaallinktoets (CONTRACT 7.1): de herontwerp-PR's raken de sponsorbron niet,
 * en elke Mollie-betaallink in de gebouwde site staat letterlijk in die bron op
 * origin/main. Zo kan geen link verdwijnen, veranderen of erbij verzonnen worden.
 *
 * 1. `git diff --exit-code origin/main -- <sponsorbron>` moet leeg zijn.
 * 2. Elke `https://payment-links.mollie.com/payment/...` in dist (alle .html)
 *    moet voorkomen in de verzameling uit `git show origin/main:<bestand>`.
 *
 * Vereist dist/ (npm run build) en de ref origin/main (in CI: fetch-depth 0).
 * Uitgang 1 bij een afwijking, anders 0.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const BRON = ['src/content/sponsorblokken', 'src/data/sponsor.ts', 'src/components/Sponsor.astro'];
const MOLLIE = /https:\/\/payment-links\.mollie\.com\/payment\/[A-Za-z0-9]+/g;

const git = (...args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
const fouten = [];

try {
  git('rev-parse', '--verify', '--quiet', 'origin/main^{commit}');
} catch {
  console.error('verify:betaallinks: de ref origin/main ontbreekt. Haal hem op (git fetch origin main; in CI fetch-depth: 0).');
  process.exit(1);
}

// 1. De sponsorbron is gelijk aan origin/main.
try {
  git('diff', '--exit-code', '--stat', 'origin/main', '--', ...BRON);
} catch (e) {
  fouten.push(`sponsorbron wijkt af van origin/main:\n${e.stdout ?? ''}`);
}

// 2. De verzameling toegestane links, uit origin/main zelf (niet uit de werkboom).
const bestanden = git('ls-tree', '-r', '--name-only', 'origin/main', '--', ...BRON).split('\n').filter(Boolean);
if (bestanden.length === 0) {
  console.error('verify:betaallinks: geen sponsorbestanden gevonden op origin/main.');
  process.exit(1);
}
const toegestaan = new Set();
for (const f of bestanden) for (const m of git('show', `origin/main:${f}`).matchAll(MOLLIE)) toegestaan.add(m[0]);
if (toegestaan.size === 0) {
  console.error('verify:betaallinks: geen enkele Mollie-link in de sponsorbron op origin/main; de toets zou niets bewijzen.');
  process.exit(1);
}

if (!existsSync(DIST)) {
  console.error('verify:betaallinks: dist/ ontbreekt. Eerst npm run build.');
  process.exit(1);
}
const html = [];
(function loop(dir) {
  for (const naam of readdirSync(dir)) {
    const p = join(dir, naam);
    if (statSync(p).isDirectory()) loop(p);
    else if (naam.endsWith('.html')) html.push(p);
  }
})(DIST);

let gezien = 0;
const inDist = new Set();
for (const p of html) {
  for (const m of readFileSync(p, 'utf8').matchAll(MOLLIE)) {
    gezien++;
    inDist.add(m[0]);
    if (!toegestaan.has(m[0])) fouten.push(`${relative(ROOT, p)}: onbekende betaallink ${m[0]}`);
  }
}
if (gezien === 0) fouten.push('geen enkele Mollie-link in dist/: de sponsorblokken staan niet meer op de site');

if (fouten.length) {
  console.error(`verify:betaallinks: ${fouten.length} fout(en)`);
  for (const f of fouten) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `verify:betaallinks OK: sponsorbron gelijk aan origin/main, ${gezien} links in ${html.length} pagina's, ` +
    `${inDist.size} verschillend, alle uit de ${toegestaan.size} van origin/main.`,
);
