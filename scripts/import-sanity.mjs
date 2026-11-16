#!/usr/bin/env node
/**
 * Zet de inhoud uit `scripts/content/` in Sanity. `npm run cms:import`.
 *
 * Twee standen:
 *   (zonder vlag)  droogloop: laat zien wat er zou gebeuren, schrijft niets.
 *   --apply        echt schrijven. Vereist `SANITY_API_TOKEN` in de omgeving.
 *
 * De token komt nooit uit een bestand en wordt nooit geprint: alleen een
 * variabele die de beheerder zelf voor één commando zet.
 *
 * Waarom `createOrReplace` en geen `create`: elk document heeft een vaste `_id`
 * (`pagina.<slug>.<taal>`, `sponsorblok.NN`, `instellingen`). Een tweede run
 * werkt dan bij in plaats van te verdubbelen. Wat de redactie daarna in de
 * Studio wijzigt, wordt door een volgende `--apply` overschreven: dit script is
 * voor de eerste vulling en voor een herstel, niet voor dagelijks gebruik.
 *
 * Afbeeldingen: in `paginas.tr.mjs` staat bij een beeld een pad in `public/`
 * als `asset._ref`. Dit script uploadt dat bestand één keer, bewaart het
 * asset-id in `.sanity-assets.json` (buiten de repo, in de temp-map) en zet de
 * echte referentie in het document.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PAGINAS } from './content/paginas.tr.mjs';
import { SLUGS } from '../src/data/site.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const apply = process.argv.includes('--apply');
const projectId = process.env.SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_TOKEN;
const apiVersie = '2024-01-01';

/**
 * Waar het asset-geheugen staat: de temp-map van dit project, nooit de repo.
 * `D:/tmp/win/uccib-f2/` is de enige schrijfplek buiten de worktree die de
 * opdracht toestaat.
 */
const assetCachePad = join('D:/tmp/win/uccib-f2', '.sanity-assets.json');

function stop(reden) {
  console.error(`STOP ${reden}`);
  process.exit(1);
}

if (projectId === undefined || projectId.trim() === '' || projectId === 'PROJECT_ID_NOG_NIET_AANGEMAAKT') {
  stop('geen projectId. Zet SANITY_PROJECT_ID (zie sanity/README.md) en probeer opnieuw.');
}

if (apply && (token === undefined || token.trim() === '')) {
  stop('--apply vereist SANITY_API_TOKEN in de omgeving. Zonder token alleen de droogloop.');
}

const sponsorbron = JSON.parse(await readFile(join(root, 'src', 'data', 'cms-fallback.json'), 'utf8'));
const sponsorblokken = sponsorbron.sponsorblokken;
const instellingen = sponsorbron.instellingen;

/** Eén document per (slug, taal), met de vaste `_id` uit plan §13. */
function paginaDocument(slug, taal, bron) {
  return {
    _id: slug === '' ? `pagina.home.${taal}` : `pagina.${slug}.${taal}`,
    _type: 'pagina',
    titel: bron.titel,
    h1: bron.h1,
    intro: bron.intro ?? undefined,
    slug: { _type: 'slug', current: slug === '' ? 'home' : slug },
    taal,
    vertaalgroep: slug === '' ? 'home' : slug,
    volgorde: bron.volgorde,
    body: bron.body,
    seo: bron.seo,
  };
}

const documenten = [];
for (const taal of ['tr', 'nl', 'fr']) {
  for (const slug of SLUGS) {
    const bron = PAGINAS[slug];
    if (!bron) stop(`paginas.tr.mjs mist slug "${slug}"`);
    documenten.push(paginaDocument(slug, taal, bron));
  }
}
documenten.push(...sponsorblokken.map((blok) => ({ ...blok, _type: 'sponsorblok' })));
documenten.push({ ...instellingen, _type: 'instellingen' });

