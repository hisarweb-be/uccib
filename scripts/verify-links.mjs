#!/usr/bin/env node
/**
 * Lossen alle interne links in dist/ op, ook vanaf pagina's die geen slug zijn
 * (bijvoorbeeld /sitemap-index.xml). Dit dekt de linkcontrole die CI vraagt en
 * vangt verweesde bestanden die de paginakeuring niet ziet.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const DIST = join(process.cwd(), 'dist');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

function targetFile(pathname) {
  const clean = decodeURIComponent(pathname.split('#')[0].split('?')[0]);
  if (clean.endsWith('/')) return join(DIST, clean, 'index.html');
  if (extname(clean)) return join(DIST, clean);
  return join(DIST, clean, 'index.html');
}

const files = (await walk(DIST)).filter((file) => extname(file) === '.html');
const errors = [];
let links = 0;
let assets = 0;

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const page = relative(DIST, file).split(sep).join('/');

  for (const tag of html.match(/<(?:a|img|link|script)\b[^>]*>/gi) ?? []) {
    const match =
      tag.match(/\s(?:href|src)\s*=\s*"([^"]*)"/i) ?? tag.match(/\s(?:href|src)\s*=\s*'([^']*)'/i);
    if (!match) continue;
    const raw = match[1].replace(/&amp;/g, '&');
    if (/^(mailto:|tel:|data:|#)/i.test(raw)) continue;
    if (/^https?:/i.test(raw)) {
      if (!raw.startsWith('https://uccib.com')) continue;
      const path = new URL(raw).pathname;
      links += 1;
      if (!(await exists(targetFile(path)))) {
        errors.push(`${page}: externe eigen link wijst naar niets (${raw})`);
      }
      continue;
    }
    links += 1;
    if (tag.toLowerCase().startsWith('<img') || tag.toLowerCase().startsWith('<script')) assets += 1;
    if (!(await exists(targetFile(raw)))) {
      errors.push(`${page}: link wijst naar niets (${raw})`);
    }
  }
}

if (errors.length > 0) {
  for (const line of errors) console.error(line);
  console.error(`\n${errors.length} gebroken link(s) op ${files.length} pagina's.`);
  process.exit(1);
}

console.log(
  `OK ${links} interne verwijzingen (waarvan ${assets} bronnen) op ${files.length} pagina's, nul gebroken.`,
);
