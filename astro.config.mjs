// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Turks staat op de root, Nederlands onder /nl/, Frans onder /fr/.
 * De slugs zelf blijven in alle drie de talen exact gelijk (plan §8).
 */
export default defineConfig({
  site: 'https://uccib.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [react(), sitemap()],
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
