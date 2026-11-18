/**
 * Gedeelde keuringslogica voor verify-pagina.mjs, verify-alle.mjs en verify-links.mjs.
 * Houdt de controles op één plek, zodat één pagina en alle pagina's precies
 * hetzelfde meten.
 */
import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

import { conceptSlugs } from '../../src/lib/actief.ts';

/**
 * De veertien slugs uit plan §8. Hier staan ze allemaal, zodat de keuring weet
 * wat een geldige route is; welke daarvan nu echte inhoud hebben, staat in
 * ACTIVE_SLUGS.
 *
 * De lijst met wat een concept is komt uit src/data/site.ts zelf, niet uit een
 * tweede kopie hier. Node 22 leest die TypeScript-bron rechtstreeks, dus er is
 * één schakelaar: haalt een fase een slug uit CONCEPT_SLUGS, dan verschuift de
 * keuring mee zonder dat iemand hier iets aanpast. Tot 17-11 stond hier een
 * tweede lijst en dan vergeet een fase er één, met een groene keuring op een
 * pagina die niemand ziet als gevolg.
 */
export const ALL_SLUGS = [
  '',
  'hakkimizda',
  'hizmetlerimiz',
  'haberler',
  'iletisim',
  'bagislar',
  'bagis-onayi',
  'subelerimiz',
  'bolge-derneklerimiz',
  'namaz-vakitleri',
  'cuma-hutbesi',
  'disclameer',
  'cerez-politikasi-cookie-policy',
  'baharkermesi-menu',
];

/**
 * Pagina's met echte inhoud, de enige die de vijf paginacontroles hoeven te
 * halen. De andere zijn concepten: die krijgen hun eigen, strengere controle in
 * checkConcepten() hieronder, want een lege pagina die de paginakeuring haalt,
 * is precies de verkeerde uitkomst.
 *
 * De bron is de front-matter van src/content/paginas/tr/*.md (`active: false`,
 * zie src/lib/actief.ts); deze regel leiden we daaruit af
 * en niet andersom.
 */
export const CONCEPT_SLUGS = ALL_SLUGS.filter((slug) => conceptSlugs().includes(slug));

export const ACTIVE_SLUGS = ALL_SLUGS.filter((slug) => !CONCEPT_SLUGS.includes(slug));

/** Achterwaartse naam: verify-pagina.mjs gebruikt SLUGS als "alle geldige routes". */
export const SLUGS = ALL_SLUGS;

export const LOCALES = ['tr', 'nl', 'fr'];
export const DEFAULT_LOCALE = 'tr';
export const SITE_URL = 'https://uccib.com';

/** Zelfde regel als src/i18n/config.ts; hier in gewoon JS omdat de scripts geen build stap hebben. */
export function pagePath(locale, slug) {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return slug === '' ? `${prefix}/` : `${prefix}/${slug}/`;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/** Start een statische server op een vrije poort bovenop dist/. */
export async function startStaticServer(rootRaw) {
  // `join()` maakt op Windows backslashes terwijl dezelfde `root` met schuine
  // strepen binnenkomt. Zonder deze regel faalt de grenscontrole op elk pad en
  // antwoordt de server 403 op alles, waarna de keuring naar een foutpagina
  // kijkt. `resolve()` zet beide notaties op dezelfde vorm.
  const root = resolve(rootRaw);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const safe = normalize(pathname).replace(/^([/\\])+/, '');
      const file = join(root, safe);
      if (!file.startsWith(root + sep) && file !== root) {
        res.writeHead(403).end('verboden pad');
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('niet gevonden');
    }
  });

  await new Promise((klaar) => server.listen(0, '127.0.0.1', klaar));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  // Zelfcontrole: serveert deze server de eigen startpagina? Zo niet, dan zegt
  // elke keuring daarna iets over een foutpagina in plaats van over de site.
  // Liever hier hard stoppen dan groen melden op niets.
  const proef = await fetch(`${baseUrl}/`);
  if (proef.status !== 200) {
    server.close();
    throw new Error(
      `startStaticServer serveert ${root} niet (status ${proef.status} op /). ` +
        'De keuring zou naar een foutpagina kijken en toch groen melden.',
    );
  }

  return {
    baseUrl,
    // `close()` alleen wacht tot elke open verbinding vanzelf sluit, en een
    // keep-alive-verbinding doet dat niet: de keuring zou aan het eind blijven
    // hangen. Eerst de open verbindingen sluiten, dan pas afronden.
    close: () =>
      new Promise((klaar) => {
        server.closeAllConnections();
        server.close(klaar);
      }),
  };
}

