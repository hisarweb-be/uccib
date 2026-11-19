/**
 * Gebedstijden van de Fazilet-kalender, één parser voor twee gebruikers:
 * de bouw (`scripts/lever-vakitler.mjs`) en de functie op Cloudflare
 * (`functions/api/vakitler.js`).
 *
 * Waarom HTML en geen JSON: `namaz-vakitleri.fazilettakvimi.com` publiceert geen
 * openbaar API. Dezelfde bron die de site van Almere gebruikt, levert één pagina
 * per stad met een tabel van drie dagen (gisteren, vandaag, morgen). De tijden
 * staan er als `<time dateTime="2026-11-19T04:56:00Z">` in, in UTC, met de
 * plaatselijke tijd ernaast. Wij lezen alleen die ISO-waarde: die is
 * ondubbelzinnig en hoeft niet per taal te worden herkend.
 *
 * Waarom op rijnummer en niet op naam: de namen verschillen per taal (Imsaak,
 * İmsak, Imsak) en de volgorde niet. Zeven rijen, altijd in deze orde:
 * imsak, sabah, güneş, öğle, ikindi, akşam, yatsı.
 *
 * De datum van een kolom komt uit de imsak van die kolom. Imsak valt altijd
 * vóór zonsopgang, dus in België (UTC+1 of +2) is de UTC-datum gelijk aan de
 * plaatselijke datum. De andere tijden van dezelfde kolom horen bij diezelfde
 * dag, ook als hun UTC-waarde toevallig op de volgende dag valt.
 */

/** De zeven rijen van de bron, in de volgorde van de tabel. */
export const RIJEN = ['imsak', 'sabah', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];

/** De vijf gebeden; zonsopgang is een tijd, geen gebed. */
export const GEBEDEN = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'];

/** Elke stad die de bron voor België kent (gemeten 19 nov 2026: 34). */
export const STEDEN = [
  { slug: 'brussel', tr: 'Brüksel', nl: 'Brussel', fr: 'Bruxelles' },
  { slug: 'antwerpen', tr: 'Anvers', nl: 'Antwerpen', fr: 'Anvers' },
  { slug: 'gent', tr: 'Gent', nl: 'Gent', fr: 'Gand' },
  { slug: 'aalst', tr: 'Aalst', nl: 'Aalst', fr: 'Alost' },
  { slug: 'bastogne', tr: 'Bastogne', nl: 'Bastenaken', fr: 'Bastogne' },
  { slug: 'beringen', tr: 'Beringen', nl: 'Beringen', fr: 'Beringen' },
  { slug: 'brugge', tr: 'Brugge', nl: 'Brugge', fr: 'Bruges' },
  { slug: 'charleroi', tr: 'Charleroi', nl: 'Charleroi', fr: 'Charleroi' },
  { slug: 'dendermonde', tr: 'Dendermonde', nl: 'Dendermonde', fr: 'Termonde' },
  { slug: 'diest', tr: 'Diest', nl: 'Diest', fr: 'Diest' },
  { slug: 'eupen', tr: 'Eupen', nl: 'Eupen', fr: 'Eupen' },
  { slug: 'genk', tr: 'Genk', nl: 'Genk', fr: 'Genk' },
  { slug: 'hasselt', tr: 'Hasselt', nl: 'Hasselt', fr: 'Hasselt' },
  { slug: 'heusden-zolder', tr: 'Heusden-Zolder', nl: 'Heusden-Zolder', fr: 'Heusden-Zolder' },
  { slug: 'kortrijk', tr: 'Kortrijk', nl: 'Kortrijk', fr: 'Courtrai' },
  { slug: 'la-louviere', tr: 'La Louvière', nl: 'La Louvière', fr: 'La Louvière' },
  { slug: 'leopoldsburg', tr: 'Leopoldsburg', nl: 'Leopoldsburg', fr: 'Leopoldsburg' },
  { slug: 'leuven', tr: 'Leuven', nl: 'Leuven', fr: 'Louvain' },
  { slug: 'liege', tr: 'Liège', nl: 'Luik', fr: 'Liège' },
  { slug: 'lier', tr: 'Lier', nl: 'Lier', fr: 'Lierre' },
  { slug: 'lokeren', tr: 'Lokeren', nl: 'Lokeren', fr: 'Lokeren' },
  { slug: 'lommel', tr: 'Lommel', nl: 'Lommel', fr: 'Lommel' },
  { slug: 'maasmechelen', tr: 'Maasmechelen', nl: 'Maasmechelen', fr: 'Maasmechelen' },
  { slug: 'meulebeke', tr: 'Meulebeke', nl: 'Meulebeke', fr: 'Meulebeke' },
  { slug: 'mol', tr: 'Mol', nl: 'Mol', fr: 'Mol' },
  { slug: 'mons', tr: 'Mons', nl: 'Bergen', fr: 'Mons' },
  { slug: 'namur', tr: 'Namur', nl: 'Namen', fr: 'Namur' },
  { slug: 'saint-vith', tr: 'Sankt Vith', nl: 'Sankt Vith', fr: 'Saint-Vith' },
  { slug: 'sint-niklaas', tr: 'Sint-Niklaas', nl: 'Sint-Niklaas', fr: 'Saint-Nicolas' },
  { slug: 'turnhout', tr: 'Turnhout', nl: 'Turnhout', fr: 'Turnhout' },
  { slug: 'verviers', tr: 'Verviers', nl: 'Verviers', fr: 'Verviers' },
  { slug: 'virton', tr: 'Virton', nl: 'Virton', fr: 'Virton' },
  { slug: 'willebroek', tr: 'Willebroek', nl: 'Willebroek', fr: 'Willebroek' },
  { slug: 'zele', tr: 'Zele', nl: 'Zele', fr: 'Zele' },
];

