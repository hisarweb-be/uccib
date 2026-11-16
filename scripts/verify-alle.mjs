#!/usr/bin/env node
/**
 * Keurt alle veertien slugs in alle drie de talen: npm run verify
 * Levert per fout één leesbare regel en exitcode 1.
 */
import { resolve } from 'node:path';
import { runChecks, SLUGS } from './lib/keuring.mjs';

const distDir = resolve('dist');

const { errors, checked } = await runChecks({ distDir, slugs: SLUGS });

if (errors.length > 0) {
  for (const line of errors) console.error(line);
  console.error(`\n${errors.length} fout(en) op ${checked} pagina's.`);
  process.exit(1);
}

console.log(`OK ${checked} pagina's gekeurd: ${SLUGS.length} slugs x 3 talen, nul fouten.`);
