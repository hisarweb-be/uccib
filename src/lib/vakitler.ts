/**
 * De gebedstijden zoals de site ze leest: het vaste bestand uit de bouw
 * (`src/data/vakitler.json`) en de namen van de zeven tijden in drie talen.
 *
 * Waarom een eigen lezer en niet de parser uit `functions/_lib`: die parser leest
 * HTML van de bron en hoort bij het ophalen, niet bij het tekenen. Dit bestand
 * leest alleen het resultaat en heeft geen netwerk nodig, zodat een pagina die
 * wordt gebouwd nooit van een bereik afhangt.
 *
 * De tijden staan als UTC-ISO in het bestand. Tonen doen we in de tijdzone van
 * Brussel, want dat is de klok waar de lezer op kijkt.
 *
 * Eén bestand voor alle steden (`steden.<slug>`), sinds elke stad een eigen adres
 * heeft. Alles hieronder werkt per stad: geef de slug mee en je krijgt de tijden,
 * de bron en het ophaalmoment van díe stad. Zonder geldige slug valt het terug op
 * Brussel, zodat een pagina die per ongeluk geen stad krijgt nooit leeg is.
 */
import gegevens from '../data/vakitler.json';

/** De zeven tijden van de dag, in de volgorde waarin ze voorkomen. */
export const TIJDEN = ['imsak', 'sabah', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
export type TijdSleutel = (typeof TIJDEN)[number];

/**
 * De vijf gebeden. Imsak (het begin van de vasten) en zonsopgang (het einde
 * ervan) horen bij de dag maar zijn geen gebed, dus die krijgen geen merkje.
 */
export const GEBEDEN = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;

export type Dag = { datum: string; tijden: Record<string, string> };

/** De tijden van één stad, zoals de bouw ze vastlegde. */
export type Stadgegevens = {
  /** De stad waar deze tijden bij horen. */
  stad: string;
  /** Weergavenaam van die stad in de taal van de pagina. */
  stadNaam: string;
  tijdstreep: string;
  bron: string;
  opgehaald: string;
  dagen: Dag[];
};

/** De vorm van `src/data/vakitler.json`: één tijdzone, één moment, alle steden. */
type Bestand = {
  tijdstreep?: string;
  opgehaald?: string;
  steden?: Record<string, { bron?: string; opgehaald?: string; dagen?: Dag[] }>;
};

const bestand = gegevens as unknown as Bestand;
const TIJDSTREEP = bestand.tijdstreep || 'Europe/Brussels';
const BRUSSEL = 'brussel';

/** De ruwe dagen van één stad; leeg als die stad (nog) geen tijden heeft. */
function dagenVan(slug: string): Dag[] {
  const dagen = bestand.steden?.[slug]?.dagen;
  return Array.isArray(dagen) ? dagen : [];
}

/**
 * Alles wat een stadspagina nodig heeft. Een onbekende slug valt terug op Brussel:
 * een pagina zonder tijden is erger dan een pagina met de tijden van de hoofdstad,
 * en de kop van die pagina noemt altijd de stad die er echt bij hoort.
 */
export function vakitGegevens(slug: string = BRUSSEL): Stadgegevens {
  const stad = STEDEN.some((s) => s.slug === slug) ? slug : BRUSSEL;
  const eigen = bestand.steden?.[stad];
  return {
    stad,
    stadNaam: STEDEN.find((s) => s.slug === stad)?.naam.nl ?? stad,
    tijdstreep: TIJDSTREEP,
    bron: eigen?.bron ?? 'https://namaz-vakitleri.fazilettakvimi.com/nl/belgie/' + stad,
    opgehaald: eigen?.opgehaald ?? bestand.opgehaald ?? '',
    dagen: dagenVan(stad),
  };
}

/** Heeft deze stad bruikbare tijden? Zonder dagen tonen we niets liever dan iets verzonnens. */
export function heeftVakitler(slug: string = BRUSSEL): boolean {
  return dagenVan(slug).length > 0;
}

/**
 * De dag van vandaag volgens de klok van Brussel, met terugval op de laatste
 * dag die we hebben. In de zomer bouwt de site om 23:50 en leest iemand om
 * 00:10: dan is de eerstvolgende dag nog niet opgehaald en tonen we wat er is.
 */
export function kiesDag(dagen: readonly Dag[], nu: Date = new Date()): Dag | null {
  if (dagen.length === 0) return null;
  const vandaag = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIJDSTREEP,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(nu);
  return dagen.find((dag) => dag.datum === vandaag) ?? dagen[dagen.length - 1] ?? null;
}

/**
 * De eerste tijd die nog moet komen, over vandaag en morgen heen. Na yatsi is dat
 * de imsak van morgen; zonder morgen valt hij terug op de imsak van vandaag, wat
 * alleen gebeurt als de bron dagenlang stil lag.
 */
export function volgendeTijd(dagen: readonly Dag[], nu: Date = new Date()): { sleutel: TijdSleutel; moment: Date } | null {
  const nuMs = nu.getTime();
  for (const dag of [...dagen].sort((a, b) => (a.datum < b.datum ? -1 : 1))) {
    for (const sleutel of TIJDEN) {
      const waarde = dag.tijden[sleutel];
      if (!waarde) continue;
      const moment = new Date(waarde);
      if (Number.isNaN(moment.getTime())) continue;
      if (moment.getTime() > nuMs) return { sleutel, moment };
    }
  }
  const laatste = dagen[dagen.length - 1];
  const waarde = laatste?.tijden.imsak;
  if (!waarde) return null;
  return { sleutel: 'imsak', moment: new Date(waarde) };
}

/** `HH:mm` in de tijdzone van Brussel, met de seconde erbij voor de klok. */
export function klok(iso: string, metSeconden = false): string {
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return '--:--';
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: TIJDSTREEP,
    hour: '2-digit',
    minute: '2-digit',
    ...(metSeconden ? { second: '2-digit' } : {}),
    hour12: false,
  }).format(moment);
}

