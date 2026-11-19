/**
 * Hoverwacht (DESIGNSYSTEEM 6.6, keuring F3 PR D punt B): een `:hover`-regel staat
 * alleen binnen `@media (hover: hover)`. Daarbuiten blijft de hoverkleur na een tik
 * op een aanraakscherm hangen.
 *
 * Leest de stijl van elk .astro-bestand onder src/ (de <style>-blokken) en elk
 * .css-bestand onder src/styles. Tailwind-klassen als `hover:bg-ink` vallen buiten
 * deze toets: Tailwind 4 zet die zelf al in `@media (hover: hover)`.
 *
 * OUDER_DAN_F3D: bestanden die al hoverregels buiten de mediaquery hadden vóór
 * PR D (gemeten 19 nov 2026 op origin/herontwerp-wow). Hun eigenaar ruimt ze op;
 * een nieuw bestand mag er niet bij.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

export const OUDER_DAN_F3D = new Set([
  'components/CmsBlokOfNiets.astro',
  'components/Footer.astro',
  'components/Header.astro',
  'components/InAanbouw.astro',
  'components/RozetMenu.astro',
  'components/Sponsor.astro',
  'components/WhatsApp.astro',
  'components/home/AdresBlad.astro',
  'components/home/DienstenIndex.astro',
  'components/home/OpenDeur.astro',
  'components/home/SteunKeuze.astro',
  'styles/home.css',
  'styles/tekst.css',
  'styles/tokens.css',
]);

async function bestanden(dir) {
  const uit = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) uit.push(...(await bestanden(p)));
    else if (/\.(astro|css)$/.test(e.name)) uit.push(p);
  }
  return uit;
}

/** Geeft per regel buiten `@media (hover: hover)` de selector terug. */
export function losseHover(css) {
  const zonderCommentaar = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const stapel = [];
  const los = [];
  let prelude = '';
  for (const teken of zonderCommentaar) {
    if (teken === '{') {
      const kop = prelude.trim();
      stapel.push(kop);
      const binnenHover = stapel.some((k) => /^@media[^{]*\(\s*hover\s*:\s*hover\s*\)/.test(k));
      if (!kop.startsWith('@') && /:hover\b/.test(kop) && !binnenHover) los.push(kop.replace(/\s+/g, ' '));
      prelude = '';
    } else if (teken === '}') {
      stapel.pop();
      prelude = '';
    } else if (teken === ';') {
      prelude = '';
    } else prelude += teken;
  }
  return los;
}

export async function keurHover(srcDir) {
  const fouten = [];
  for (const pad of await bestanden(srcDir)) {
    const rel = relative(srcDir, pad).split(sep).join('/');
    if (OUDER_DAN_F3D.has(rel)) continue;
    const tekst = await readFile(pad, 'utf8');
    const css = pad.endsWith('.css')
      ? tekst
      : [...tekst.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
    for (const sel of losseHover(css)) fouten.push(`src/${rel}: ${sel} staat buiten @media (hover: hover)`);
  }
  return fouten;
}