const LAPTOP_CACHE = 'D:/cache/ms-playwright';

/**
 * Op deze laptop staat Chromium in D:/cache/ms-playwright (nooit op C:).
 * Op een andere machine, ook in CI, geldt de standaardcache van Playwright.
 */
export async function openBrowser() {
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && (await exists(LAPTOP_CACHE))) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = LAPTOP_CACHE;
  }
  return chromium.launch({ headless: true });
}

/** Bestand in dist/ hoort bij een pad uit de site. Null als het pad geen pagina of bestand kan zijn. */
export function distFileFor(distDir, pathname) {
  const clean = pathname.split('#')[0].split('?')[0];
  if (clean.endsWith('/')) return join(distDir, clean, 'index.html');
  if (extname(clean)) return join(distDir, clean);
  return join(distDir, clean, 'index.html');
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return match ? decodeEntities(match[1]) : null;
}

/**
 * Keurt één gebouwde pagina. Geeft een lijst leesbare foutregels terug;
 * een lege lijst betekent groen.
 */
export async function checkPage({ browser, baseUrl, distDir, locale, slug }) {
  const errors = [];
  const route = pagePath(locale, slug);
  const label = `${locale} ${route}`;

  const file = distFileFor(distDir, route);
  let html;
  try {
    html = await readFile(file, 'utf8');
  } catch {
    return [`${label}: gebouwde pagina ontbreekt (${file})`];
  }

  // a) titel, metabeschrijving en precies één h1
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!title || !decodeEntities(title[1]).trim()) {
    errors.push(`${label}: <title> ontbreekt of is leeg`);
  }
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!description || !decodeEntities(description[1]).trim()) {
    errors.push(`${label}: meta description ontbreekt of is leeg`);
  }
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  if (h1Count !== 1) {
    errors.push(`${label}: verwacht precies één <h1>, gevonden ${h1Count}`);
  }

  // b) elke afbeelding heeft alt en bestaat in dist/
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of imgTags) {
    const src = attr(tag, 'src');
    const alt = attr(tag, 'alt');
    if (alt === null) errors.push(`${label}: <img> zonder alt (${src ?? 'geen src'})`);
    else if (!alt.trim()) errors.push(`${label}: <img> met lege alt (${src ?? 'geen src'})`);
    if (!src) {
      errors.push(`${label}: <img> zonder src`);
      continue;
    }
    if (/^https?:/i.test(src)) continue;
    if (!(await exists(distFileFor(distDir, src)))) {
      errors.push(`${label}: afbeelding laadt niet (${src})`);
    }
  }

  // c) elke interne link bestaat in dist/
  const linkTags = html.match(/<a\b[^>]*>/gi) ?? [];
  for (const tag of linkTags) {
    const href = attr(tag, 'href');
    if (!href) continue;
    if (/^(mailto:|tel:|#)/i.test(href)) continue;
    let pathname = href;
    if (/^https?:/i.test(href)) {
      const parsed = new URL(href);
      if (`${parsed.protocol}//${parsed.host}` !== SITE_URL) continue;
      pathname = parsed.pathname;
    }
    if (!(await exists(distFileFor(distDir, pathname)))) {
      errors.push(`${label}: interne link wijst naar niets (${href})`);
    }
  }

  // d) canonical en de drie hreflang-verwijzingen
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const expectedCanonical = new URL(route, SITE_URL).href;
  if (!canonical) errors.push(`${label}: canonical ontbreekt`);
  else if (decodeEntities(canonical[1]) !== expectedCanonical) {
    errors.push(
      `${label}: canonical is ${decodeEntities(canonical[1])}, verwacht ${expectedCanonical}`,
    );
  }

  const alternates = [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]*)"\s+href="([^"]*)"/gi)];
  for (const other of LOCALES) {
    const wanted = new URL(pagePath(other, slug), SITE_URL).href;
    const lang = other === 'tr' ? 'tr-BE' : other === 'nl' ? 'nl-BE' : 'fr-BE';
    const found = alternates.find((m) => m[1] === lang);
    if (!found) {
      errors.push(`${label}: hreflang ${lang} ontbreekt`);
    } else if (decodeEntities(found[2]) !== wanted) {
      errors.push(`${label}: hreflang ${lang} is ${decodeEntities(found[2])}, verwacht ${wanted}`);
    }
  }

  // e) axe-core: nul bevindingen (vereist een pagina uit een eigen context)
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'load' });
    // Lazy afbeeldingen onder de vouw laden pas na scrollen. Eerst alles in
    // beeld brengen en op load of error wachten, anders meldt de keuring een
    // gezonde pagina willekeurig als stuk.
    const brokenImages = await page.evaluate(async () => {
      const images = [...document.images];
      for (const img of images) img.loading = 'eager';
      window.scrollTo(0, document.body.scrollHeight);
      window.scrollTo(0, 0);
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
                setTimeout(resolve, 10000);
              }),
        ),
      );
      return images
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.getAttribute('src') ?? '(geen src)');
    });
    for (const src of brokenImages) {
      errors.push(`${label}: afbeelding laadt niet in de browser (${src})`);
    }

    // Een inkom-animatie maakt de pagina even doorschijnend. axe keurt wat het
    // op dat moment ziet, dus zonder deze regel meet de keuring willekeurig een
    // moment halverwege zo'n animatie. Op 17-11 sloeg `color-contrast` op de h1
    // van 24 pagina's aan in CI en op 0 pagina's lokaal: dezelfde code, alleen
    // een andere snelheid. De h1 van 42 px zakt tijdens de fade door 3:1 en is
    // daarna gewoon in orde.
    //
    // Het oordeel hoort over de eindstand te gaan. Wat permanent te weinig
    // contrast heeft, valt na deze regel alsnog door.
    await page.evaluate(() => {
      for (const animatie of document.getAnimations()) {
        try {
          animatie.finish();
        } catch {
          // Oneindige animaties kun je niet afmaken; terug naar de ruststand.
          animatie.cancel();
        }
      }
    });

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    for (const violation of axe.violations) {
      const targets = violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(' | ');
      errors.push(
        `${label}: axe ${violation.id} (${violation.impact}) — ${violation.nodes.length}x ${targets}`,
      );
    }
  } finally {
    await page.close();
    await context.close();
  }

  return errors;
}

