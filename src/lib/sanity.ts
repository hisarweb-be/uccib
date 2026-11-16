/**
 * De enige plek waar de site het CMS leest.
 *
 * Twee regels die alles hieronder bepalen:
 *
 * 1. **Nooit throwen.** Een pagina die niet kan laden is erger dan een pagina
 *    met de tekst van gisteren. Elke functie valt bij een fout terug op
 *    `src/data/cms-fallback.json`, de gegenereerde offline kopie.
 * 2. **Nooit lang wachten.** Acht seconden per verzoek, daarna is de fallback
 *    aan de beurt. Een bouw mag niet stilvallen op een traag CMS.
 *
 * Zolang er geen Sanity-project is (`PROJECT_ID_NOG_NIET_AANGEMAAKT`) gaat er
 * helemaal geen verzoek over de lijn: de site bouwt dan volledig uit de
 * fallback. Dat is de stand tot Altuner inlogt; zie `sanity/README.md`.
 *
 * De cache is een gewone `Map` in het modulegeheugen met een levensduur van vijf
 * minuten. Bij een statische bouw betekent dat: één verzoek per query voor de
 * hele bouw, in plaats van één per pagina.
 */
import type { Locale } from '../i18n/config';
import type { Slug } from '../data/site';
import fallback from '../data/cms-fallback.json';
import type {
  Afdeling,
  Gebedstijd,
  Instellingen,
  Nieuwsbericht,
  Pagina,
  Preek,
  Regio,
  Sponsorblok,
} from './sanity-types';

const PLACEHOLDER = 'PROJECT_ID_NOG_NIET_AANGEMAAKT';

function uitOmgeving(naam: string): string | undefined {
  // Astro zet PUBLIC_* in import.meta.env; een CI of Cloudflare kan ook een
  // gewone omgevingsvariabele zetten. Beide tellen, en geen van beide is
  // gegarandeerd aanwezig (in de browser bestaat `process` niet).
  const astroEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const nodeEnv =
    typeof globalThis.process !== 'undefined'
      ? (globalThis.process as unknown as { env?: Record<string, string | undefined> }).env
      : undefined;
  const waarde = astroEnv?.[naam] ?? nodeEnv?.[naam];
  return typeof waarde === 'string' && waarde.trim() !== '' ? waarde.trim() : undefined;
}

export const projectId = uitOmgeving('PUBLIC_SANITY_PROJECT_ID') ?? PLACEHOLDER;
export const dataset = uitOmgeving('PUBLIC_SANITY_DATASET') ?? 'production';

/** True zolang er nog geen echt project is: dan geen netwerk, alleen de fallback. */
export const isPlaceholder = projectId === PLACEHOLDER;

const API_VERSIE = '2024-01-01';
const TIMEOUT_MS = 8_000;
const TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { op: number; waarde: unknown }>();
const gemeld = new Set<string>();

function meldEenKeer(sleutel: string, reden: string): void {
  if (gemeld.has(sleutel)) return;
  gemeld.add(sleutel);
  console.warn(`[cms] ${sleutel}: ${reden}; offline kopie gebruikt.`);
}

async function vraag<T>(sleutel: string, query: string, params: Record<string, unknown>): Promise<T | null> {
  if (isPlaceholder) return null;

  const bewaard = cache.get(sleutel);
  if (bewaard && Date.now() - bewaard.op < TTL_MS) return bewaard.waarde as T;

  const url = new URL(`https://${projectId}.apicdn.sanity.io/v${API_VERSIE}/data/query/${dataset}`);
  url.searchParams.set('query', query);
  for (const [naam, waarde] of Object.entries(params)) {
    url.searchParams.set(`$${naam}`, JSON.stringify(waarde));
  }

  try {
    const antwoord = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (!antwoord.ok) {
      meldEenKeer(sleutel, `CMS antwoordde ${antwoord.status}`);
      return null;
    }
    const json = (await antwoord.json()) as { result?: T };
    const resultaat = json.result ?? null;
    cache.set(sleutel, { op: Date.now(), waarde: resultaat });
    return resultaat;
  } catch (fout) {
    meldEenKeer(sleutel, fout instanceof Error ? fout.message : 'onbekende fout');
    return null;
  }
}

/** De offline kopie, getypeerd. Eén plek, zodat elke leesfunctie hetzelfde doet. */
const offline = fallback as unknown as {
  paginas: Pagina[];
  nieuws: Nieuwsbericht[];
  afdelingen: Afdeling[];
  regios: Regio[];
  gebedstijden: Gebedstijd[];
  preken: Preek[];
  sponsorblokken: Sponsorblok[];
  instellingen: Instellingen;
};

/**
 * Eén pagina in één taal. Onbekende combinatie: de Turkse pagina, want dat is
 * de taal waarin de inhoud bestaat. Bestaat die ook niet, dan `null` en beslist
 * de pagina zelf wat er gebeurt.
 */
