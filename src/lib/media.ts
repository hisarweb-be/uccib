/**
 * Media van de startpagina (CONTRACT 3). Alleen bouwtijd: dit bestand leest het
 * manifest en geeft getypte gegevens per shot en breekpunt. Er zit hier geen
 * client-code voor films in; die komt in PR3, samen met `uccib:film-klaar`.
 *
 * Bron: `src/data/media-manifest.json` (schrijft alleen F2a). Zolang dat er niet
 * is, of als er één shot in ontbreekt, komt dat shot uit de plaatshouder van F2b
 * (`media-manifest.plaatshouder.json`, zelfde schema, `status: "terugval"`).
 * Het veld `status` beslist nergens iets: zie `vormVan`.
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
  /** Dezelfde film als webm (vp9), optioneel; de browser kiest de eerste die hij speelt. */
  webm?: string;
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
  /** Administratie (bijsturing 19 nov, B3): nooit getoond; de openheid staat op de disclaimerpagina. */
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

/**
 * Doet dit shot mee op de pagina?
 *
 * Zonder echt manifest doet alles uit de plaatshouder mee. Met een echt manifest
 * doet elk shot mee dat erin staat, wat zijn `status` ook is: "vervallen" zegt
 * dat de FILM vervallen is, niet het shot (BIJSTURING ronde 2d). Een shot valt
 * alleen weg als het manifest de sectie van dat shot wel levert maar dit shot
 * niet (zonder film `p3` komt er geen `p4`). Levert het manifest van een sectie
 * nog niets, dan komt die hele sectie uit de plaatshouder.
 */
export function aanwezig(naam: ShotNaam): boolean {
  const s = perShot.get(naam);
  if (!s) return false;
  if (!echt) return true;
  if (echt.shots.some((e) => e.shot === naam)) return true;
  return !echt.shots.some((e) => e.sectie === s.sectie);
}

/** Wat er van één shot te zien is. */
export type Vorm = 'film' | 'poster' | 'weg';

/**
 * De ene regel die de vorm van een shot bepaalt (BIJSTURING ronde 2d punt 2).
 * Ze kijkt alleen naar wat er ligt, nooit naar het veld `status`:
 * - het shot ontbreekt: `weg`, zijn deel valt uit de scrollweg;
 * - er ligt een film of een frame-reeks (op een van de breekpunten): `film`,
 *   de scrub;
 * - er ligt alleen een poster: `poster`, de echte foto met beweging en licht in
 *   code.
 */
export function vormVan(naam: ShotNaam): Vorm {
  if (!aanwezig(naam)) return 'weg';
  const { d, m } = shot(naam).bestanden;
  return d.film || m.film || d.reeks || m.reeks ? 'film' : 'poster';
}

/** De shots van één sectie, in de volgorde van het manifest. */
export function shotsVan(sectie: Shot['sectie']): Shot[] {
  return [...perShot.values()].filter((s) => s.sectie === sectie);
}

export const poster = (naam: ShotNaam, bp: Breekpunt): Poster => shot(naam).bestanden[bp].poster;

/** De film van een shot als die er ligt; de status telt niet mee (zie `vormVan`). */
export const film = (naam: ShotNaam, bp: Breekpunt): Film | null => shot(naam).bestanden[bp].film;

export const reeks = (naam: ShotNaam, bp: Breekpunt): Reeks | null => shot(naam).bestanden[bp].reeks;

/** `object-position` per breekpunt. */
export const anker = (naam: ShotNaam, bp: Breekpunt): string => shot(naam).anker[bp];

export const alt = (naam: ShotNaam, locale: Locale): string => shot(naam).alt[locale];

/**
 * Hoeveel eigen pixels de breedte van een shot heeft (BIJSTURING ronde 2g punt 2).
 * Een poster die uit een kleinere uitsnede is opgeschaald, heeft maar zoveel
 * pixels als die uitsnede (desktop: `startUitsnede`). Een film telt met zijn eigen
 * breedte. Het script toont een beeld nooit groter dan 110 % hiervan: wat te klein
 * is voor het hele scherm, komt in het venster van de rozet.
 */
export function eigenBreedte(naam: ShotNaam, bp: Breekpunt): number {
  const s = shot(naam);
  const b = s.bestanden[bp];
  if (b.film) return b.film.breedte;
  const uit = bp === 'd' ? s.startUitsnede?.breedte : undefined;
  return uit && uit > 0 ? Math.min(b.poster.breedte, uit) : b.poster.breedte;
}
