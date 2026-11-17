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

/**
 * Wat er gebeurt zolang er geen project is, en waarom dat de juiste stand is.
 *
 * Tot 17 november 2026 bouwde de Studiostap gewoon door en stond er op /beheer
 * een Studio die opende en daarna "An error occurred" toonde: hij had geen
 * project om tegen te praten. Dat is de enige stand die erger is dan geen
 * beheer, want de voorzitter ziet een scherm dat stuk lijkt.
 *
 * Zonder project bouwt de Studiostap daarom niets: geen /beheer, geen halve
 * Studio. De site zelf hangt er niet aan en bouwt volledig uit de offline kopie
 * (`src/data/cms-fallback.json`), dus de uitrol gaat gewoon door.
 *
 * Zodra Altuner het Sanity-project aanmaakt en `SANITY_STUDIO_PROJECT_ID` in
 * `sanity/.env` zet (of hier het echte id invult), bouwt de Studio mee en eist
 * de keuring dat /beheer opent. Zie sanity/README.md.
 */
export const GEEN_PROJECT_MELDING =
  'OVER  geen Sanity-projectId (sanity/project.ts staat nog op de placeholder): ' +
  '/beheer wordt niet gebouwd en de site bouwt uit de offline kopie. ' +
  'Zet SANITY_STUDIO_PROJECT_ID in sanity/.env om het beheer aan te zetten.';