export const STAD_SLUGS = new Set(STEDEN.map((stad) => stad.slug));

export const TIJDSTREEP = 'Europe/Brussels';

/** De taal van de bronpagina. Nederlands: de namen zijn voor ons publiek het herkenbaarst. */
export const BRON_TAAL = 'nl';

export function bronPad(stad) {
  return `https://namaz-vakitleri.fazilettakvimi.com/${BRON_TAAL}/belgie/${stad}`;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?Z$/;

function isIso(waarde) {
  const m = ISO.exec(waarde);
  if (!m) return false;
  const [, , maand, dag, uur, minuut] = m;
  if (Number(maand) < 1 || Number(maand) > 12 || Number(dag) < 1 || Number(dag) > 31) return false;
  return Number(uur) < 24 && Number(minuut) < 60;
}

/**
 * HTML van één stadspagina naar dagen met tijden.
 * Levert `[]` bij twijfel: een halve of verschoven tabel is erger dan geen tabel,
 * want de lezer bidt op deze tijden.
 */
export function parseVakitler(html) {
  const tbody = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(html);
  if (!tbody) return [];

  const rijen = tbody[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  if (rijen.length < RIJEN.length) return [];

  /** Per rij de ISO-waarden van de drie kolommen (gisteren, vandaag, morgen). */
  const kolommen = [];
  for (let i = 0; i < RIJEN.length; i += 1) {
    const tijden = [...rijen[i].matchAll(/dateTime="([^"]+)"/gi)].map((m) => m[1]);
    if (tijden.length !== 3 || !tijden.every(isIso)) return [];
    kolommen.push(tijden);
  }

  const dagen = new Map();
  for (let c = 0; c < 3; c += 1) {
    const datum = kolommen[0][c].slice(0, 10);
    const tijden = {};
    for (let i = 0; i < RIJEN.length; i += 1) {
      tijden[RIJEN[i]] = kolommen[i][c];
    }
    // De zeven dagtijden moeten in de dagorde staan; anders is dit een verkeerde stad.
    const volgorde = RIJEN.map((sleutel) => Date.parse(tijden[sleutel]));
    for (let i = 1; i < volgorde.length; i += 1) {
      if (!(volgorde[i] > volgorde[i - 1])) return [];
    }
    dagen.set(datum, tijden);
  }

  return [...dagen.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([datum, tijden]) => ({ datum, tijden }));
}

/** De vorm die de site van Almere van zijn bron krijgt, zodat elke lezer hem kent. */
export function envelop(stad, dagen, opgehaald) {
  const naam = STEDEN.find((s) => s.slug === stad);
  const vakitler = dagen.map((dag) => {
    const rij = { tarih: dag.datum };
    for (const sleutel of RIJEN) {
      rij[sleutel] = [{ tarih: dag.tijden[sleutel], is_takdiri: false }];
    }
    return rij;
  });
  return {
    success: true,
    bolge_adi: naam ? naam.nl : stad,
    bolge_saatdilimi: TIJDSTREEP,
    bron: bronPad(stad),
    opgehaald,
    vakitler,
    /** Dezelfde dagen in de vorm die de site zelf gebruikt; de browser leest deze. */
    dagen: dagen.map((dag) => ({ datum: dag.datum, tijden: dag.tijden })),
  };
}

/** Envelop terug naar de dagen waar de site mee werkt. */
export function uitEnvelop(antwoord) {
  if (!antwoord || antwoord.success !== true) return [];
  if (Array.isArray(antwoord.dagen)) return antwoord.dagen;
  if (!Array.isArray(antwoord.vakitler)) return [];
  const dagen = [];
  for (const rij of antwoord.vakitler) {
    const tijden = {};
    let heel = true;
    for (const sleutel of RIJEN) {
      const eerste = Array.isArray(rij[sleutel]) ? rij[sleutel][0] : null;
      if (!eerste || !isIso(eerste.tarih)) {
        heel = false;
        break;
      }
      tijden[sleutel] = eerste.tarih;
    }
    if (heel) dagen.push({ datum: String(rij.tarih), tijden });
  }
  return dagen;
}

/** Haalt één stad op. Geeft `[]` bij elke fout: de aanroeper houdt dan zijn oude gegevens. */
export async function haalStad(stad, { fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  if (!STAD_SLUGS.has(stad)) return [];
  try {
    const antwoord = await fetchImpl(bronPad(stad), {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': 'uccib.com gebedstijden (+https://uccib.com)' },
    });
    if (!antwoord.ok) return [];
    return parseVakitler(await antwoord.text());
  } catch {
    return [];
  }
}
