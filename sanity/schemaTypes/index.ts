import type { SchemaTypeDefinition } from 'sanity';

import { afdeling } from './afdeling';
import { gebedstijd } from './gebedstijd';
import { instellingen } from './instellingen';
import { nieuwsbericht } from './nieuwsbericht';
import { pagina } from './pagina';
import { preek } from './preek';
import { regio } from './regio';
import { sponsorblok } from './sponsorblok';

/**
 * Alle documenttypen die de Studio kent. Objecten (taal, slug, body, seo, adres,
 * coordinaat, openingstijden) staan in `objecten.ts` als losse velden; ze zijn
 * geen document en horen daarom niet in deze lijst.
 */
export const schemaTypes: SchemaTypeDefinition[] = [
  pagina,
  nieuwsbericht,
  afdeling,
  regio,
  gebedstijd,
  preek,
  sponsorblok,
  instellingen,
];
