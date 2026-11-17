/**
 * De inhoud van de site staat sinds 17-11 in de repo, niet in een CMS-database.
 * Dit bestand is de enige plek die zegt wat een pagina en een sponsorblok mogen
 * bevatten; Astro controleert elk Markdown-bestand er tegen bij de bouw, en
 * Sveltia CMS leest dezelfde velden uit `public/admin/config.yml`.
 *
 * Twee collecties:
 *   - `paginas`: één bestand per pagina per taal, `src/content/paginas/<taal>/<slug>.md`.
 *     Het bestand voor de startpagina heet `index.md` (dus `tr/index`), alle andere
 *     heten naar hun slug (`tr/hakkimizda`).
 *   - `sponsorblokken`: de bedragen op de doneerpagina, `src/content/sponsorblokken/NN.md`.
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

export const collections = { paginas, sponsorblokken };
