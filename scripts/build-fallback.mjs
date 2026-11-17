#!/usr/bin/env node
/**
 * Bouwt `src/data/cms-fallback.json`: de offline kopie van alles wat het CMS
 * normaal levert. `npm run cms:fallback`.
 *
 * Waarom gegenereerd en niet met de hand: dezelfde blokken die hier in gaan,
 * gaan ook naar Sanity (`import-sanity.mjs --apply`). Zo kan de site nooit iets
 * anders tonen dan wat er in het CMS staat. Dit bestand aanpassen heeft dan ook
 * geen zin: de volgende run overschrijft het.
 *
 * Mislukt de verbinding met Sanity of is er nog geen project, dan leest
 * `src/lib/sanity.ts` dit bestand. De site blijft dus altijd werken.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PAGINAS } from './content/paginas.tr.mjs';
import { PAGINAS_NL } from './content/paginas.nl.mjs';
import { PAGINAS_FR } from './content/paginas.fr.mjs';
import { sleutels } from './lib/portable.mjs';
import { SLUGS, SITE } from '../src/data/site.ts';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '..', 'src', 'data', 'cms-fallback.json');

/**
 * De negen donatiebedragen van de oude site, in leesvolgorde. Ze staan hier en
 * niet in `paginas.tr.mjs`, want het zijn losse sponsordocumenten in Sanity en
 * geen proza op de pagina.
 */
const SPONSORBLOKKEN = [
  { bedrag: 5, label: '5€', link: 'https://payment-links.mollie.com/payment/2dXLCiwCd2BerhRaawwXY' },
  { bedrag: 10, label: '10€', link: 'https://payment-links.mollie.com/payment/qzZr3eJc4Q9AKtj2gWvtZ' },
  { bedrag: 25, label: '25€', link: 'https://payment-links.mollie.com/payment/7jQLY9LmoHdM7zVuTJkT9' },
  { bedrag: 50, label: '50€', link: 'https://payment-links.mollie.com/payment/7Rko4nphmSTRBCzDXLepQ' },
  { bedrag: 100, label: '100€', link: 'https://payment-links.mollie.com/payment/pJzUpd7m3nA9e7ZQu37zT' },
  { bedrag: 250, label: '250€', link: 'https://payment-links.mollie.com/payment/oFkusZKDQZncSjD9Zjd2f' },
  { bedrag: 500, label: '500€', link: 'https://payment-links.mollie.com/payment/eAYeiSrFRf27DZcnJKni5' },
  { bedrag: 1000, label: '1000€', link: 'https://payment-links.mollie.com/payment/FvxiwaRhqDa6N5Zw7Y2TU' },
  {
    bedrag: null,
    label: 'Miktarı Giriniz',
    link: 'https://payment-links.mollie.com/payment/FvxiwaRhqDa6N5Zw7Y2TU',
  },
];

/** Vorm van één pagina in de fallback; `src/lib/sanity-types.ts` is de baas. */
function pagina(slug, taal, bron) {
  return {
    _id: slug === '' ? `pagina.home.${taal}` : `pagina.${slug}.${taal}`,
    _type: 'pagina',
    titel: bron.titel,
    h1: bron.h1,
    intro: bron.intro ?? null,
    slug,
    taal,
    vertaalgroep: slug === '' ? 'home' : slug,
    volgorde: bron.volgorde,
    body: bron.body,
    seo: bron.seo,
  };
}

/**
 * Het Nederlands en Frans hebben hun eigen titel, h1, beschrijving en body.
 * De titel, h1 en beschrijving staan in `src/i18n/*.json` (het contract dat de
 * keuringspoort leest); de body staat in `content/paginas.<taal>.mjs`, als
 * vertaling van de Turkse bron. Heeft een taal geen vertaling voor een slug,
 * dan blijft de Turkse body staan; dat is alleen nog het geval bij de twee
 * juridische pagina's, en die zetten daar een zichtbare mededeling boven.
 */
const { default: nl } = await import('../src/i18n/nl.json', { with: { type: 'json' } });
const { default: fr } = await import('../src/i18n/fr.json', { with: { type: 'json' } });

const dictionaries = { nl, fr };
const bodies = { nl: PAGINAS_NL, fr: PAGINAS_FR };

function paginaInTaal(slug, taal, bron) {
  const basis = pagina(slug, taal, bron);
  if (taal === 'tr') return basis;
  const vertaald = bodies[taal]?.[slug];
  const body = vertaald ? sleutels(vertaald) : basis.body;
  const page = dictionaries[taal].pages[slug];
  if (!page) return { ...basis, body };
  return {
    ...basis,
    body,
    titel: page.title,
    h1: page.h1,
    seo: { titel: page.title, beschrijving: page.description },
  };
}

const paginas = [];
for (const taal of ['tr', 'nl', 'fr']) {
  for (const slug of SLUGS) {
    const bron = PAGINAS[slug];
    if (!bron) throw new Error(`paginas.tr.mjs mist slug "${slug}"`);
    paginas.push(paginaInTaal(slug, taal, bron));
  }
}

const fallback = {
  /** Gegenereerd door scripts/build-fallback.mjs. Niet met de hand aanpassen. */
  bron: 'scripts/content/paginas.tr.mjs + paginas.nl.mjs + paginas.fr.mjs',
  paginas,
  nieuws: [],
  afdelingen: [],
  regios: [],
  gebedstijden: [],
  preken: [],
  sponsorblokken: SPONSORBLOKKEN.map((blok, index) => ({
    _id: `sponsorblok.${String(index + 1).padStart(2, '0')}`,
    _type: 'sponsorblok',
    ...blok,
    volgorde: index + 1,
    actief: true,
  })),
  instellingen: {
    _id: 'instellingen',
    _type: 'instellingen',
    sitenaam: 'UCCIB',
    volledigeNaam: 'Union des Centres Culturels Islamiques Belgium',
    slagzin: 'Belçika İslam Kültür Merkezleri Birliği Vakfı',
    adres: {
      straat: SITE.street,
      postcode: SITE.postalCode,
      gemeente: SITE.city,
      land: SITE.country,
    },
    telefoon: SITE.phone,
    email: SITE.email,
    socials: [],
    noodtekst: { aan: false },
  },
};

await writeFile(target, `${JSON.stringify(fallback, null, 2)}\n`, 'utf8');

console.log(
  `OK ${target} geschreven: ${paginas.length} pagina's (${SLUGS.length} slugs x 3 talen), ` +
    `${fallback.sponsorblokken.length} sponsorblokken, instellingen.`
);
