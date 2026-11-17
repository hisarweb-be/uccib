#!/usr/bin/env node
/**
 * De opleveringstoets: elke pagina apart, in elke taal, met een eigen oordeel.
 *
 * `npm run verify` keurt een lijst en meldt alleen fouten: één regel per pagina
 * ontbreekt, en een groene uitkomst zegt niet wélke pagina's er echt zijn
 * langsgekomen. Dit script draait dezelfde controles, maar telt ze en zet elke
 * pagina op een eigen regel, zodat "alles getest" na te lezen is in plaats van
 * aan te nemen.
 *
 *   node scripts/verify-een-voor-een.mjs                 → tegen dist/ (na npm run build)
 *   node scripts/verify-een-voor-een.mjs --basis <url>   → tegen de levende site
 *
 * Wat er per pagina gebeurt:
 *   - pagina's met inhoud: de vijf controles uit plan §8 (titel, beschrijving,
 *     precies één h1, canonical plus drie hreflang, beelden en links, axe-core);
 *   - concepten: route bestaat, één h1, noindex, geen hreflang, nergens gelinkt;
 *   - in de levende stand komen daar de echte statuscodes bij: elke afbeelding,
 *     elk script en elk stijlblad dat de pagina noemt wordt opgehaald.
 *
 * Exitcode 1 bij elke fout, 0 als alles groen is.
 */
import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import {
  ACTIVE_SLUGS,
  CONCEPT_SLUGS,
  LOCALES,
  SITE_URL,
  checkPage,
  distFileFor,
  openBrowser,
  pagePath,
  startStaticServer,
} from './lib/keuring.mjs';

const distDir = resolve('dist');
const basisArg = process.argv.slice(2).find((a) => a.startsWith('--basis'));
const basis = basisArg ? basisArg.split('=')[1] ?? process.argv[process.argv.indexOf(basisArg) + 1] : null;
const levend = Boolean(basis);
const siteBasis = (basis ?? SITE_URL).replace(/\/$/, '');

let goed = 0;
let fout = 0;
const fouten = [];
const nummer = { n: 0 };
const paginas = (ACTIVE_SLUGS.length + CONCEPT_SLUGS.length) * LOCALES.length;

function meld(ok, regel, detail = '') {
  nummer.n += 1;
  if (ok) goed += 1;
  else {
    fout += 1;
    fouten.push(`${regel}${detail ? ` — ${detail}` : ''}`);
  }
  const merk = ok ? 'OK  ' : 'FOUT';
  // De pagina's krijgen hun eigen nummer op 42; de algemene controles erna tellen los door
  // als +1, +2, zodat niemand 55/42 ziet staan.
  const teller =
    nummer.n <= paginas ? `${String(nummer.n).padStart(2)}/${paginas}` : ` +${String(nummer.n - paginas).padStart(2)}  `;
  console.log(`[${teller}] ${merk} ${regel}${detail ? `  ${detail}` : ''}`);
}

const taal = (locale) => (locale === 'tr' ? 'tr-BE' : locale === 'nl' ? 'nl-BE' : 'fr-BE');

/** Titel, omschrijving en h1 uit html halen, voor de controles die geen browser nodig hebben. */
function ontleed(html) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  const beschrijving = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return {
    titel: title ? title[1].replace(/&amp;/g, '&').trim() : '',
    beschrijving: beschrijving ? beschrijving[1].trim() : '',
    h1: (html.match(/<h1\b/gi) ?? []).length,
    noindex: /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html),
  };
}

