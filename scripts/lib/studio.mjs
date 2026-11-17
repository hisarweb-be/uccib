/**
 * Eén antwoord op de vraag of er een Sanity-project is.
 *
 * Twee stappen hebben dat antwoord nodig, en ze mogen het niet oneens zijn:
 * `scripts/build-studio.mjs` bouwt `/beheer` alleen als het project bestaat, en
 * `scripts/verify-een-voor-een.mjs` eist dan dat `/beheer` opent (en anders dat
 * het er juist niet is). Twee eigen kopieën van dezelfde afleiding lopen vroeg
 * of laat uiteen; daarom staat hij hier één keer.
 *
 * Waarom niet gewoon `sanity/project.ts` importeren: dat is TypeScript met
 * type-annotaties, en deze twee stappen draaien met kale Node. Het bestand
 * lezen en naar de placeholder zoeken is eerlijk en heeft geen bouwstap nodig.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** De letterlijke waarde uit `sanity/project.ts`; verandert mee als die verandert. */
export const PLACEHOLDER = 'PROJECT_ID_NOG_NIET_AANGEMAAKT';

/** Waar de uitleg staat die een beheerder moet lezen. */
export const UITLEG = 'sanity/README.md';

/**
 * True als er een echt projectId is: uit de omgeving, of ingevuld in
 * `sanity/project.ts`. Zonder project bouwt er geen Studio en is `/beheer` er
 * niet, wat de eerlijke stand is: een Studio zonder project toont alleen een
 * foutscherm.
 */
export function heeftSanityProject() {
  for (const naam of ['SANITY_STUDIO_PROJECT_ID', 'PUBLIC_SANITY_PROJECT_ID']) {
    const waarde = (process.env[naam] ?? '').trim();
    if (waarde !== '' && waarde !== PLACEHOLDER) return true;
  }
  const bron = readFileSync(join(root, 'sanity', 'project.ts'), 'utf8');
  // Alleen de letterlijke waarde telt; de naam van de constante staat er altijd.
  return !bron.includes(`'${PLACEHOLDER}'`);
}

/** De regel die de bouw en de keuring allebei printen als er geen project is. */
export const GEEN_PROJECT = `OVER  geen Sanity-projectId: /beheer wordt niet gebouwd en de site bouwt uit de offline kopie. Zet SANITY_STUDIO_PROJECT_ID in sanity/.env (zie ${UITLEG}) om het beheer aan te zetten.`;
