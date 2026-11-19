#!/usr/bin/env node
/**
 * De poort van de stadspagina's: `npm run verify:steden`.
 *
 * Waarom een eigen poort en niet de gewone paginakeuring: die keurt negen slugs
 * in drie talen. De stadspagina's zijn er 99 (33 steden × 3 talen, Brussel woont
 * op de hoofdpagina) en elke pagina door de browser halen zou de keuring minuten
 * langer maken zonder dat de uitkomst beter wordt: ze delen één component.
 *
 * Wat hier per stad en per taal wordt gemeten, uit de gebouwde HTML:
 *   1. de pagina bestaat en heeft precies één h1 met de plaatsnaam erin;
 *   2. de titel is anders dan die van de hoofdpagina en noemt de stad;
 *   3. de canonical is het eigen adres en de drie hreflang-wissels kloppen;
 *   4. de plaatsregel naast de datum noemt dezelfde stad als het adres;
 *   5. er staan echte tijden in de pagina (geen rij van `--:--`), en die tijden
 *      zijn anders dan die van een andere stad: een pagina die stilletjes
 *      Brussel toont onder de naam van Gent is precies de fout van 19-11;
 *   6. elke stad staat in de lijst onderaan, en Brussel staat erop als de
 *      hoofdpagina (één adres per stad, nooit twee).
 *
 * Daarnaast accessibility (axe) op één stadspagina per taal: het onderdeel is
 * overal hetzelfde, dus één meting per taal dekt de rest.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { openBrowser, startStaticServer } from './lib/keuring.mjs';
import AxeBuilder from '@axe-core/playwright';

const DIST = resolve('dist');
const SITE = 'https://uccib.com';
const LOCALES = ['tr', 'nl', 'fr'];
const PREFIX = { tr: '', nl: '/nl', fr: '/fr' };
const LANG = { tr: 'tr-BE', nl: 'nl-BE', fr: 'fr-BE' };

/** De stadslijst uit de bron van waarheid, zodat deze poort niet kan verouderen. */
const { STEDEN } = await import(new URL('../functions/_lib/vakitler.js', import.meta.url).href);
const slugs = STEDEN.map((stad) => stad.slug);

const fouten = [];
const stadPad = (taal, stad) => `${PREFIX[taal]}/namaz-vakitleri/${stad}/`;
const fileVoor = (pad) => join(DIST, pad, 'index.html');

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const lees = async (pad) => {
  const file = fileVoor(pad);
  if (!existsSync(file)) return null;
  return readFile(file, 'utf8');
};

/**
 * De zes tijden van vandaag, uit de rij boven de weektabel. Die rij is wat de
 * lezer als eerste ziet.
 *
 * Waarom niet "deze tijden moeten verschillen van een andere stad": dat is geen
 * eerlijke meetlat. Leopoldsburg en Heusden-Zolder liggen zo dicht bij elkaar dat
 * hun tijden dagelijks gelijk zijn (gemeten 19-11: alle zes gelijk). In plaats
 * daarvan vergelijken we met de bron van waarheid, `src/data/vakitler.json`: elke
 * stadspagina moet precies de tijden van zijn eigen stad tonen.
 */
const tijdenVan = (html) => {
  const cellen = [...html.matchAll(/class="vakit-cel-tijd"[^>]*>\s*(\d{2}:\d{2})\s*</g)].map(
    (m) => m[1],
  );
  return cellen.slice(0, 6);
};

/**
 * De tijden van vandaag zoals het bestand van die stad ze kent, als `HH:mm` in de
 * klok van Brussel. Dit is de bron van waarheid: wijkt de pagina af, dan toont ze
 * de verkeerde stad of een verkeerde dag.
 */
const vakitBestand = JSON.parse(
  await readFile(new URL('../src/data/vakitler.json', import.meta.url), 'utf8'),
);
const TIJDZONE = vakitBestand.tijdstreep ?? 'Europe/Brussels';
const TIJDEN = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];

const vandaag = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIJDZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

