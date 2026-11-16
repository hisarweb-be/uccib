#!/usr/bin/env node
/**
 * Controleert of het CMS compleet is. `npm run cms:verify`.
 *
 * Twee standen:
 *   --offline   keurt `src/data/cms-fallback.json` (werkt altijd, geen account)
 *   (zonder)    vraagt het echte CMS en keurt daar dezelfde eisen
 *
 * De eis is per combinatie precies één document: veertien slugs maal drie talen
 * is 42 pagina's, plus één `instellingen`. Ontbreekt er één, dan exit 1 en één
 * leesbare regel per gat. Dat is dezelfde hardheid als de paginakeuring.
 *
 * Zonder projectId in de echte stand: exit 2 met de uitleg dat er nog geen
 * account is. Dat is geen fout in de code, dus geen exit 1.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SLUGS } from '../src/data/site.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const offlineModus = process.argv.includes('--offline');
const TALEN = ['tr', 'nl', 'fr'];

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET ?? 'production';
const apiVersie = '2024-01-01';
const PLACEHOLDER = 'PROJECT_ID_NOG_NIET_AANGEMAAKT';

const fouten = [];

function keurPaginas(paginas, bron) {
  const gevonden = new Map();
  for (const pagina of paginas) {
    const sleutel = `${pagina.slug ?? ''}|${pagina.taal}`;
    gevonden.set(sleutel, (gevonden.get(sleutel) ?? 0) + 1);
  }
  for (const taal of TALEN) {
    for (const slug of SLUGS) {
      const aantal = gevonden.get(`${slug}|${taal}`) ?? 0;
      if (aantal === 0) fouten.push(`ONTBREEKT ${bron}: ${taal} /${slug || ''}`);
      else if (aantal > 1) fouten.push(`DUBBEL ${bron}: ${taal} /${slug || ''} (${aantal}x)`);
    }
  }
}

if (offlineModus) {
  const bestand = join(root, 'src', 'data', 'cms-fallback.json');
  const data = JSON.parse(await readFile(bestand, 'utf8'));
  keurPaginas(data.paginas ?? [], 'offline');

  if (!data.instellingen || typeof data.instellingen.sitenaam !== 'string') {
    fouten.push('ONTBREEKT offline: instellingen.sitenaam');
  }
  if (!Array.isArray(data.sponsorblokken) || data.sponsorblokken.length === 0) {
    fouten.push('ONTBREEKT offline: sponsorblokken');
  } else {
    for (const blok of data.sponsorblokken) {
      if (!/^https:\/\//.test(blok.link ?? '')) fouten.push(`FOUT offline: sponsorblok "${blok.label}" heeft geen https-link`);
    }
  }

  if (fouten.length > 0) {
    for (const regel of fouten) console.error(regel);
    console.error(`\n${fouten.length} fout(en) in de offline kopie.`);
    process.exit(1);
  }
  console.log(
    `OK offline kopie: ${SLUGS.length} slugs x ${TALEN.length} talen = ${data.paginas.length} pagina's, ` +
      `1 instellingen, ${data.sponsorblokken.length} sponsorblokken, nul fouten.`
  );
  process.exit(0);
}

if (projectId === undefined || projectId.trim() === '' || projectId === PLACEHOLDER) {
  console.error('NG  nog geen Sanity-project: zet SANITY_PROJECT_ID (zie sanity/README.md) of gebruik --offline.');
  process.exit(2);
}

const query = `{
  "paginas": *[_type == "pagina"]{ slug, taal },
  "instellingen": count(*[_type == "instellingen"]),
  "sponsorblokken": count(*[_type == "sponsorblok" && actief == true])
}`;

const url = `https://${projectId}.apicdn.sanity.io/v${apiVersie}/data/query/${dataset}?query=${encodeURIComponent(query)}`;

let resultaat;
try {
  const antwoord = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!antwoord.ok) {
    console.error(`NG  CMS antwoordde ${antwoord.status}.`);
    process.exit(1);
  }
  resultaat = (await antwoord.json()).result;
} catch (fout) {
  console.error(`NG  CMS onbereikbaar: ${fout instanceof Error ? fout.message : 'onbekende fout'}`);
  process.exit(1);
}

keurPaginas(
  (resultaat.paginas ?? []).map((p) => ({ slug: p.slug?.current ?? '', taal: p.taal })),
  'cms'
);
if (resultaat.instellingen !== 1) fouten.push(`FOUT cms: ${resultaat.instellingen} instellingen-documenten in plaats van 1`);
if (resultaat.sponsorblokken === 0) fouten.push('ONTBREEKT cms: actieve sponsorblokken');

if (fouten.length > 0) {
  for (const regel of fouten) console.error(regel);
  console.error(`\n${fouten.length} fout(en) in het CMS.`);
  process.exit(1);
}

console.log(
  `OK CMS ${projectId}/${dataset}: ${SLUGS.length} slugs x ${TALEN.length} talen compleet, ` +
    `1 instellingen, ${resultaat.sponsorblokken} actieve sponsorblokken, nul fouten.`
);
