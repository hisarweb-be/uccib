/**
 * Eén regel voor de hele site: een concept mag nergens gelinkt worden.
 *
 * `src/data/site.ts` is de enige schakelaar. Zolang een zustersessie een slug
 * nog vult, staat die in `CONCEPT_SLUGS` en keurt `scripts/verify-alle.mjs` een
 * link ernaar af. In plaats van zulke links uit de content te slopen, laat de
 * renderer het anker weg: de tekst blijft staan, en zodra de slug actief wordt
 * komt de link vanzelf terug zonder dat iemand de content aanpast.
 */
import { SLUGS, isActiveSlug, type Slug } from '../data/site';

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
