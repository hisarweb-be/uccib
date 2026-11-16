// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { CONCEPT_SLUGS } from './src/data/site.ts';

/**
 * Turks staat op de root, Nederlands onder /nl/, Frans onder /fr/.
 * De slugs zelf blijven in alle drie de talen exact gelijk (plan §8).
 */
export default defineConfig({
  site: 'https://uccib.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({
      /**
       * Alleen pagina's met echte inhoud. Een concept dat nog gebouwd wordt hoort
       * niet in de sitemap: dat is een lege pagina aanbieden aan een zoekmachine,
       * en die rekent dat af op het hele domein. Zodra F3 de slug uit
       * CONCEPT_SLUGS haalt, komt de pagina hier vanzelf weer in.
       */
      filter: (page) => {
        const path = new URL(page).pathname;
        return !CONCEPT_SLUGS.some((slug) => new RegExp(`/${slug}/?$`).test(path));
      },
    }),
  ],
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
