/**
 * Eén regel voor de hele site: een concept mag nergens gelinkt worden.
 *
 * De schakelaar is de front-matter van het Turkse Markdown-bestand
 * (`active: false`), zie `src/lib/actief.ts`. Zolang een pagina uit staat, keurt
 * `scripts/verify-alle.mjs` een link ernaar af. In plaats van zulke links uit de content te slopen, laat de
 * renderer het anker weg: de tekst blijft staan, en zodra de slug actief wordt
 * komt de link vanzelf terug zonder dat iemand de content aanpast.
 */
import { SLUGS, type Slug } from '../data/site';
import { isActiveSlug } from './actief';

export function isConceptHref(href: string | undefined): boolean {
  if (!href || !href.startsWith('/')) return false;
  const pad = href.split('#')[0] ?? '';
  const delen = pad.split('/').filter(Boolean);
  const eerste = delen[0];
  if (eerste === undefined) return false;
  const rest = eerste === 'nl' || eerste === 'fr' ? delen.slice(1) : delen;
  const slug = rest[0] ?? '';
  if (!(SLUGS as readonly string[]).includes(slug)) return false;
  return !isActiveSlug(slug as Slug);
}
