import { defineCliConfig } from 'sanity/cli';

import { dataset, projectId } from './project';

/**
 * Wat de CLI nodig heeft om te bouwen en te deployen.
 *
 * De Studio wordt niet gedeployd naar Sanity zelf (`sanity deploy`), maar
 * gebouwd naar `public/beheer` en mee uitgerold met de site. `sanity deploy`
 * staat hier alleen als noodroute, niet als de normale weg.
 */
export default defineCliConfig({
  api: { projectId, dataset },
  /**
   * De CLI moet dezelfde basis kennen als de Studio zelf.
   *
   * `basePath` in `sanity.config.ts` stuurt alleen de router; zonder deze regel
   * schrijft de bouw zijn scripts als `/static/...` en dan zoekt de browser ze
   * op de wortel van de site in plaats van onder `/beheer`. Met deze regel
   * worden het `/beheer/static/...` en staan de bestanden waar de HTML ze
   * zoekt. Twee plekken, één waarde; ze moeten gelijk blijven.
   */
  project: { basePath: '/beheer' },
  vite: {
    // De Studio heeft geen eigen server nodig bij het bouwen; dit houdt de
    // bouw klein en deterministisch.
    logLevel: 'warn',
  },
});
