#!/usr/bin/env node
/**
 * Tekentoets (DESIGNSYSTEEM 2.4): elk zichtbaar teken uit de i18n- en
 * inhoudsbronnen moet in de unicode-range van de eigen lettersubset zitten,
 * anders valt het terug op Georgia of Arial.
 *
 * De reeks wordt gelezen uit de eerste `unicode-range` in src/styles/tokens.css,
 * zodat toets en @font-face nooit uit elkaar lopen.
 *
 * Bronnen: src/i18n (json en ts), src/data (ts), src/content (md: voorwerk en
 * tekst). Uit .ts-bestanden tellen alleen stringliteralen, geen commentaar.
 *
 * Het lange kastlijntje U+2014 zit wel in de subset (zodat niets terugvalt),
 * maar hoort niet in zichtbare tekst: de toets meldt elke plek als waarschuwing.
 *
 * Uitgang 1 bij een teken buiten de reeks, anders 0.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const css = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8');
const m = css.match(/unicode-range:\s*([^;]+);/);
if (!m) {
  console.error('verify:tekens: geen unicode-range gevonden in src/styles/tokens.css');
  process.exit(1);
}

/** @type {Array<[number, number]>} */
const ranges = m[1].split(',').map((part) => {
  const [a, b] = part.trim().replace(/^U\+/i, '').split('-');
  const lo = parseInt(a, 16);
  return [lo, b ? parseInt(b, 16) : lo];
});
const inRange = (cp) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function jsonStrings(value, acc = []) {
  if (typeof value === 'string') acc.push(value);
  else if (Array.isArray(value)) value.forEach((v) => jsonStrings(v, acc));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => jsonStrings(v, acc));
  return acc;
}

/** Stringliteralen uit TypeScript, zonder commentaar. */
function tsStrings(src) {
  const acc = [];
  const re = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g;
  for (const [tok] of src.matchAll(re)) {
    if (tok.startsWith('/')) continue;
    acc.push(tok.slice(1, -1));
  }
  return acc;
}

const files = [
  ...walk(join(ROOT, 'src/i18n')),
  ...walk(join(ROOT, 'src/data')),
  ...walk(join(ROOT, 'src/content')),
].filter((f) => ['.json', '.ts', '.md'].includes(extname(f)));

/** @type {Map<string, string[]>} teken -> plekken */
const buiten = new Map();
const kastlijn = [];

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const ext = extname(file);
  const texts = ext === '.json' ? jsonStrings(JSON.parse(raw)) : ext === '.ts' ? tsStrings(raw) : [raw];
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  for (const text of texts) {
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (cp === 0x0a || cp === 0x0d || cp === 0x09) continue;
      if (cp === 0x2014 && !kastlijn.includes(rel)) kastlijn.push(rel);
      if (inRange(cp)) continue;
      const key = `U+${cp.toString(16).toUpperCase().padStart(4, '0')} ${JSON.stringify(ch)}`;
      const list = buiten.get(key) ?? [];
      if (!list.includes(rel)) list.push(rel);
      buiten.set(key, list);
    }
  }
}

console.log(`verify:tekens: ${files.length} bronbestanden, ${ranges.length} reeksen in de unicode-range`);
if (kastlijn.length) {
  console.log(`LET OP: lang kastlijntje U+2014 in zichtbare tekst (zit in de subset, herschrijven later): ${kastlijn.join(', ')}`);
}
if (buiten.size) {
  for (const [key, list] of buiten) console.log(`FOUT: ${key} buiten de reeks in ${list.join(', ')}`);
  console.log(`verify:tekens: ${buiten.size} teken(s) buiten de reeks`);
  process.exit(1);
}
console.log('verify:tekens: 0 tekens buiten de reeks');