/**
 * Namen van de zeven tijden per taal, zoals de bron ze noemt
 * (namaz-vakitleri.fazilettakvimi.com). De Nederlandse namen zijn letterlijk die
 * van de bronpagina: Imsaak, Fadjr, Zonsopgang, Zoehr, Asr, Maghrib, Isjaa.
 */
export const NAMEN: Record<'tr' | 'nl' | 'fr', Record<TijdSleutel, string>> = {
  tr: {
    imsak: 'İmsak',
    sabah: 'Sabah',
    gunes: 'Güneş',
    ogle: 'Öğle',
    ikindi: 'İkindi',
    aksam: 'Akşam',
    yatsi: 'Yatsı',
  },
  nl: {
    imsak: 'Imsaak',
    sabah: 'Fadjr',
    gunes: 'Zonsopgang',
    ogle: 'Zoehr',
    ikindi: 'Asr',
    aksam: 'Maghrib',
    yatsi: 'Isjaa',
  },
  fr: {
    imsak: 'Imsak',
    sabah: 'Fajr',
    gunes: 'Lever du soleil',
    ogle: 'Dhuhr',
    ikindi: 'Asr',
    aksam: 'Maghrib',
    yatsi: 'Isha',
  },
};

/** De stadslijst, gegenereerd uit dezelfde bron als de parser (`functions/_lib/vakitler.js`). */
export const STEDEN: ReadonlyArray<{ slug: string; naam: Record<'tr' | 'nl' | 'fr', string> }> = [
  { slug: 'brussel', naam: { tr: 'Brüksel', nl: 'Brussel', fr: 'Bruxelles' } },
  { slug: 'antwerpen', naam: { tr: 'Anvers', nl: 'Antwerpen', fr: 'Anvers' } },
  { slug: 'gent', naam: { tr: 'Gent', nl: 'Gent', fr: 'Gand' } },
  { slug: 'aalst', naam: { tr: 'Aalst', nl: 'Aalst', fr: 'Alost' } },
  { slug: 'bastogne', naam: { tr: 'Bastogne', nl: 'Bastenaken', fr: 'Bastogne' } },
  { slug: 'beringen', naam: { tr: 'Beringen', nl: 'Beringen', fr: 'Beringen' } },
  { slug: 'brugge', naam: { tr: 'Brugge', nl: 'Brugge', fr: 'Bruges' } },
  { slug: 'charleroi', naam: { tr: 'Charleroi', nl: 'Charleroi', fr: 'Charleroi' } },
  { slug: 'dendermonde', naam: { tr: 'Dendermonde', nl: 'Dendermonde', fr: 'Termonde' } },
  { slug: 'diest', naam: { tr: 'Diest', nl: 'Diest', fr: 'Diest' } },
  { slug: 'eupen', naam: { tr: 'Eupen', nl: 'Eupen', fr: 'Eupen' } },
  { slug: 'genk', naam: { tr: 'Genk', nl: 'Genk', fr: 'Genk' } },
  { slug: 'hasselt', naam: { tr: 'Hasselt', nl: 'Hasselt', fr: 'Hasselt' } },
  { slug: 'heusden-zolder', naam: { tr: 'Heusden-Zolder', nl: 'Heusden-Zolder', fr: 'Heusden-Zolder' } },
  { slug: 'kortrijk', naam: { tr: 'Kortrijk', nl: 'Kortrijk', fr: 'Courtrai' } },
  { slug: 'la-louviere', naam: { tr: 'La Louvière', nl: 'La Louvière', fr: 'La Louvière' } },
  { slug: 'leopoldsburg', naam: { tr: 'Leopoldsburg', nl: 'Leopoldsburg', fr: 'Leopoldsburg' } },
  { slug: 'leuven', naam: { tr: 'Leuven', nl: 'Leuven', fr: 'Louvain' } },
  { slug: 'liege', naam: { tr: 'Liège', nl: 'Luik', fr: 'Liège' } },
  { slug: 'lier', naam: { tr: 'Lier', nl: 'Lier', fr: 'Lierre' } },
  { slug: 'lokeren', naam: { tr: 'Lokeren', nl: 'Lokeren', fr: 'Lokeren' } },
  { slug: 'lommel', naam: { tr: 'Lommel', nl: 'Lommel', fr: 'Lommel' } },
  { slug: 'maasmechelen', naam: { tr: 'Maasmechelen', nl: 'Maasmechelen', fr: 'Maasmechelen' } },
  { slug: 'meulebeke', naam: { tr: 'Meulebeke', nl: 'Meulebeke', fr: 'Meulebeke' } },
  { slug: 'mol', naam: { tr: 'Mol', nl: 'Mol', fr: 'Mol' } },
  { slug: 'mons', naam: { tr: 'Mons', nl: 'Bergen', fr: 'Mons' } },
  { slug: 'namur', naam: { tr: 'Namur', nl: 'Namen', fr: 'Namur' } },
  { slug: 'saint-vith', naam: { tr: 'Sankt Vith', nl: 'Sankt Vith', fr: 'Saint-Vith' } },
  { slug: 'sint-niklaas', naam: { tr: 'Sint-Niklaas', nl: 'Sint-Niklaas', fr: 'Saint-Nicolas' } },
  { slug: 'turnhout', naam: { tr: 'Turnhout', nl: 'Turnhout', fr: 'Turnhout' } },
  { slug: 'verviers', naam: { tr: 'Verviers', nl: 'Verviers', fr: 'Verviers' } },
  { slug: 'virton', naam: { tr: 'Virton', nl: 'Virton', fr: 'Virton' } },
  { slug: 'willebroek', naam: { tr: 'Willebroek', nl: 'Willebroek', fr: 'Willebroek' } },
  { slug: 'zele', naam: { tr: 'Zele', nl: 'Zele', fr: 'Zele' } },
];
