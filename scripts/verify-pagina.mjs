#!/usr/bin/env node
/**
 * Keurt één pagina: node scripts/verify-pagina.mjs <slug> [taal]
 * Zonder slug keurt hij de hoofdpagina. Zonder taal alle drie de talen.
 * Leest de gebouwde pagina uit dist/, dus eerst `npm run build`.
 * Elke fout is één leesbare regel; exitcode 1 bij elke fout, 0 als alles groen is.
 */
import { resolve } from 'node:path';
import { runChecks, LOCALES, SLUGS } from './lib/keuring.mjs';

const distDir = resolve('dist');
const [rawSlug = '', rawLocale] = process.argv.slice(2);

if (rawLocale && !LOCALES.includes(rawLocale)) {
  console.error(`Onbekende taal "${rawLocale}". Kies uit: ${LOCALES.join(', ')}`);
  process.exit(1);
}

if (rawSlug !== '' && !SLUGS.includes(rawSlug)) {
  console.error(`Onbekende slug "${rawSlug}".`);
  console.error(`Bekende slugs: ${SLUGS.filter(Boolean).join(', ')}`);
  process.exit(1);
}

const locales = rawLocale ? [rawLocale] : LOCALES;
const { errors, checked } = await runChecks({ distDir, slugs: [rawSlug], locales });

if (errors.length > 0) {
  for (const line of errors) console.error(line);
  console.error(`\n${errors.length} fout(en) op ${checked} pagina('s).`);
  process.exit(1);
}

console.log(`OK ${checked} pagina('s): slug "${rawSlug || '/'}" in ${locales.join(', ')}.`);