export async function runChecks({ distDir, slugs, locales = LOCALES }) {
  const server = await startStaticServer(distDir);
  const browser = await openBrowser();
  const errors = [];
  let checked = 0;

  try {
    for (const slug of slugs) {
      for (const locale of locales) {
        const pageErrors = await checkPage({
          browser,
          baseUrl: server.baseUrl,
          distDir,
          locale,
          slug,
        });
        errors.push(...pageErrors);
        checked += 1;
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  return { errors, checked };
}

/**
 * Keurt de tien pagina's zonder eigen inhoud, maar met een andere meetlat dan de
 * echte pagina's. Een lege pagina die de paginakeuring haalt is immers precies de
 * verkeerde uitkomst. Wat hier moet kloppen:
 *
 *   1. de route bestaat, met precies één h1 (geen kapotte of half gevulde pagina);
 *   2. hij draagt noindex, zodat een zoekmachine hem laat vallen;
 *   3. geen enkele gebouwde pagina linkt ernaartoe (menu, footer, body, sitemap);
 *   4. hij staat niet in de sitemap.
 *
 * Punt 3 is de belangrijkste: dat bewijst dat de navigatie de concepten echt
 * verbergt en niet alleen dat het bestand toevallig bestaat.
 */
export async function checkConcepten({ distDir, slugs = CONCEPT_SLUGS, locales = LOCALES }) {
  const errors = [];

  // 4. De sitemap hoort geen concept te noemen. De sitemap is XML en geen .html,
  //    dus die lezen we apart: <loc>-regels, niet een losse substring, want
  //    "bagislar" zit ook in "bagis-onayi" als je slordig zoekt.
  for (const naam of (await readdir(distDir)).filter((n) => /^sitemap.*\.xml$/.test(n))) {
    const xml = await readFile(join(distDir, naam), 'utf8');
    for (const [, url] of xml.matchAll(/<loc>([^<]*)<\/loc>/g)) {
      const pad = url.replace(/^https?:\/\/[^/]+/i, '/');
      for (const slug of slugs) {
        for (const locale of locales) {
          const route = pagePath(locale, slug);
          if (pad === route || pad === route.slice(0, -1)) {
            errors.push(`sitemap ${naam}: noemt het concept ${url}`);
          }
        }
      }
    }
  }

  // 3. Geen enkele pagina mag naar een concept linken. Alleen <body> telt: in
  //    <head> staat de canonical van de pagina zelf, en een concept verwijst
  //    eerlijk naar zichzelf. Lichaamlinks zijn de navigatie die een bezoeker
  //    echt kan volgen, en dat is wat hier bewezen moet worden.
  const bestanden = (await walkHtml(distDir)).filter((file) => !file.endsWith(`${sep}404.html`));
  for (const file of bestanden) {
    const html = await readFile(file, 'utf8');
    const bodyStart = html.search(/<body\b/i);
    const body = bodyStart === -1 ? html : html.slice(bodyStart);
    // Herontwerp (18 nov 2026, CONTRACT 7.2): het menu toont altijd alle punten, ook
    // een pagina die uit staat. Zo'n menulink is eerlijk gemerkt met
    // aria-describedby="binnenkort-<slug>" en mag; elke andere link naar een concept
    // blijft een fout.
    for (const match of body.matchAll(/<[^>]*\bhref\s*=\s*"([^"]*)"[^>]*>/gi)) {
      if (/aria-describedby="binnenkort-/.test(match[0])) continue;
      const href = match[1];
      const pad = href.replace(/^https?:\/\/uccib\.com/i, '').split(/[?#]/)[0];
      for (const slug of slugs) {
        for (const locale of locales) {
          const route = pagePath(locale, slug);
          if (pad === route || pad === route.slice(0, -1)) {
            errors.push(`${relative(distDir, file)}: linkt naar het concept ${href}`);
          }
        }
      }
    }
  }

  // 1 en 2. De route bestaat, heeft één h1, draagt noindex en hangt niet aan de
  //    hreflang-wissels van de echte pagina's.
  for (const slug of slugs) {
    for (const locale of locales) {
      const route = pagePath(locale, slug);
      const label = `concept ${locale} ${route}`;
      const file = distFileFor(distDir, route);
      let html;
      try {
        html = await readFile(file, 'utf8');
      } catch {
        errors.push(`${label}: route ontbreekt (${file})`);
        continue;
      }
      const h1Count = (html.match(/<h1\b/gi) ?? []).length;
      if (h1Count !== 1) {
        errors.push(`${label}: verwacht precies één <h1>, gevonden ${h1Count}`);
      }
      if (!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) {
        errors.push(`${label}: mist <meta name="robots" content="noindex">`);
      }
      if (/rel="alternate"\s+hreflang=/i.test(html)) {
        errors.push(`${label}: heeft hreflang-wissels, die horen bij echte pagina's`);
      }
    }
  }

  return { errors, checked: slugs.length * locales.length };
}

/** Alle .html-bestanden onder dist/, recursief en gesorteerd. */
async function walkHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkHtml(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out.sort();
}
