/**
 * De enige plek waar het Sanity-project staat.
 *
 * Zolang het project niet bestaat, blijven dit de placeholders: de site bouwt
 * dan volledig uit de offline kopie (`src/data/cms-fallback.json`) en de Studio
 * start niet. Zodra het project bestaat, vul je hier het echte id in (of zet je
 * `SANITY_STUDIO_PROJECT_ID` in de omgeving). Eén waarde, één plek.
 *
 * Een projectId is een korte lettercombinatie zoals `a1b2c3d4`; de naam van het
 * project (`uccib`) is iets anders. Zie sanity/README.md.
 */

const PROJECT_ID_PLACEHOLDER = 'PROJECT_ID_NOG_NIET_AANGEMAAKT';

const fromEnv = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

export const projectId =
  fromEnv(process.env.SANITY_STUDIO_PROJECT_ID) ?? fromEnv(process.env.PUBLIC_SANITY_PROJECT_ID) ?? PROJECT_ID_PLACEHOLDER;

export const dataset =
  fromEnv(process.env.SANITY_STUDIO_DATASET) ?? fromEnv(process.env.PUBLIC_SANITY_DATASET) ?? 'production';

/** True zolang er nog geen echt projectId is ingevuld. */
export const isPlaceholder = projectId === PROJECT_ID_PLACEHOLDER;
