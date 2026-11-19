// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { conceptSlugs } from './src/lib/actief.ts';
import remarkActieveLinks from './src/lib/remark-actieve-links.ts';
import remarkKnopAlinea from './src/lib/remark-knop-alinea.ts';

/**
 * Turks staat op de root, Nederlands onder /nl/, Frans onder /fr/.
 * De slugs zelf blijven in alle drie de talen exact gelijk (plan §8).
 */
export default defineConfig({
  site: 'https://uccib.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      /**
       * Alleen pagina's met echte inhoud. Een pagina die in de CMS uit staat,
       * hoort niet in de sitemap: dat is een lege pagina aanbieden aan een
       * zoekmachine, en die rekent dat af op het hele domein. Zet dhr. Omer de
       * schakelaar om, dan komt de pagina hier vanzelf weer in.
       */
      filter: (page) => {
        const path = new URL(page).pathname;
        return !conceptSlugs().some((slug) => new RegExp(`/${slug}/?$`).test(path));
      },
    }),
  ],
  markdown: {
    /**
     * Twee bewerkingen op de Markdown van elke pagina: links naar uitgezette
     * pagina's verliezen hun anker, en interne links krijgen het taarvoorvoegsel
     * van de pagina waarin ze staan (`src/lib/remark-actieve-links.ts`); daarna
     * krijgt een alinea met alleen een link de knopklasse (`remark-knop-alinea.ts`).
     */
    remarkPlugins: [remarkActieveLinks, remarkKnopAlinea],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'nl', 'fr'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
});
