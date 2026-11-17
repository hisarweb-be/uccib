/**
 * De aan/uit-schakelaar van elke pagina.
 *
 * De bron is de front-matter van het Turkse Markdown-bestand:
 *
 *     ---
 *     title: Şubelerimiz
 *     active: false      <- deze pagina staat niet op de site
 *     ---
 *
 * Turks, en niet alle drie de talen, omdat één pagina één schakelaar hoort te
 * hebben. Zet dhr. Omer `Şubelerimiz` op actief, dan verschijnen `/subelerimiz/`,
 * `/nl/subelerimiz/` en `/fr/subelerimiz/` samen. Andersom zou een half gevulde
 * pagina in het Turks zichtbaar zijn en in het Nederlands niet, en dat is precies
 * de verwarring die je niet wil.
 *
 * Wat "uit" betekent: de route blijft bestaan (een oude link of QR-code mag geen
 * 404 geven), maar de pagina krijgt `noindex`, staat niet in de sitemap, staat
 * niet in de menubalk of de voettekst, en geen enkele link wijst ernaartoe. Dat
 * is wat `checkConcepten` in `scripts/lib/keuring.mjs` afdwingt.
 *
 * Waarom geen YAML-parser: er is één sleutel nodig, uit een bestand dat deze repo
 * zelf schrijft. Een regex op `active: false` is genoeg en scheelt een dependency.
 * Ontbreekt de sleutel, dan is de pagina actief; dat is ook de standaard in
 * `content.config.ts` en in `public/admin/config.yml`.
 *
 * Let op: dit bestand wordt ook door Node gelezen (`astro.config.mjs` en
 * `scripts/lib/keuring.mjs`), dus het mag geen runtime-import van een ander
 * `.ts`-bestand hebben. Alleen `import type`, want dat verdwijnt bij het
 * compileren.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Slug } from '../data/site';

/** De taal die de schakelaar draagt. */
const SCHAKELAAR_TAAL = 'tr';

/** Alles tussen de eerste twee `---`-regels. */
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

let geheugen: readonly Slug[] | null = null;

/**
 * De slugs die nu uitstaan. Wordt één keer per proces gelezen en daarna
 * onthouden: tijdens een bouw verandert er geen bestand.
 */
export function conceptSlugs(): readonly Slug[] {
  if (geheugen) return geheugen;

  const map = join(process.cwd(), 'src', 'content', 'paginas', SCHAKELAAR_TAAL);
  const slugs: Slug[] = [];
  let namen: string[];
  try {
    namen = readdirSync(map);
  } catch {
    // Fail-closed: zonder deze map is er geen schakelaar, en dan liever een
    // bouw die stopt dan een site die stilzwijgend alles toont.
    throw new Error(
      'Kan de paginaschakelaar niet lezen: ' + map + ' ontbreekt. ' +
        'Draai de bouw vanuit de map van de repo.',
    );
  }

  for (const naam of namen.sort()) {
    if (!naam.endsWith('.md')) continue;
    const tekst = readFileSync(join(map, naam), 'utf8');
    const front = FRONT_MATTER.exec(tekst)?.[1] ?? '';
    if (!/^active:\s*false\s*$/m.test(front)) continue;
    slugs.push((naam === 'index.md' ? '' : naam.slice(0, -'.md'.length)) as Slug);
  }

  geheugen = slugs;
  return slugs;
}

/**
 * Staat deze pagina op de site? Voor de startpagina is het antwoord altijd ja:
 * een site zonder voorpagina is geen site.
 */
export function isActiveSlug(slug: Slug): boolean {
  if (slug === '') return true;
  return !conceptSlugs().includes(slug);
}
