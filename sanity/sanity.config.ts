import { frFRLocale } from '@sanity/locale-fr-fr';
import { nlNLLocale } from '@sanity/locale-nl-nl';
import { trTRLocale } from '@sanity/locale-tr-tr';
import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { dataset, isPlaceholder, projectId } from './project';
import { schemaTypes } from './schemaTypes';
import { structure } from './structuur';

/**
 * De Studio van uccib.com.
 *
 * `basePath: '/beheer'` is geen detail: de Studio wordt gebouwd naar
 * `public/beheer` en staat daardoor op https://uccib.com/beheer, achter
 * dezelfde Cloudflare-plaatsing als de site. Geen tweede dienst, geen tweede
 * factuur (plan §3).
 *
 * De drie taalbundels zijn plugins, geen losse configuratie: de voorzitter
 * kiest in haar gebruikersmenu haar taal en ziet daarna de knoppen in het
 * Turks, Nederlands of Frans in plaats van in het Engels.
 */
export default defineConfig({
  name: 'uccib',
  title: 'UCCIB · Beheer',

  projectId,
  dataset,

  basePath: '/beheer',

  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: '2025-11-01' }),
    // Turks eerst: dat is de taal waarin de voorzitter werkt.
    trTRLocale(),
    nlNLLocale(),
    frFRLocale(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // De singleton Instellingen mag niet weg en niet dubbel bestaan.
    actions: (prev, { schemaType }) =>
      schemaType === 'instellingen'
        ? prev.filter(({ action }) => action !== 'delete' && action !== 'duplicate')
        : prev,
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter(({ templateId }) => templateId !== 'instellingen')
        : prev,
  },
});

if (isPlaceholder) {
  // Eén regel, geen crash: de Studio opent gewoon, maar tegen een lege dataset.
  // Zodra Altuner het project aanmaakt en de id invult, is dit weg.
  console.warn(
    '[UCCIB] Geen Sanity-projectId ingesteld. Zet SANITY_STUDIO_PROJECT_ID in sanity/.env ' +
      'en herstart de Studio. Zie sanity/README.md.',
  );
}
