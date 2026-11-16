/**
 * Gedeelde keuringslogica voor verify-pagina.mjs, verify-alle.mjs en verify-links.mjs.
 * Houdt de controles op één plek, zodat één pagina en alle pagina's precies
 * hetzelfde meten.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

export const SLUGS = [
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
export async function startStaticServer(root) {
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

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
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
