#!/usr/bin/env node
/**
 * Keurt de sponsor-funnel (F5).
 *
 * Meet vier dingen en faalt op elk daarvan:
 *
 *   1. elke tegel op /bagislar/ (drie talen) wijst naar de Mollie-link die bij
 *      dat bedrag hoort, en er zijn precies acht vaste bedragen plus één knop
 *      voor een eigen bedrag;
 *   2. het bedrag dat Mollie op zijn eigen scherm toont, is hetzelfde bedrag als
 *      het label op de tegel. Dat is de fout van de oude site: "Miktarı Giriniz"
 *      wees naar de link van 1.000 euro;
 *   3. de bedankpagina bestaat in drie talen, met één h1 en zonder noindex;
 *   4. de utm-parameters van plan §7 breken de betaallink niet: Mollie komt op
 *      zijn eigen betaalscherm uit.
 *
 * Gebruik: node scripts/verify-sponsor.mjs
 * Duurt een halve minuut tot een minuut, want elke betaallink wordt echt
 * geladen. Exitcode 0 = alles klopt, 1 = minstens één afwijking.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { openBrowser } from './lib/keuring.mjs';
import { BEDRAGEN, EIGEN_BEDRAG, MOLLIE_BASE, doneerUrl } from '../src/data/sponsor.ts';

const DIST = 'dist';
const LOCALES = ['tr', 'nl', 'fr'];
const SITE_URL = 'https://uccib.com';

const fouten = [];
const ok = [];

/** Pad van een route, zoals src/i18n/config.ts hem maakt. */
function pagePath(locale, slug) {
  const prefix = locale === 'tr' ? '' : `/${locale}`;
  return `${prefix}/${slug}/`;
}

function bestandVoor(route) {
  return join(DIST, route, 'index.html');
}

