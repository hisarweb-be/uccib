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

/**
 * Vangnet voor de randcache van Cloudflare, en niet voor de site zelf.
 *
 * Gemeten op 17 nov 2026: na een uitrol waarin `/beheer` bewust ontbrak, bleef
 * `https://uccib.pages.dev/beheer/` een oude Studio-kopie serveren met
 * `Cache-Control: public, s-maxage=604800` en `Age: 1221`, terwijl de
 * uitrol-URL zelf 404 gaf. Een bestand op dat pad in de nieuwste uitrol
 * overschreef die kopie meteen. Zonder project krijgt `/beheer` daarom een
 * kleine pagina die vertelt dat het beheer uitstaat en waarom, met
 * `no-store` erop. Zo ziet niemand een week lang een scherm dat niet meer
 * bestaat, en de site zelf blijft onaangeroerd.
 */
export const BEHEER_UIT = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Beheer staat uit | UCCIB</title>
<style>
  body { font-family: system-ui, sans-serif; line-height: 1.6; margin: 0; padding: 2rem 1.5rem; color: #1b1b1b; background: #faf8f5; }
  main { max-width: 34rem; margin: 0 auto; }
  h1 { font-size: 1.4rem; }
  a { color: #7a5c2e; }
</style>
</head>
<body>
<main>
<h1>Het beheer staat nog uit</h1>
<p>De website zelf werkt volledig. Het bewerkgedeelte is nog niet aangezet omdat het
Sanity-project nog niet is aangemaakt. Zodra dat er is, verschijnt het beheer hier.</p>
<p><a href="/">Terug naar de website</a></p>
</main>
</body>
</html>
`;

/** De regel die de bouw en de keuring allebei printen als er geen project is. */
export const GEEN_PROJECT = `OVER  geen Sanity-projectId: /beheer wordt niet gebouwd en de site bouwt uit de offline kopie. Zet SANITY_STUDIO_PROJECT_ID in sanity/.env (zie ${UITLEG}) om het beheer aan te zetten.`;
