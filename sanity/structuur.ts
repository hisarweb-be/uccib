import type { StructureBuilder, StructureResolver } from 'sanity/structure';

/**
 * Let op de bestandsnaam: `structuur.ts`, niet `structure.ts`.
 *
 * Een bestand `sanity/structure.ts` naast `node_modules/sanity` laat TypeScript
 * `sanity/structure` als zichzelf oplossen zodra het project de map `sanity/`
 * meecompileert; dan geeft `tsc` "Circular definition of import alias". Met een
 * eigen naam kan die botsing niet ontstaan. Niet terughernoemen.
 */

/**
 * De lijst die de voorzitter ziet. Zes onderdelen, in de volgorde waarin ze op
 * de site staan, plus Instellingen als vast onderdeel onderaan.
 *
 * Per onderdeel staan de drie talen als sublijst, zodat ze nooit door elkaar
 * staan: Turks eerst (dat is de hoofdtaal), dan Nederlands, dan Frans. De
 * scheiding gaat op het veld `taal`, dus ze hoeft nooit een filter te typen.
 */

const TALEN = [
  { id: 'tr', title: 'Türkçe' },
  { id: 'nl', title: 'Nederlands' },
  { id: 'fr', title: 'Français' },
] as const;

/** Eén onderdeel met per taal een sublijst. */
function perTaal(
  S: StructureBuilder,
  type: string,
  titel: string,
  opties: { sortering?: string } = {},
) {
  return S.listItem()
    .id(type)
    .title(titel)
    .child(
      S.list()
        .id(`${type}-talen`)
        .title(titel)
        .items(
          TALEN.map((taal) =>
            S.listItem()
              .id(`${type}-${taal.id}`)
              .title(taal.title)
              .child(
                S.documentTypeList(type)
                  .id(`${type}-${taal.id}-lijst`)
                  .title(`${titel} · ${taal.title}`)
                  .filter('_type == $type && taal == $taal')
                  .params({ type, taal: taal.id })
                  .defaultOrdering(
                    opties.sortering
                      ? [{ field: opties.sortering, direction: 'asc' }]
                      : [{ field: '_createdAt', direction: 'desc' }],
                  ),
              ),
          ),
        ),
    );
}

export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('Inhoud · İçerik')
    .items([
      perTaal(S, 'pagina', "Pagina's · Sayfalar", { sortering: 'volgorde' }),
      perTaal(S, 'nieuwsbericht', 'Nieuws · Haberler'),
      perTaal(S, 'afdeling', 'Afdelingen · Şubeler', { sortering: 'volgorde' }),
      perTaal(S, 'regio', "Regio's · Bölgeler", { sortering: 'volgorde' }),
      // Gebedstijden hebben geen taal: een datum en een uur zijn in elke taal gelijk.
      S.listItem()
        .id('gebedstijd')
        .title('Gebedstijden · Namaz vakitleri')
        .child(S.documentTypeList('gebedstijd').title('Gebedstijden · Namaz vakitleri')),
      perTaal(S, 'preek', 'Preken · Hutbeler'),
      // Sponsortegels hebben geen taal: een bedrag en een betaallink zijn overal gelijk.
      S.listItem()
        .id('sponsorblok')
        .title('Sponsoring · Bağış')
        .child(S.documentTypeList('sponsorblok').title('Sponsoring · Bağış')),
      S.divider(),
      // Instellingen: precies één document, nooit een lijst met twee versies.
      S.listItem()
        .id('instellingen')
        .title('Instellingen · Ayarlar')
        .child(S.document().id('instellingen').schemaType('instellingen').documentId('instellingen')),
    ]);