/** Welke beelden de body's nodig hebben, met het pad in `public/`. */
function beeldenIn(document) {
  const paden = [];
  const bezoek = (waarde) => {
    if (Array.isArray(waarde)) {
      waarde.forEach(bezoek);
      return;
    }
    if (waarde && typeof waarde === 'object') {
      if (waarde._type === 'image' && typeof waarde.asset?._ref === 'string' && waarde.asset._ref.startsWith('/')) {
        paden.push(waarde.asset._ref);
      }
      for (const kind of Object.values(waarde)) bezoek(kind);
    }
  };
  bezoek(document);
  return paden;
}

const paden = [...new Set(documenten.flatMap(beeldenIn))].sort();

console.log(`${apply ? 'ECHT' : 'DROOGLOOP'} project ${projectId}, dataset ${dataset}`);
console.log(`${documenten.length} documenten: ${SLUGS.length} slugs x 3 talen + ${sponsorblokken.length} sponsorblokken + instellingen.`);
console.log(`${paden.length} afbeelding(en) in de body's die eerst geüpload moeten worden:`);
for (const pad of paden) console.log(`  ${pad}`);

if (!apply) {
  console.log('\nNiets geschreven. Voeg --apply toe (met SANITY_API_TOKEN) om echt te importeren.');
  process.exit(0);
}

/** Upload één bestand en geef de asset-referentie terug. */
async function upload(lokaalPad) {
  const bestand = join(root, 'public', lokaalPad.replace(/^\//, ''));
  if (!existsSync(bestand)) stop(`afbeelding niet gevonden: ${bestand}`);

  const cache = existsSync(assetCachePad) ? JSON.parse(await readFile(assetCachePad, 'utf8')) : {};
  if (cache[lokaalPad]) return cache[lokaalPad];

  const url = `https://api.sanity.io/v${apiVersie}/assets/images/${projectId}/${dataset}`;
  // In één keer in het geheugen: de beeldset van F1 is klein (honderden kB per
  // bestand) en een stream zou `duplex: 'half'` eisen zonder winst.
  const antwoord = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': inferType(bestand),
    },
    body: await readFile(bestand),
  });
  if (!antwoord.ok) stop(`upload van ${lokaalPad} mislukte: ${antwoord.status} ${await antwoord.text()}`);
  const json = await antwoord.json();
  const ref = json.document?._id;
  if (typeof ref !== 'string') stop(`upload van ${lokaalPad} gaf geen asset-id terug`);

  cache[lokaalPad] = ref;
  await writeFile(assetCachePad, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  return ref;
}

function inferType(pad) {
  if (pad.endsWith('.png')) return 'image/png';
  if (pad.endsWith('.avif')) return 'image/avif';
  if (pad.endsWith('.jpg') || pad.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/webp';
}

const vervangen = new Map();
for (const pad of paden) {
  vervangen.set(pad, await upload(pad));
  console.log(`  geüpload ${basename(pad)} -> ${vervangen.get(pad)}`);
}

function vervangBeelden(waarde) {
  if (Array.isArray(waarde)) return waarde.map(vervangBeelden);
  if (waarde && typeof waarde === 'object') {
    if (waarde._type === 'image' && typeof waarde.asset?._ref === 'string' && waarde.asset._ref.startsWith('/')) {
      return { ...waarde, asset: { _ref: vervangen.get(waarde.asset._ref) ?? waarde.asset._ref } };
    }
    return Object.fromEntries(Object.entries(waarde).map(([k, v]) => [k, vervangBeelden(v)]));
  }
  return waarde;
}

const mutationen = documenten.map((document) => ({
  createOrReplace: vervangBeelden(document),
}));

const antwoord = await fetch(`https://${projectId}.api.sanity.io/v${apiVersie}/data/mutate/${dataset}`, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({ mutations: mutationen }),
});

if (!antwoord.ok) stop(`schrijven mislukte: ${antwoord.status} ${await antwoord.text()}`);
const uitslag = await antwoord.json();
console.log(`OK ${uitslag.results?.length ?? mutationen.length} documenten geschreven naar ${projectId}/${dataset}.`);