export async function getPagina(locale: Locale, slug: Slug): Promise<Pagina | null> {
  const query = `*[_type == "pagina" && slug == $slug && taal == $taal][0]`;
  const vanCms = await vraag<Pagina>(`pagina:${locale}:${slug}`, query, { slug, taal: locale });
  if (vanCms) return vanCms;
  return (
    offline.paginas.find((p) => p.slug === slug && p.taal === locale) ??
    offline.paginas.find((p) => p.slug === slug && p.taal === 'tr') ??
    null
  );
}

/** Alle pagina's van één taal, op volgorde. */
export async function getPaginas(locale: Locale): Promise<Pagina[]> {
  const query = `*[_type == "pagina" && taal == $taal] | order(volgorde asc, titel asc)`;
  const vanCms = await vraag<Pagina[]>(`paginas:${locale}`, query, { taal: locale });
  if (vanCms && vanCms.length > 0) return vanCms;
  return offline.paginas
    .filter((p) => p.taal === locale)
    .sort((a, b) => (a.volgorde ?? 999) - (b.volgorde ?? 999));
}

/** Nieuwsberichten, nieuwste eerst. Leeg is een geldig antwoord. */
export async function getNieuws(locale: Locale): Promise<Nieuwsbericht[]> {
  const query = `*[_type == "nieuwsbericht" && taal == $taal] | order(datum desc)`;
  const vanCms = await vraag<Nieuwsbericht[]>(`nieuws:${locale}`, query, { taal: locale });
  if (vanCms) return vanCms;
  return offline.nieuws.filter((n) => (n as { taal?: string }).taal === locale);
}

/** De aangesloten centra van één taal. */
export async function getAfdelingen(locale: Locale): Promise<Afdeling[]> {
  const query = `*[_type == "afdeling" && taal == $taal] | order(volgorde asc, naam asc)`;
  const vanCms = await vraag<Afdeling[]>(`afdelingen:${locale}`, query, { taal: locale });
  if (vanCms) return vanCms;
  return offline.afdelingen;
}

/** De regio's met hun afdelingen, in de volgorde die de redactie sleep. */
export async function getRegios(locale: Locale): Promise<Regio[]> {
  const query = `*[_type == "regio" && taal == $taal] | order(volgorde asc, naam asc) {
    _id, naam, slug, omschrijving, volgorde,
    afdelingen[]-> { _id, naam, slug, omschrijving, foto, adres, telefoon, email, coordinaat, volgorde }
  }`;
  const vanCms = await vraag<Regio[]>(`regios:${locale}`, query, { taal: locale });
  if (vanCms) return vanCms;
  return offline.regios;
}

/** De gebedstijden vanaf vandaag, per datum. */
export async function getGebedstijden(): Promise<Gebedstijd[]> {
  const vandaag = new Date().toISOString().slice(0, 10);
  const query = `*[_type == "gebedstijd" && datum >= $vandaag] | order(datum asc)`;
  const vanCms = await vraag<Gebedstijd[]>('gebedstijden', query, { vandaag });
  if (vanCms) return vanCms;
  return offline.gebedstijden;
}

/** De preken van één taal, nieuwste eerst. */
export async function getPreken(locale: Locale): Promise<Preek[]> {
  const query = `*[_type == "preek" && taal == $taal] | order(datum desc)`;
  const vanCms = await vraag<Preek[]>(`preken:${locale}`, query, { taal: locale });
  if (vanCms) return vanCms;
  return offline.preken.filter((p) => p.taal === locale);
}

/** De donatiebedragen, alleen de actieve, in leesvolgorde. */
export async function getSponsorblokken(): Promise<Sponsorblok[]> {
  const query = `*[_type == "sponsorblok" && actief == true] | order(volgorde asc)`;
  const vanCms = await vraag<Sponsorblok[]>('sponsorblokken', query, {});
  if (vanCms && vanCms.length > 0) return vanCms;
  return offline.sponsorblokken
    .filter((s) => s.actief)
    .sort((a, b) => (a.volgorde ?? 999) - (b.volgorde ?? 999));
}

/** Adres, telefoon, socials en de noodtekst. Altijd één document. */
export async function getInstellingen(): Promise<Instellingen> {
  const query = `*[_type == "instellingen"][0]`;
  const vanCms = await vraag<Instellingen>('instellingen', query, {});
  return vanCms ?? offline.instellingen;
}

/**
 * Adres van een afbeelding, of die nu uit Sanity komt of uit de offline kopie.
 *
 * Een Sanity-referentie (`image-abc-1200x800-png`) wordt een CDN-adres met de
 * gevraagde breedte. Een pad uit `public/` (de fallback) blijft zoals het is;
 * die bestanden zijn al in de juiste maten klaargezet door F1.
 */
export function beeldUrl(ref: string | undefined, breedte = 960): string | null {
  if (!ref) return null;
  if (ref.startsWith('/')) return ref;
  const match = /^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/.exec(ref);
  if (!match) return null;
  const [, id, w, h, ext] = match;
  const bestand = `${id}-${w}x${h}.${ext}`;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${bestand}?w=${breedte}&auto=format`;
}