async function bestaat(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function haalHtml(locale, slug) {
  const route = pagePath(locale, slug);
  if (!levend) {
    try {
      return await readFile(distFileFor(distDir, route), 'utf8');
    } catch {
      return null;
    }
  }
  const antwoord = await fetch(`${siteBasis}${route}`, { redirect: 'follow' });
  if (antwoord.status !== 200) return { status: antwoord.status };
  return antwoord.text();
}

/**
 * Een pagina of bestand buiten de paginaroutes, bijvoorbeeld `/admin/`.
 * Zelfde vorm als `haalHtml`: tekst bij succes, `null` of `{status}` anders.
 */
async function haalPad(pad) {
  if (!levend) {
    try {
      return await readFile(distFileFor(distDir, pad), 'utf8');
    } catch {
      return null;
    }
  }
  const antwoord = await fetch(`${siteBasis}${pad}`, { redirect: 'follow' });
  if (antwoord.status !== 200) return { status: antwoord.status };
  return antwoord.text();
}

/** Elke afbeelding, elk script en elk stijlblad dat de pagina noemt, één keer ophalen. */
async function haalBronnen(html, gezien) {
  const bronnen = new Set();
  for (const tag of html.match(/<(?:img|source|script|link)\b[^>]*>/gi) ?? []) {
    for (const [, waarde] of tag.matchAll(/\s(?:src|srcset|href)\s*=\s*"([^"]*)"/gi)) {
      for (const kandidaat of waarde.split(',')) {
        const pad = kandidaat.trim().split(/\s+/)[0];
        if (!pad || /^(data:|mailto:|tel:|#)/i.test(pad)) continue;
        if (/^https?:/i.test(pad) && !pad.startsWith(siteBasis) && !pad.startsWith(SITE_URL)) continue;
        bronnen.add(pad.startsWith('http') ? pad.replace(siteBasis, '').replace(SITE_URL, '') : pad);
      }
    }
  }
  const nieuw = [...bronnen].filter((pad) => !gezien.has(pad));
  for (const pad of nieuw) gezien.add(pad);
  return nieuw;
}

async function controleerBron(pad) {
  if (!levend) return bestaat(distFileFor(distDir, pad));
  const antwoord = await fetch(`${siteBasis}${pad}`, { method: 'GET' });
  return antwoord.status === 200;
}

const gezienBronnen = new Set();
const bronFouten = [];
/** Wat we al ophaalden, per route: de linkcontrole hoeft niets extra te vragen. */
const opgehaald = new Map();

async function main() {
  if (!levend && !existsSync(join(distDir, 'index.html'))) {
    console.error('dist/ ontbreekt of is leeg: draai eerst npm run build.');
    process.exit(1);
  }

  const server = levend ? null : await startStaticServer(distDir);
  const browser = await openBrowser();
  const baseUrl = levend ? siteBasis : server.baseUrl;

  try {
    // Eerst de thuispagina per taal, zodat een concept dat stiekem de homepage
    // toont te herkennen is aan een gelijke titel.
    const thuis = {};
    for (const locale of LOCALES) {
      const html = await haalHtml(locale, '');
      const p = typeof html === 'string' ? ontleed(html) : { titel: '' };
      thuis[locale] = p.titel;
    }

    for (const slug of ACTIVE_SLUGS) {
      for (const locale of LOCALES) {
        const route = pagePath(locale, slug);
        const label = `${locale.padEnd(2)} ${route}`;

        if (levend) {
          const html = await haalHtml(locale, slug);
          if (typeof html !== 'string') {
            meld(false, label, `status ${html?.status ?? 'geen antwoord'}`);
            continue;
          }
          const p = ontleed(html);
          const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
          const alternates = [...html.matchAll(/rel="alternate"\s+hreflang="([^"]*)"/gi)].map((m) => m[1]);
          const problemen = [];
          if (!p.titel) problemen.push('titel leeg');
          if (!p.beschrijving) problemen.push('beschrijving leeg');
          if (p.h1 !== 1) problemen.push(`h1=${p.h1}`);
          if (p.noindex) problemen.push('noindex op een echte pagina');
          if (!canonical) problemen.push('canonical ontbreekt');
          else if (canonical[1] !== new URL(route, SITE_URL).href) problemen.push(`canonical=${canonical[1]}`);
          for (const other of LOCALES) {
            if (!alternates.includes(taal(other))) problemen.push(`hreflang ${taal(other)} mist`);
          }
          if (slug !== '' && p.titel === thuis[locale]) problemen.push('toont de homepage');
          meld(problemen.length === 0, label, problemen.join(', ') || `titel "${p.titel.slice(0, 40)}"`);

          opgehaald.set(route, html);
          for (const pad of await haalBronnen(html, gezienBronnen)) {
            if (!(await controleerBron(pad))) bronFouten.push(`${pad} (via ${route})`);
          }
          continue;
        }

        const paginaFouten = await checkPage({ browser, baseUrl, distDir, locale, slug });
        const html = await haalHtml(locale, slug);
        const beelden = typeof html === 'string' ? (html.match(/<img\b/gi) ?? []).length : 0;
        const links = typeof html === 'string' ? (html.match(/<a\b/gi) ?? []).length : 0;
        meld(
          paginaFouten.length === 0,
          label,
          paginaFouten.length === 0
            ? `${beelden} beelden, ${links} links, axe 0`
            : paginaFouten.slice(0, 2).join(' | '),
        );
      }
    }

    // Concepten: verborgen, maar wel fatsoenlijk. Een titel per taal, geen
    // terugval op de homepage, en geen enkele pagina die ernaartoe linkt.
    const conceptTitels = {};
    for (const slug of CONCEPT_SLUGS) {
      for (const locale of LOCALES) {
        const route = pagePath(locale, slug);
        const label = `${locale.padEnd(2)} ${route} (concept)`;
        const html = await haalHtml(locale, slug);
        if (typeof html !== 'string') {
          meld(false, label, levend ? `status ${html?.status ?? 'geen antwoord'}` : 'route ontbreekt');
          continue;
        }
        const p = ontleed(html);
        const problemen = [];
        if (!levend && (html.match(/<h1\b/gi) ?? []).length !== 1) problemen.push('h1 ontbreekt');
        if (!p.titel) problemen.push('titel leeg');
        if (!p.beschrijving) problemen.push('beschrijving leeg');
        if (!p.noindex) problemen.push('noindex ontbreekt');
        if (/rel="alternate"\s+hreflang=/i.test(html)) problemen.push('heeft hreflang');
        if (p.titel === thuis[locale]) problemen.push('toont de homepage');
        conceptTitels[`${locale}/${slug}`] = p.titel;
        opgehaald.set(route, html);
        meld(problemen.length === 0, label, problemen.join(', ') || p.titel.slice(0, 48));
      }
    }

    // Eén titel, één bericht per taal: tien lege pagina's met dezelfde tekst is
    // voor een bezoeker hetzelfde als één lege pagina.
    //
    // Sinds F3 is de conceptlijst leeg: alle veertien pagina's hebben inhoud. Er
    // valt dan niets te vergelijken, en "nul concepten, nul titels" is geen fout
    // maar de bedoelde eindstand. Zonder deze regel keurt de toets zijn eigen
    // succes af. Zodra er weer een concept bij komt, geldt de vergelijking weer.
    for (const locale of LOCALES) {
      const perTaal = CONCEPT_SLUGS.map((slug) => conceptTitels[`${locale}/${slug}`]).filter(Boolean);
      const uniek = new Set(perTaal);
      meld(
        CONCEPT_SLUGS.length === 0 || (perTaal.length === CONCEPT_SLUGS.length && uniek.size === 1),
        `${locale.padEnd(2)} concepttekst`,
        CONCEPT_SLUGS.length === 0
          ? `geen concepten, alle pagina’s hebben inhoud`
          : `${perTaal.length} concepten, ${uniek.size} verschillende titel(s)`,
      );
    }

    // Geen enkele pagina linkt naar een concept, en de sitemap noemt ze niet.
    const linkFouten = [];
    let linkTelling = 0;
    // Levend: de html die we net al ophaalden. Lokaal: alles uit dist/, behalve 404.html,
    // want die hoort bij geen enkele pagina en mag best naar een concept wijzen.
    const teKijken = levend
      ? [...opgehaald.entries()]
      : await Promise.all(
          (await walkHtml(distDir))
            .filter((f) => !f.endsWith('404.html'))
            .map(async (f) => [f, await readFile(f, 'utf8')]),
        );
    for (const [file, html] of teKijken) {
      const romp = html.slice(Math.max(0, html.search(/<body\b/i)));
      for (const [, href] of romp.matchAll(/href\s*=\s*"([^"]*)"/gi)) {
        const pad = href.replace(/^https?:\/\/uccib\.com/i, '').split(/[?#]/)[0];
        linkTelling += 1;
        for (const slug of CONCEPT_SLUGS) {
          for (const locale of LOCALES) {
            const route = pagePath(locale, slug);
            if (pad === route || pad === route.slice(0, -1)) linkFouten.push(`${file}: ${href}`);
          }
        }
      }
    }
    meld(linkFouten.length === 0, 'nergens een link naar een concept', `${linkTelling} links nagekeken${linkFouten.length ? ` | ${linkFouten.slice(0, 2).join(' | ')}` : ''}`);

    const sitemapFouten = [];
    let sitemapAdressen = 0;
    if (levend) {
      const xml = await (await fetch(`${siteBasis}/sitemap-0.xml`)).text();
      const adressen = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
      sitemapAdressen = adressen.length;
      const verwacht = ACTIVE_SLUGS.flatMap((slug) => LOCALES.map((l) => new URL(pagePath(l, slug), SITE_URL).href));
      const ontbreekt = verwacht.filter((u) => !adressen.includes(u));
      const teveel = adressen.filter((u) => !verwacht.includes(u));
      if (ontbreekt.length) sitemapFouten.push(`mist ${ontbreekt.length}: ${ontbreekt.slice(0, 2).join(', ')}`);
      if (teveel.length) sitemapFouten.push(`${teveel.length} te veel: ${teveel.slice(0, 2).join(', ')}`);
    } else {
      // Alleen de sitemap met pagina's: sitemap-index.xml noemt de sitemaps zelf, en die
      // <loc> is geen pagina. Levend lezen we ook alleen sitemap-0.xml.
      for (const naam of (await readdir(distDir)).filter((n) => /^sitemap-\d+\.xml$/.test(n))) {
        const xml = await readFile(join(distDir, naam), 'utf8');
        for (const [, url] of xml.matchAll(/<loc>([^<]*)<\/loc>/g)) {
          sitemapAdressen += 1;
          const pad = url.replace(/^https?:\/\/[^/]+/i, '/');
          for (const slug of CONCEPT_SLUGS) {
            for (const locale of LOCALES) {
              const route = pagePath(locale, slug);
              if (pad === route || pad === route.slice(0, -1)) sitemapFouten.push(`${naam}: ${url}`);
            }
          }
        }
      }
    }
    meld(
      sitemapFouten.length === 0 && sitemapAdressen === ACTIVE_SLUGS.length * LOCALES.length,
      'sitemap',
      `${sitemapAdressen} adressen, verwacht ${ACTIVE_SLUGS.length * LOCALES.length}${sitemapFouten.length ? ` | ${sitemapFouten.slice(0, 2).join(' | ')}` : ''}`,
    );

    // Een onbekend pad moet een echte 404 zijn, geen homepage met status 200.
    for (const pad of ['/zzz-qw-8888', '/nl/zzz-qw-8888', '/fr/zzz-qw-8888']) {
      if (levend) {
        const antwoord = await fetch(`${siteBasis}${pad}`);
        const html = await antwoord.text();
        meld(antwoord.status === 404 && /Sayfa bulunamad/.test(html), `onbekend ${pad}`, `status ${antwoord.status}`);
      } else {
        const html = await readFile(join(distDir, '404.html'), 'utf8');
        meld(ontleed(html).h1 === 1 && ontleed(html).noindex, `404.html voor ${pad}`, 'bestaat, één h1, noindex');
      }
    }

    // De vaste bestanden die elke bezoeker en elke zoekmachine nodig heeft.
    for (const pad of ['/robots.txt', '/sitemap-index.xml', '/site.webmanifest', '/beeld/logo/favicon.ico']) {
      const ok = await controleerBron(pad);
      meld(ok, `vast bestand ${pad}`);
    }

    // Het bewerkscherm van dhr. Omer. Sinds 17-11 is dat Sveltia CMS in
    // `public/admin/`; de Sanity Studio op /beheer bestaat niet meer. Wat hier
    // bewezen moet worden: het scherm en zijn configuratie gaan mee in de
    // uitrol, het vraagt geen indexering aan, en het laadt Sveltia van de cdn
    // in plaats van een eigen bundel van 22 MB.
    {
      const scherm = await haalPad('/admin/');
      const html = typeof scherm === 'string' ? scherm : null;
      meld(
        html !== null,
        'beheer (/admin/ bestaat)',
        html !== null ? '' : levend ? `status ${scherm?.status ?? 'geen antwoord'}` : 'route ontbreekt',
      );
      if (html !== null) {
        meld(
          /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html),
          'beheer (vraagt geen indexering)',
          'meta robots',
        );
        meld(/sveltia-cms/.test(html), 'beheer (laadt Sveltia CMS)', 'script van de cdn');
      }
      meld(await controleerBron('/admin/config.yml'), 'beheer (configuratie meegeleverd)', 'config.yml');
    }

    // Elke bron die de pagina's noemen, één keer gemeten.
    if (levend && bronFouten.length) {
      for (const regel of bronFouten.slice(0, 10)) console.log(`FOUT bron ${regel}`);
      fout += bronFouten.length;
    }
    meld(
      bronFouten.length === 0,
      'alle beelden, scripts en stijlen laden',
      levend ? `${gezienBronnen.size} bronnen gemeten` : 'lokaal al door checkPage gedekt',
    );
  } finally {
    await browser.close();
    if (server) await server.close();
  }

  console.log(`\nGOED ${goed}   FOUT ${fout}   (${levend ? siteBasis : 'dist/'})`);
  if (fout > 0) {
    console.log('\nFouten:');
    for (const regel of fouten) console.log(`- ${regel}`);
    process.exit(1);
  }
}

async function walkHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkHtml(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out.sort();
}

await main();