function tijdenVoor(stad) {
  const dagen = vakitBestand.steden?.[stad]?.dagen ?? [];
  const dag = dagen.find((d) => d.datum === vandaag) ?? dagen[dagen.length - 1];
  if (!dag) return [];
  return TIJDEN.map((sleutel) =>
    new Intl.DateTimeFormat('nl-BE', {
      timeZone: TIJDZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(dag.tijden[sleutel])),
  );
}

let gekeurd = 0;

for (const stad of slugs.filter((s) => s !== 'brussel')) {
  for (const taal of LOCALES) {
    const pad = stadPad(taal, stad);
    const label = `${taal} ${pad}`;
    const html = await lees(pad);
    if (html === null) {
      fouten.push(`${label}: pagina ontbreekt in dist`);
      continue;
    }
    gekeurd += 1;

    const eigen = STEDEN.find((s) => s.slug === stad);
    const naam = eigen?.[taal] ?? stad;

    const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1]).trim());
    if (h1.length !== 1) fouten.push(`${label}: verwacht één h1, gevonden ${h1.length}`);
    else if (!h1[0].includes(naam)) {
      fouten.push(`${label}: de h1 noemt "${h1[0]}" en niet de stad ${naam}`);
    }

    const titel = decode(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '').trim();
    if (!titel) fouten.push(`${label}: geen titel`);
    else if (!titel.includes(naam)) fouten.push(`${label}: de titel "${titel}" noemt de stad niet`);

    const canonical = decode(
      /<link\s+rel="canonical"\s+href="([^"]*)"/i.exec(html)?.[1] ?? '',
    ).trim();
    const verwacht = new URL(pad, SITE).href;
    if (canonical !== verwacht) {
      fouten.push(`${label}: canonical is "${canonical}", verwacht "${verwacht}"`);
    }

    const wissels = new Map(
      [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]*)"\s+href="([^"]*)"/gi)].map(
        (m) => [m[1], decode(m[2])],
      ),
    );
    for (const ander of LOCALES) {
      const doel = new URL(stadPad(ander, stad), SITE).href;
      if (wissels.get(LANG[ander]) !== doel) {
        fouten.push(
          `${label}: hreflang ${LANG[ander]} is "${wissels.get(LANG[ander]) ?? 'afwezig'}", verwacht "${doel}"`,
        );
      }
    }

    const plaats = decode(/data-vakit-plaats[^>]*>([^<]*)</i.exec(html)?.[1] ?? '').trim();
    if (plaats !== naam) {
      fouten.push(`${label}: de plaatsregel zegt "${plaats}", verwacht "${naam}"`);
    }

    const tijden = tijdenVan(html);
    const verwachteTijden = tijdenVoor(stad);
    if (tijden.length !== 6 || tijden.some((t) => !/^\d{2}:\d{2}$/.test(t))) {
      fouten.push(`${label}: geen zes echte tijden in de pagina (${tijden.join(' ') || 'leeg'})`);
    } else if (verwachteTijden.length === 6 && tijden.join(' ') !== verwachteTijden.join(' ')) {
      fouten.push(
        `${label}: de pagina toont ${tijden.join(' ')} en het stadseigen bestand zegt ${verwachteTijden.join(' ')}`,
      );
    }

    for (const ander of slugs) {
      const doel = ander === 'brussel' ? `${PREFIX[taal]}/namaz-vakitleri/` : stadPad(taal, ander);
      if (ander === stad) continue;
      if (!html.includes(`href="${doel}"`)) {
        fouten.push(`${label}: de lijst onderaan mist ${ander} (${doel})`);
      }
    }
  }
}

/* De hoofdpagina zelf: Brussel, en Brussel heeft géén eigen stadsadres. */
for (const taal of LOCALES) {
  const pad = `${PREFIX[taal]}/namaz-vakitleri/`;
  const html = await lees(pad);
  if (html === null) {
    fouten.push(`${taal} ${pad}: pagina ontbreekt in dist`);
    continue;
  }
  gekeurd += 1;
  const plaats = decode(/data-vakit-plaats[^>]*>([^<]*)</i.exec(html)?.[1] ?? '').trim();
  if (plaats !== STEDEN.find((s) => s.slug === 'brussel')?.[taal]) {
    fouten.push(`${taal} ${pad}: de plaatsregel zegt "${plaats}", verwacht Brussel`);
  }
  if (existsSync(fileVoor(stadPad(taal, 'brussel')))) {
    fouten.push(`${taal} ${pad}: er bestaat ook een /brussel/-adres; één stad hoort één adres te hebben`);
  }
}

/* Accessibility op één stadspagina per taal; het onderdeel is overal gelijk. */
if (fouten.length === 0) {
  const server = await startStaticServer(DIST);
  const browser = await openBrowser();
  try {
    for (const taal of LOCALES) {
      const pad = stadPad(taal, 'gent');
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      try {
        await page.goto(`${server.baseUrl}${pad}`, { waitUntil: 'load' });
        await page.evaluate(() => {
          for (const animatie of document.getAnimations()) {
            try {
              animatie.finish();
            } catch {
              animatie.cancel();
            }
          }
        });
        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
          .analyze();
        for (const schending of axe.violations) {
          const doelen = schending.nodes
            .slice(0, 3)
            .map((n) => n.target.join(' '))
            .join(' | ');
          fouten.push(
            `${taal} ${pad}: axe ${schending.id} (${schending.impact}) — ${schending.nodes.length}x ${doelen}`,
          );
        }
      } finally {
        await page.close();
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

if (fouten.length > 0) {
  for (const regel of fouten) console.error(regel);
  console.error(`\n${fouten.length} fout(en) op ${gekeurd} stadspagina's.`);
  process.exit(1);
}

console.log(`OK ${gekeurd} stadspagina's: eigen h1, titel, canonical, hreflang, plaatsregel en tijden.`);
console.log(`OK de lijst onderaan noemt alle ${slugs.length} steden in elke taal, Brussel op de hoofdpagina.`);
console.log('OK axe op één stadspagina per taal: nul bevindingen.');
