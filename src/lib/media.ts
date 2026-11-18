/**
 * Media van de startpagina (CONTRACT 3). Alleen bouwtijd: dit bestand leest het
 * manifest en geeft getypte gegevens per shot en breekpunt. Er zit hier geen
 * client-code voor films in; die komt in PR3, samen met `uccib:film-klaar`.
 *
 * Bron: `src/data/media-manifest.json` (schrijft alleen F2a). Zolang dat er niet
 * is, of als er één shot in ontbreekt, komt dat shot uit de plaatshouder van F2b
 * (`media-manifest.plaatshouder.json`, zelfde schema, `status: "terugval"`).
 * Zo valt het echte manifest erin zonder codewijziging.
 */
import plaatshouder from '../data/media-manifest.plaatshouder.json';
import type { Locale } from '../i18n';

export type ShotNaam = 'h1' | 'p1' | 'p2' | 'p3' | 'p4' | 'r1' | 'r2';
export type Breekpunt = 'd' | 'm';
export type Talen<T> = Record<Locale, T>;

export interface Rechthoek {
  x: number;
  y: number;
  breedte: number;
  hoogte: number;
}

export interface Beeldbestand {
  pad: string;
  breedte: number;
  hoogte: number;
  gewicht: number;
}

export interface Poster extends Beeldbestand {
  avif: string | null;
}

export interface Film extends Beeldbestand {
  fps: number;
  frames: number;
  duur: number;
}

export interface Reeks {
  map: string;
  patroon: string;
  aantal: number;
  breedte: number;
  hoogte: number;
  fps: number;
  duur: number;
  gewicht: number;
}

export interface Bestanden {
  film: Film | null;
  reeks: Reeks | null;
  poster: Poster;
  frame0: Beeldbestand | null;
  eind: Beeldbestand | null;
}

export interface Shot {
  shot: ShotNaam;
  sectie: 'hero-unie' | 'piek-ruimtes';
  rol: 'scrub' | 'lus';
  vorm: 'video' | 'frames';
  bron: string;
  bewerkt: boolean;
  retouche: string[];
  aiFilm: boolean;
  model: string | null;
  startUitsnede: Rechthoek;
  uitsnede: { d: string; m: { x: number; breedte: number } };
  anker: Record<Breekpunt, string>;
  ankers: Record<Breekpunt, Array<{ x: number; y: number }>>;
  bestanden: Record<Breekpunt, Bestanden>;
  fase: { van: number; tot: number; variabele: '--hero-p' | '--piek-p' };
  vermelding: Talen<string> | null;
  alt: Talen<string>;
  status: 'geleverd' | 'vervallen' | 'terugval';
}

export interface Manifest {
  versie: number;
  shots: Shot[];
}

/** Het echte manifest, als F2a het al geleverd heeft. Een glob vindt ook niets zonder fout. */
const gevonden = import.meta.glob<{ default: Manifest }>('../data/media-manifest.json', { eager: true });
const echt: Manifest | undefined = Object.values(gevonden)[0]?.default;
const terugval = plaatshouder as Manifest;

const perShot = new Map<ShotNaam, Shot>();
for (const s of terugval.shots) perShot.set(s.shot, s);
for (const s of echt?.shots ?? []) perShot.set(s.shot, s);

/** True als er een echt manifest van F2a is (ook als enkele shots uit de plaatshouder komen). */
export const heeftEchtManifest = echt !== undefined;

/** Eén shot; per ontbrekend shot in het echte manifest de plaatshouder. */
export function shot(naam: ShotNaam): Shot {
  const s = perShot.get(naam);
  if (!s) throw new Error(`media: shot ${naam} staat in geen enkel manifest`);
  return s;
}

/** De shots van één sectie, in de volgorde van het manifest. */
export function shotsVan(sectie: Shot['sectie']): Shot[] {
  return [...perShot.values()].filter((s) => s.sectie === sectie);
}

export const poster = (naam: ShotNaam, bp: Breekpunt): Poster => shot(naam).bestanden[bp].poster;

/** Alleen een film als het shot geleverd is; een vervallen shot of de plaatshouder geeft null. */
export const film = (naam: ShotNaam, bp: Breekpunt): Film | null =>
  shot(naam).status === 'geleverd' ? shot(naam).bestanden[bp].film : null;

export const reeks = (naam: ShotNaam, bp: Breekpunt): Reeks | null =>
  shot(naam).status === 'geleverd' ? shot(naam).bestanden[bp].reeks : null;

/** `object-position` per breekpunt. */
export const anker = (naam: ShotNaam, bp: Breekpunt): string => shot(naam).anker[bp];

export const alt = (naam: ShotNaam, locale: Locale): string => shot(naam).alt[locale];

/** De AI-vermelding van één shot, of null als het shot geen AI-film is. */
export const vermelding = (naam: ShotNaam, locale: Locale): string | null =>
  shot(naam).aiFilm ? (shot(naam).vermelding?.[locale] ?? null) : null;

/** De vermelding voor de voet: is er op de pagina één AI-film, dan één regel. */
export function vermeldingPagina(locale: Locale): string | null {
  for (const s of perShot.values()) {
    const v = vermelding(s.shot, locale);
    if (v) return v;
  }
  return null;
}
