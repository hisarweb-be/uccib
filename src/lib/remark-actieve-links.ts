/**
 * De twee bewerkingen die elke pagina ondergaat vlak voordat hij HTML wordt.
 *
 * 1. Een verwijzing naar een pagina die uit staat, verdwijnt. In een lopende
 *    zin blijft de tekst staan en verliest alleen het anker zijn functie; staat
 *    de link alleen in een alinea (zoals de knoppen 'Gebedstijden' en 'Onze
 *    afdelingen' op de startpagina), dan valt de hele alinea weg. Een uitgezette
 *    pagina hoort nergens zichtbaar te zijn, en een knop zonder doel is dat wel.
 *    De keuring eist dat zo'n pagina ook nergens gelinkt wordt. Zet dhr. Omer de
 *    pagina in de CMS aan, dan komt de knop vanzelf terug zonder dat iemand de
 *    tekst aanpast.
 *
 * 2. Een interne link krijgt het taarvoorvoegsel van de pagina waarin hij staat.
 *    In de Markdown schrijft Omer `[Over ons](/hakkimizda)`, en dat is op
 *    `/nl/` en `/fr/` een link naar de Turkse pagina. Hier wordt er
 *    `/nl/hakkimizda` van. Dat is de enige plek waar de taal van het bestand
 *    bekend is: in de tekst zelf staat hij niet.
 *
 * Waarom hier en niet in de component: Astro geeft de gerenderde HTML van
 * `<Content />` kant-en-klaar terug, dus dit is het laatste moment waarop de
 * tekst nog als boom te bewerken is.
 */
import type { Root, RootContent, Link } from 'mdast';
import type { VFile } from 'vfile';

import { SLUGS, type Slug } from '../data/site';
import { isActiveSlug } from './actief';

/** De talen met een eigen voorvoegsel; Turks staat op de root. */
const MET_VOORVOEGSEL = new Set(['nl', 'fr']);

/** De taal waarin dit bestand staat, afgeleid uit het pad van het bestand. */
function taalVan(file: VFile): string {
  const pad = String(file.path ?? '').replace(/\\/g, '/');
  const inCollectie = /\/paginas\/(tr|nl|fr)\//.exec(pad);
  if (inCollectie?.[1]) return inCollectie[1];
  const alsId = /^(?:paginas\/)?(tr|nl|fr)\//.exec(pad);
  if (alsId?.[1]) return alsId[1];
  // Fail-closed: zonder taal kan een link niet goed gezet worden, en een halve
  // site is erger dan een bouw die stopt.
  throw new Error(
    `Kan de taal van dit contentbestand niet bepalen (pad: ${pad || 'leeg'}). ` +
      'Verwacht een pad als src/content/paginas/nl/index.md.',
  );
}

/**
 * Het pad van een interne link, gesplitst in pad en staart (`?query` of `#anker`).
 * Geeft `null` voor alles wat geen pagina op deze site is.
 */
function interneLink(href: string): { pad: string; staart: string } | null {
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  const scheiding = href.search(/[?#]/);
  const pad = scheiding === -1 ? href : href.slice(0, scheiding);
  const staart = scheiding === -1 ? '' : href.slice(scheiding);
  return { pad, staart };
}

/** De slug waar een pad op uitkomt, of `null` als het geen pagina is. */
function slugVan(pad: string): Slug | null {
  const delen = pad.split('/').filter(Boolean);
  const eerste = delen[0];
  if (eerste === undefined) return null;
  const rest = MET_VOORVOEGSEL.has(eerste) ? delen.slice(1) : delen;
  const slug = rest[0] ?? '';
  if (slug !== '' && !(SLUGS as readonly string[]).includes(slug)) return null;
  return slug as Slug;
}

/** De link in een alinea die uit niets anders bestaat, of `null`. */
function enigeLinkIn(alinea: RootContent): Link | null {
  if (alinea.type !== 'paragraph') return null;
  const inhoud = alinea.children.filter(
    (kind) => !(kind.type === 'text' && kind.value.trim() === ''),
  );
  return inhoud.length === 1 && inhoud[0]?.type === 'link' ? (inhoud[0] as Link) : null;
}

function bewerk(kinderen: RootContent[], taal: string): void {
  for (let i = 0; i < kinderen.length; i += 1) {
    const kind = kinderen[i];
    if (!kind) continue;

    // Een alinea die alleen uit een link naar een uitgezette pagina bestaat,
    // valt in zijn geheel weg: dat is een knop naar niets.
    const losseLink = enigeLinkIn(kind);
    if (losseLink) {
      const doel = interneLink(losseLink.url);
      const slug = doel ? slugVan(doel.pad) : null;
      if (slug !== null && !isActiveSlug(slug)) {
        kinderen.splice(i, 1);
        i -= 1;
        continue;
      }
    }

    if (kind.type === 'link') {
      const link = kind as Link;
      const doel = interneLink(link.url);
      const slug = doel ? slugVan(doel.pad) : null;

      if (doel && slug !== null && !isActiveSlug(slug)) {
        // Uit de link halen, tekst laten staan.
        kinderen.splice(i, 1, ...link.children);
        i += link.children.length - 1;
        continue;
      }

      if (doel && slug !== null && MET_VOORVOEGSEL.has(taal)) {
        const alGoed = doel.pad === `/${taal}` || doel.pad.startsWith(`/${taal}/`);
        const nieuwePad = doel.pad === '/' ? `/${taal}/` : `/${taal}${doel.pad}`;
        link.url = (alGoed ? doel.pad : nieuwePad) + doel.staart;
      }
    }

    if ('children' in kind && Array.isArray(kind.children)) {
      bewerk(kind.children as RootContent[], taal);
    }
  }
}

export default function remarkActieveLinks() {
  return (boom: Root, file: VFile): void => {
    bewerk(boom.children, taalVan(file));
  };
}
