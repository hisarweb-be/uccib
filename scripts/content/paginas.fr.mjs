/**
 * Le corps français des pages qui affichent aussi un vrai texte en français.
 * Traduction de `paginas.tr.mjs`, phrase par phrase, sans rien ajouter ni
 * retrancher : c’est le même contenu, dans une autre langue.
 *
 * Seules les pages reprises ici ont une traduction. Les quatre pages vides
 * (`subelerimiz`, `bolge-derneklerimiz`, `namaz-vakitleri`, `cuma-hutbesi`)
 * affichent un état vide traduit depuis `src/i18n/f3.ts` et n’utilisent pas le
 * corps. Les deux pages juridiques (`disclameer`,
 * `cerez-politikasi-cookie-policy`) restent en turc pour l’instant, avec un
 * avertissement visible dans la langue du visiteur ; on ne traduit pas un texte
 * juridique sans mandat de l’asbl.
 *
 * Les blocs ne portent pas encore de `_key` ici : `build-fallback.mjs` les
 * ajoute avec `sleutels()`, pour que la même source produise toujours le même
 * JSON.
 */
import { afbeelding, h2, h3, linkParagraaf, p } from '../lib/portable.mjs';

const AFFICE = '/beeld/logo/uccib-affice/960.webp';
const MENUKAART = '/beeld/menukaart-bahar-kermesi/960.webp';

/** @type {Record<string, unknown[]>} */
export const PAGINAS_FR = {
  '': [
    h2('Bienvenue sur le site de l’UCCIB, l’Union des Centres Culturels Islamiques.'),
    p(
      'Bienvenue sur notre site. Nous vous remercions de l’intérêt que vous portez à l’Union des Centres Culturels Islamiques. En tant qu’association jouissant du statut de service au public et de communauté religieuse, nous œuvrons dans les domaines religieux, social et culturel. Nous aidons les musulmans de Belgique de manière approfondie, en particulier sur les questions religieuses. Nous soutenons également la solidarité sociale et la vie en paix.'
    ),
    linkParagraaf('À propos →', '/hakkimizda'),
    h2('Actualités & presse'),
    p('Les actualités seront publiées ici prochainement.'),
    linkParagraaf('Toutes les actualités', '/haberler'),
    h2('Nos activités sociales'),
    linkParagraaf('Heures de prière', '/namaz-vakitleri'),
    linkParagraaf('Prêche du vendredi', '/cuma-hutbesi'),
    linkParagraaf('Nos sections', '/subelerimiz'),
    linkParagraaf('Faire un don', '/bagislar'),
    h3('Enseignement et jeunesse'),
    p(
      'Dans nos sections, nous offrons aux enfants et aux jeunes, outre une éducation religieuse et morale, un soutien pour leurs cours scolaires ainsi que des activités sociales et culturelles.'
    ),
    linkParagraaf('Plus d’informations', '/hakkimizda'),
    h3('Programmes de découverte de la mosquée'),
    p(
      'Nous organisons des visites de la mosquée pour les écoles, les institutions et toute personne intéressée. Pour une visite, contactez la section la plus proche.'
    ),
    linkParagraaf('Cliquez ici pour nos sections !', '/subelerimiz'),
    h3('Journée portes ouvertes'),
    p(
      'Lors de la Journée portes ouvertes, organisée chaque année, nous ouvrons nos portes à tous nos voisins et créons un espace de rencontre et de dialogue.'
    ),
    linkParagraaf('Cliquez ici pour plus d’informations !', '/haberler'),
  ],

  hakkimizda: [
    h2('Bienvenue sur le site de l’UCCIB, l’Union des Centres Culturels Islamiques.'),
    p(
      'L’Union des Centres Culturels Islamiques a été fondée en 1979 à Bruxelles comme organisation islamique jouissant du statut de communauté religieuse. Elle est indépendante, sans appartenance politique et au service du public. L’objectif de l’association est d’offrir aux musulmans de Belgique des services complets dans les domaines religieux, social et culturel. Une autre mission essentielle est que l’islam et les musulmans soient reconnus comme partie intégrante de la société européenne et que le dialogue interculturel soit établi. À cette fin, l’UCCIB collabore avec de nombreuses institutions religieuses, sociales et publiques aux niveaux communal, provincial et fédéral de l’État fédéral belge.'
    ),
  ],

  haberler: [
    p(
      'Vous trouverez sur cette page les actualités, annonces et communiqués de presse les plus récents concernant notre Union.'
    ),
    p('Il n’y a pas encore d’actualité dans cette catégorie.'),
  ],

  // Ordre de l’ancienne page : d’abord le logo, ensuite la carte du menu.
  'baharkermesi-menu': [
    afbeelding(AFFICE, 'Logo de l’UCCIB'),
    afbeelding(MENUKAART, 'Carte du menu de la Bahar Kermesi'),
  ],
};
