/**
 * De inhoud van de site staat sinds 17-11 in de repo, niet in een CMS-database.
 * Dit bestand is de enige plek die zegt wat een pagina en een sponsorblok mogen
 * bevatten; Astro controleert elk Markdown-bestand er tegen bij de bouw, en
 * Sveltia CMS leest dezelfde velden uit `public/admin/config.yml`.
 *
 * Zeven collecties (de zevende, `kerngegevens`, staat onderaan):
 *   - `paginas`: één bestand per pagina per taal, `src/content/paginas/<taal>/<slug>.md`.
 *     Het bestand voor de startpagina heet `index.md` (dus `tr/index`), alle andere
 *     heten naar hun slug (`tr/hakkimizda`).
 *   - `sponsorblokken`: de bedragen op de doneerpagina, `src/content/sponsorblokken/NN.md`.
 *   - `subeler`, `dernekler`, `vakitler`, `hutbeler`: de vier ledendiensten, elk
 *     één bestand per regel die op de pagina komt. Zie `docs/ledendiensten.md`.
 *
 * De instellingen (sitenaam, adres, telefoon) staan bewust niet hier: die staan in
 * `src/data/site.ts` en zijn voor de klant geen knop maar een gegeven.
 *
 * Let op: dit is `src/content.config.ts` (Astro 5, Content Layer API), niet
 * `src/content/config.ts` uit Astro 4. De oude plek wordt genegeerd en dan laadt
 * geen enkele collectie.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import kerngegevensBron from './data/kerngegevens.json';

const paginas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/paginas' }),
  schema: z.object({
    /** Titel in het browsertabblad en in de deling. */
    title: z.string(),
    /** De grote kop boven het artikel; mag afwijken van `title` (drietalig ontwerp). */
    h1: z.string(),
    /** Meta-omschrijving voor zoekmachines en delingen. */
    description: z.string().default(''),
    /** Korte inleiding boven de body; leeg betekent: geen inleiding. */
    intro: z.string().default(''),
    /** Volgorde in de CMS-lijst. */
    order: z.number().default(0),
    /**
     * Staat de pagina op de site? Alleen het Turkse bestand draagt deze schakelaar:
     * één knop voor alle drie de talen, zodat een half gevulde pagina niet in het
     * Nederlands blijft hangen terwijl het Turks al dicht is.
     */
    active: z.boolean().optional(),
  }),
});

const sponsorblokken = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sponsorblokken' }),
  schema: z.object({
    /** Bedrag in euro, of null voor het vrije bedrag. */
    amount: z.number().nullable().default(null),
    /** Wat er op de knop staat. */
    label: z.string(),
    /** Mollie-betaallink. */
    link: z.string().url().nullable().default(null),
    /** Volgorde van laag naar hoog; de CMS bewaart die mee. */
    order: z.number().default(0),
    active: z.boolean().default(true),
  }),
});

/**
 * De vier ledendiensten. Elk onderdeel is een eigen collectie met één bestand
 * per regel op de pagina, zodat de vereniging zelf vestigingen, regionale
 * verenigingen, een maandelijkse tijdstabel en het preekarchief kan bijhouden
 * zonder in de code te komen. De velden staan in één taal: een naam, een adres
 * en een telefoonnummer zijn eigennamen en hoeven niet drie keer vertaald.
 *
 * Bewust géén inhoud in de repo: zolang een collectie leeg is, toont
 * `src/components/LedenDienst.astro` niets en blijft de pagina dicht.
 */
const dienstBasis = {
  /** Volgorde in de lijst; de CMS bewaart die mee. */
  order: z.number().default(0),
  /** Eén regel uitzetten verbergt hem zonder hem te wissen. */
  active: z.boolean().default(true),
};

/**
 * Een coördinaat is optioneel: leeg (of een leeg CMS-veld, dat als '' binnenkomt)
 * wordt null. Ze dienen alleen om later een route te kunnen berekenen; de site
 * toont nooit een kaart, tegel of coördinaat (DESIGNSYSTEEM 7.6).
 */
const coordinaat = z.preprocess((v) => (v === '' ? null : v), z.number().nullable().default(null));

const subeler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/subeler' }),
  schema: z.object({
    ...dienstBasis,
    /** Naam van de vestiging. */
    name: z.string(),
    street: z.string().default(''),
    postalCode: z.string().default(''),
    city: z.string().default(''),
    phone: z.string().default(''),
    email: z.string().default(''),
    /** Vrije tekst, bijvoorbeeld "Her gün 09:00-18:00". */
    openingHours: z.string().default(''),
    /** Pad onder /beeld/ of een volledig adres; leeg betekent geen foto. */
    photo: z.string().default(''),
    lat: coordinaat,
    lng: coordinaat,
  }),
});

const dernekler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/dernekler' }),
  schema: z.object({
    ...dienstBasis,
    /** Naam van de regionale vereniging. */
    name: z.string(),
    /** Regio of stad, bijvoorbeeld "Brabant" of "Gent". */
    region: z.string().default(''),
    /** Eén of twee zinnen over de vereniging; leeg betekent geen tekst. */
    description: z.string().default(''),
    contact: z.string().default(''),
    phone: z.string().default(''),
    email: z.string().default(''),
    /** Volledig adres met https://; leeg betekent geen knop. */
    website: z.string().default(''),
    photo: z.string().default(''),
    lat: coordinaat,
    lng: coordinaat,
  }),
});

const vakitler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vakitler' }),
  schema: z.object({
    ...dienstBasis,
    /** Maand in de vorm 2026-11; één bestand per maand. */
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Gebruik JJJJ-MM, bijvoorbeeld 2026-11'),
    /** Plaats of moskee waar de tijden voor gelden. */
    place: z.string(),
    /** Waar de tijden vandaan komen; leeg betekent geen bronregel. */
    source: z.string().default(''),
  }),
});

const hutbeler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/hutbeler' }),
  schema: z.object({
    ...dienstBasis,
    /** Titel van de preek. */
    title: z.string(),
    /** Datum waarop de preek is gehouden. */
    date: z.coerce.date(),
    /** Imam of spreker; leeg betekent geen naam. */
    imam: z.string().default(''),
    /** Taal van de preek, bijvoorbeeld "Türkçe". */
    language: z.string().default(''),
    /** Pad naar een PDF onder /beeld/; leeg betekent geen PDF-knop. */
    file: z.string().default(''),
  }),
});

/**
 * `kerngegevens`: één bestand, `src/data/kerngegevens.json`, met openingsuren,
 * KBO, rechtsvorm en coördinaten (naam en zetel staan in `src/data/rechtspersoon.json`).
 * Leeg betekent: niet tonen. Het CMS bewerkt het als files-collectie "Kerngegevens";
 * dit schema laat de bouw falen als het bestand een ongeldig veld krijgt. De
 * pagina's lezen het JSON-bestand zelf; de collectie is de controle.
 */
/* Sveltia schrijft een leeg getalveld als "", niet als null. */
const kerngegevens = defineCollection({
  loader: async () => [{ id: 'kerngegevens', ...kerngegevensBron }],
  schema: z.object({
    openingsuren: z.string().default(''),
    kbo: z.string().default(''),
    rechtsvorm: z.string().default(''),
    lat: coordinaat,
    lng: coordinaat,
  }),
});

export const collections = {
  paginas,
  sponsorblokken,
  subeler,
  dernekler,
  vakitler,
  hutbeler,
  kerngegevens,
};
