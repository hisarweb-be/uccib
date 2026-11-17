/**
 * De Nederlandse body van de pagina's die ook in het Nederlands echte tekst
 * tonen. Vertaling van `paginas.tr.mjs`, zin voor zin, zonder iets toe te voegen
 * en zonder iets weg te laten: het is dezelfde inhoud, in een andere taal.
 *
 * Alleen de pagina's die hier staan hebben een vertaling. De vier lege pagina's
 * (`subelerimiz`, `bolge-derneklerimiz`, `namaz-vakitleri`, `cuma-hutbesi`)
 * tonen in elke taal een lege staat uit `src/i18n/f3.ts` en gebruiken de body
 * dus niet. De twee juridische pagina's (`disclameer`,
 * `cerez-politikasi-cookie-policy`) blijven voorlopig Turks, met een zichtbare
 * mededeling erboven in de taal van de bezoeker; een juridische tekst vertaalt
 * niemand zonder opdracht van de vzw.
 *
 * De blokken zijn hier NIET voorzien van `_key`; `build-fallback.mjs` doet dat
 * met `sleutels()`, zodat dezelfde bron altijd dezelfde JSON oplevert.
 */
import { afbeelding, h2, h3, linkParagraaf, p } from '../lib/portable.mjs';

const AFFICE = '/beeld/logo/uccib-affice/960.webp';
const MENUKAART = '/beeld/menukaart-bahar-kermesi/960.webp';

/** @type {Record<string, unknown[]>} */
export const PAGINAS_NL = {
  '': [
    h2('Welkom op de site van UCCIB, de Unie van Islamitische Culturele Centra.'),
    p(
      'Welkom op onze website. Dank u voor uw belangstelling voor de Unie van Islamitische Culturele Centra. Als vereniging met de hoedanigheid van dienst aan het publiek en van religieuze gemeenschap werken wij op religieus, sociaal en cultureel vlak. Wij helpen moslims in België in het bijzonder op religieus gebied, op een brede en grondige manier. Daarnaast ondersteunen wij de maatschappelijke solidariteit en het samenleven in vrede.'
    ),
    linkParagraaf('Over ons', '/hakkimizda'),
    h2('Nieuws & pers'),
    p('Binnenkort verschijnen hier de nieuwsberichten.'),
    linkParagraaf('Al het nieuws', '/haberler'),
    h2('Onze sociale activiteiten'),
    linkParagraaf('Gebedstijden', '/namaz-vakitleri'),
    linkParagraaf('Vrijdagpreek', '/cuma-hutbesi'),
    linkParagraaf('Onze afdelingen', '/subelerimiz'),
    linkParagraaf('Doneren', '/bagislar'),
    h3('Onderwijs- en jeugdwerking'),
    p(
      'In onze afdelingen bieden wij kinderen en jongeren naast godsdienstige en morele vorming ook ondersteuning bij hun schoolvakken, en sociale en culturele activiteiten.'
    ),
    linkParagraaf('Meer informatie', '/hakkimizda'),
    h3('Voorlichtingsprogramma’s over de moskee'),
    p(
      'Voor scholen, instellingen en iedereen die interesse heeft, organiseren wij bezoeken aan de moskee. Neem voor een bezoek contact op met uw dichtstbijzijnde afdeling.'
    ),
    linkParagraaf('Klik hier voor onze afdelingen!', '/subelerimiz'),
    h3('Open Moskeedag'),
    p(
      'Tijdens de Open Moskeedag, die elk jaar plaatsvindt, openen wij onze deuren voor al onze buren en creëren wij een ontmoeting en dialoog.'
    ),
    linkParagraaf('Klik hier voor meer informatie!', '/haberler'),
  ],

  hakkimizda: [
    h2('Welkom op de site van UCCIB, de Unie van Islamitische Culturele Centra.'),
    p(
      'De Unie van Islamitische Culturele Centra is in 1979 in Brussel opgericht als islamitische organisatie met de hoedanigheid van religieuze gemeenschap. Zij is onafhankelijk, partijloos en dienstbaar aan het publiek. Het doel van de vereniging is moslims in België een breed aanbod aan religieuze, sociale en culturele diensten te bieden. Een tweede kerntaak is dat de islam en de moslims erkend worden als deel van de Europese samenleving en dat de interculturele dialoog tot stand komt. Met dat doel werkt UCCIB samen met heel wat religieuze, sociale en overheidsinstellingen op gemeentelijk, provinciaal en federaal niveau in de Belgische federale staat.'
    ),
  ],

  haberler: [
    p(
      'Op deze pagina vindt u de meest recente nieuwsberichten, aankondigingen en persberichten over onze Unie.'
    ),
    p('In deze categorie zijn er nog geen nieuwsberichten.'),
  ],

  // Volgorde van de oude pagina: eerst het logo, dan de menukaart.
  'baharkermesi-menu': [
    afbeelding(AFFICE, 'Logo van UCCIB'),
    afbeelding(MENUKAART, 'Menukaart van de Bahar Kermesi'),
  ],
};