function attr(tag, naam) {
  const m = tag.match(new RegExp(`\\s${naam}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1].replace(/&amp;/g, '&') : null;
}

/**
 * Het bedrag dat Mollie toont ("€50.00", "€1,000.00", "€50,00") naar euro.
 * De laatste twee cijfers achter een punt of komma zijn de centen; wat daarvoor
 * staat is het hele bedrag, met punt of komma als duizendtal-scheiding.
 */
function naarEuro(tekst) {
  const m = tekst.match(/€\s*([0-9][0-9.,\s]*)/);
  if (!m) return null;
  const token = m[1].replace(/\s/g, '');
  const centen = token.match(/[.,](\d{2})$/);
  if (centen) {
    const geheel = token.slice(0, token.length - 3).replace(/[.,]/g, '');
    return Number(geheel) + Number(centen[1]) / 100;
  }
  return Number(token.replace(/[.,]/g, ''));
}

/** Alle Mollie-links op een gebouwde pagina, met hun label-bedrag. */
function leesTegels(html) {
  const tegels = [];
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = attr(tag, 'href');
    if (!href || !href.startsWith(MOLLIE_BASE)) continue;
    tegels.push({
      href,
      bedrag: Number(attr(tag, 'data-bedrag')),
      eigen: attr(tag, 'data-eigen') === 'true',
    });
  }
  return tegels;
}

// 1. De tegels: acht vaste bedragen plus één eigen-bedrag-knop, met de juiste link.
const perId = new Map();
for (const locale of LOCALES) {
  const route = pagePath(locale, 'bagislar');
  let html;
  try {
    html = await readFile(bestandVoor(route), 'utf8');
  } catch {
    fouten.push(`${locale} ${route}: gebouwde pagina ontbreekt`);
    continue;
  }
  const tegels = leesTegels(html);
  const vast = tegels.filter((t) => !t.eigen);
  const eigen = tegels.filter((t) => t.eigen);

  if (vast.length !== BEDRAGEN.length) {
    fouten.push(`${locale} ${route}: ${vast.length} vaste tegels, verwacht ${BEDRAGEN.length}`);
  }
  if (eigen.length !== 1) {
    fouten.push(`${locale} ${route}: ${eigen.length} eigen-bedrag-knoppen, verwacht 1`);
  }

  for (const { euro, id } of BEDRAGEN) {
    const tegel = vast.find((t) => t.bedrag === euro);
    if (!tegel) {
      fouten.push(`${locale} ${route}: geen tegel voor ${euro} euro`);
      continue;
    }
    if (!tegel.href.startsWith(`${MOLLIE_BASE}${id}?`)) {
      fouten.push(`${locale} ${route}: ${euro} euro wijst naar ${tegel.href}, verwacht ${id}`);
      continue;
    }
    if (!/utm_source=uccib/.test(tegel.href) || !tegel.href.includes(`utm_campaign=${euro}`)) {
      fouten.push(`${locale} ${route}: ${euro} euro mist de utm-parameters (${tegel.href})`);
    }
    perId.set(id, { euro, href: tegel.href });
  }

  if (eigen[0]) {
    if (eigen[0].bedrag !== EIGEN_BEDRAG.euro) {
      fouten.push(
        `${locale} ${route}: eigen bedrag staat op ${eigen[0].bedrag}, verwacht ${EIGEN_BEDRAG.euro}`,
      );
    }
    if (!eigen[0].href.startsWith(`${MOLLIE_BASE}${EIGEN_BEDRAG.id}?`)) {
      fouten.push(`${locale} ${route}: eigen bedrag wijst naar ${eigen[0].href}`);
    }
    perId.set(EIGEN_BEDRAG.id, { euro: EIGEN_BEDRAG.euro, href: eigen[0].href });
  }
}
if (perId.size === 8 && !fouten.some((f) => f.includes('bagislar'))) {
  ok.push(`tegels: ${perId.size} bedragen, drie talen, elk naar de juiste link met utm`);
}

// 2. De bedankpagina bestaat in drie talen, met één h1 en zonder noindex.
for (const locale of LOCALES) {
  const route = pagePath(locale, 'bagis-onayi');
  let html;
  try {
    html = await readFile(bestandVoor(route), 'utf8');
  } catch {
    fouten.push(`${locale} ${route}: bedankpagina ontbreekt`);
    continue;
  }
  const h1 = (html.match(/<h1\b/gi) ?? []).length;
  if (h1 !== 1) fouten.push(`${locale} ${route}: ${h1} h1, verwacht 1`);
  if (/name="robots"[^>]*noindex/i.test(html)) {
    fouten.push(`${locale} ${route}: draagt noindex, mag niet`);
  }
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  if (!canonical || canonical[1] !== `${SITE_URL}${route}`) {
    fouten.push(`${locale} ${route}: canonical ontbreekt of is ongelijk aan ${SITE_URL}${route}`);
  }
}
if (!fouten.some((f) => f.includes('bagis-onayi'))) {
  ok.push('bedankpagina: drie talen, één h1, canonical, geen noindex');
}

// 3. Wat Mollie zelf toont, per link. Dit is de kern: label en bedrag gelijk.
if (perId.size > 0) {
  const browser = await openBrowser();
  try {
    for (const [id, { euro }] of perId) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        locale: 'nl-BE',
      });
      const page = await context.newPage();
      try {
        await page.goto(doneerUrl(euro, id), { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(() => document.body.innerText.includes('€'), null, {
          timeout: 30000,
        });
        const tekst = await page.evaluate(() => document.body.innerText);
        const getoond = naarEuro(tekst);
        const titel = await page.title();

        if (getoond !== euro) {
          fouten.push(
            `${euro} euro: Mollie toont ${getoond === null ? 'geen bedrag' : `${getoond} euro`} (${titel})`,
          );
        } else {
          ok.push(`${euro} euro: Mollie toont ${getoond} euro — ${page.url()}`);
        }
      } catch (error) {
        fouten.push(`${euro} euro: betaalpagina laadt niet (${error.message.split('\n')[0]})`);
      } finally {
        await page.close();
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

// 4. Uitslag.
for (const regel of ok) console.log(`OK   ${regel}`);
for (const regel of fouten) console.log(`FOUT ${regel}`);
console.log('');
if (fouten.length > 0) {
  console.log(`verify-sponsor: ${fouten.length} afwijking(en)`);
  process.exit(1);
}
console.log(`verify-sponsor: alles klopt (${ok.length} controles)`);
