import { defineField, defineType } from 'sanity';

/**
 * Instellingen: één document voor de hele site (singleton).
 *
 * Alles wat de voorzitter één keer invult en overal terugkomt. De `_id` is vast
 * (`instellingen`), zodat er nooit twee versies kunnen bestaan.
 *
 * Geen persoonsgegevens: dit is een openbare dataset (plan §4). Alleen wat
 * toch al op de site staat.
 */
export const instellingen = defineType({
  name: 'instellingen',
  title: 'Instellingen · Ayarlar',
  type: 'document',
  groups: [
    { name: 'algemeen', title: 'Algemeen · Genel', default: true },
    { name: 'contact', title: 'Contact · İletişim' },
    { name: 'sociaal', title: 'Sociale media · Sosyal medya' },
    { name: 'melding', title: 'Melding bovenaan · Duyuru' },
  ],
  fields: [
    defineField({
      name: 'sitenaam',
      title: 'Naam van de site · Site adı',
      type: 'string',
      group: 'algemeen',
      initialValue: 'UCCIB',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'volledigeNaam',
      title: 'Volledige naam · Tam adım',
      type: 'string',
      group: 'algemeen',
      initialValue: 'Union des Centres Culturels Islamiques Belgium',
    }),
    defineField({
      name: 'slagzin',
      title: 'Slagzin · Slogan',
      type: 'string',
      group: 'algemeen',
      description: 'De regel onder de naam, bijvoorbeeld “Belçika İslam Kültür Merkezleri Birliği Vakfı”.',
    }),
    defineField({
      name: 'logo',
      title: 'Logo · Logo',
      type: 'image',
      group: 'algemeen',
      options: { hotspot: false },
      description:
        'Laat leeg om het vaste logo van de site te gebruiken. Vervangen kan, maar vraag eerst of de verhoudingen kloppen.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-tekst · Alternatif metin',
          type: 'string',
          description: 'Bijvoorbeeld “Logo van UCCIB”.',
        }),
      ],
    }),
    defineField({
      name: 'adres',
      title: 'Adres · Adres',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({ name: 'straat', title: 'Straat · Sokak', type: 'string' }),
        defineField({ name: 'postcode', title: 'Postcode · Posta kodu', type: 'string' }),
        defineField({ name: 'gemeente', title: 'Gemeente · Şehir', type: 'string' }),
        defineField({ name: 'land', title: 'Land · Ülke', type: 'string', initialValue: 'BE' }),
      ],
    }),
    defineField({
      name: 'telefoon',
      title: 'Telefoon · Telefon',
      type: 'string',
      group: 'contact',
      description: 'Zoals het op de site moet staan, bijvoorbeeld +32 493 344 665.',
    }),
    defineField({
      name: 'email',
      title: 'E-mail · E-posta',
      type: 'string',
      group: 'contact',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'btw',
      title: 'Ondernemingsnummer · Vergi numarası',
      type: 'string',
      group: 'contact',
      description: 'Bijvoorbeeld BE 0843.891.981. Staat in de juridische teksten.',
    }),
    defineField({
      name: 'socials',
      title: 'Sociale media · Sosyal medya',
      type: 'array',
      group: 'sociaal',
      of: [
        {
          type: 'object',
          name: 'sociallink',
          title: 'Kanaal',
          fields: [
            defineField({
              name: 'kanaal',
              title: 'Kanaal · Kanal',
              type: 'string',
              options: {
                list: [
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'YouTube', value: 'youtube' },
                  { title: 'X (Twitter)', value: 'x' },
                  { title: 'WhatsApp', value: 'whatsapp' },
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'Adres · Adres',
              type: 'url',
              validation: (Rule) => Rule.required().uri({ scheme: ['https'] }),
            }),
          ],
          preview: {
            select: { kanaal: 'kanaal', url: 'url' },
            prepare: ({ kanaal, url }) => ({ title: kanaal || '(kanaal)', subtitle: url }),
          },
        },
      ],
    }),
    defineField({
      name: 'noodtekst',
      title: 'Melding bovenaan de site · Üst duyuru',
      type: 'object',
      group: 'melding',
      description: 'Een brede balk boven alle pagina’s. Laat leeg of zet hem uit als er niets te melden is.',
      fields: [
        defineField({
          name: 'aan',
          title: 'Melding tonen · Duyuruyu göster',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'tekst',
          title: 'Tekst in het Turks · Türkçe metin',
          type: 'string',
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'tekstNl',
          title: 'Tekst in het Nederlands · Hollandaca metin',
          type: 'string',
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'tekstFr',
          title: 'Tekst in het Frans · Fransızca metin',
          type: 'string',
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'link',
          title: 'Link achter de melding · Bağlantı',
          type: 'url',
          validation: (Rule) => Rule.uri({ allowRelative: true, scheme: ['https'] }),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'sitenaam' },
    prepare: ({ title }) => ({ title: title ? `Instellingen · ${title}` : 'Instellingen' }),
  },
});
