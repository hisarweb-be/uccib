/**
 * De vorm van alles wat het CMS levert, zoals de site het leest.
 *
 * Deze types staan hier en niet in `sanity/schemaTypes/`: de site mag niet
 * afhangen van het Studio-pakket. Wat hier staat is de afspraak tussen F2
 * (het CMS) en F3 (de pagina's): de negen leesfuncties in `sanity.ts` geven
 * precies dit terug, of ze nu uit Sanity komen of uit de offline kopie.
 */

import type { Slug } from '../data/site';

/** Eén stuk tekst in een Portable Text-blok. */
export interface Span {
  _type: 'span';
  _key: string;
  text: string;
  marks: string[];
}

/** Een link onder een stuk tekst (de annotatie uit `bodyVeld`). */
export interface LinkMark {
  _type: 'link';
  _key: string;
  href: string;
}

/** Een tekstblok: alinea, kop, citaat of lijstitem. */
export interface Block {
  _type: 'block';
  _key: string;
  /** `normal` | `h2` | `h3` | `blockquote` */
  style: string;
  /** `bullet` of `number`, alleen bij lijstitems. */
  listItem?: string;
  level?: number;
  markDefs: LinkMark[];
  children: Span[];
}

/** Een afbeelding in de body. `asset._ref` is een Sanity-referentie. */
export interface BodyImage {
  _type: 'image';
  _key: string;
  asset: { _ref: string };
  alt: string;
  onderschrift?: string;
}

export type BodyBlock = Block | BodyImage;

export interface Seo {
  titel?: string | null;
  beschrijving?: string | null;
  ogBeeld?: unknown;
}

export interface Pagina {
  _id: string;
  titel: string;
  h1: string;
  intro?: string | null;
  slug: Slug;
  taal: string;
  vertaalgroep?: string | null;
  volgorde?: number | null;
  body: BodyBlock[];
  seo?: Seo | null;
}

export interface Nieuwsbericht {
  _id: string;
  titel: string;
  datum: string;
  slug: string;
  samenvatting?: string | null;
  categorie?: string | null;
  auteur?: string | null;
  omslagbeeld?: { asset?: { _ref?: string }; alt?: string } | null;
  body: BodyBlock[];
}

export interface Adres {
  straat?: string;
  postcode?: string;
  gemeente?: string;
  land?: string;
}

export interface Afdeling {
  _id: string;
  naam: string;
  slug: string;
  omschrijving?: string | null;
  foto?: { asset?: { _ref?: string }; alt?: string } | null;
  adres?: Adres | null;
  telefoon?: string | null;
  email?: string | null;
  coordinaat?: { lat: number; lng: number } | null;
  openingstijden?: unknown;
  volgorde?: number | null;
}

export interface Regio {
  _id: string;
  naam: string;
  slug: string;
  omschrijving?: string | null;
  afdelingen: Afdeling[];
  volgorde?: number | null;
}

export interface Gebedstijd {
  _id: string;
  datum: string;
  plaats: string;
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
  methode?: string | null;
  bron?: string | null;
}

export interface Preek {
  _id: string;
  titel: string;
  datum: string;
  slug: string;
  taal: string;
  body: BodyBlock[];
  pdf?: { asset?: { _ref?: string } } | null;
}

export interface Sponsorblok {
  _id: string;
  bedrag: number | null;
  label: string;
  link: string;
  volgorde?: number | null;
  actief: boolean;
}

export interface Instellingen {
  _id: string;
  sitenaam: string;
  volledigeNaam?: string | null;
  slagzin?: string | null;
  logo?: { asset?: { _ref?: string }; alt?: string } | null;
  adres?: Adres | null;
  telefoon?: string | null;
  email?: string | null;
  btw?: string | null;
  socials?: { kanaal: string; url: string }[];
  noodtekst?: {
    aan: boolean;
    tekst?: string | null;
    tekstNl?: string | null;
    tekstFr?: string | null;
    link?: string | null;
  } | null;
}
