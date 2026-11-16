import { defineField } from 'sanity';

/**
 * Gedeelde velden en objecten. De labels zijn Turks met het Nederlandse woord
 * ernaast: de voorzitter leest Turks, wij lezen Nederlands. Eén label, twee
 * lezers, geen plugin die dat per gebruiker zou moeten omzetten.
 */

export const TAAL_OPTIES = [
  { title: 'Türkçe (TR)', value: 'tr' },
  { title: 'Nederlands (NL)', value: 'nl' },
  { title: 'Français (FR)', value: 'fr' },
] as const;

export const taalVeld = defineField({
  name: 'taal',
  title: 'Taal · Taal',
  type: 'string',
  options: { list: [...TAAL_OPTIES], layout: 'radio' },
  initialValue: 'tr',
  validation: (Rule) => Rule.required(),
});

/** Koppelt de drie taalversies van hetzelfde onderdeel aan elkaar. */
export const vertaalgroepVeld = defineField({
  name: 'vertaalgroep',
  title: 'Vertaalgroep · Vertaalgroep',
  type: 'string',
  description: 'Automatisch gevuld: de slug zonder taal. Nooit zelf wijzigen.',
  readOnly: true,
  hidden: true,
});

export const slugVeld = defineField({
  name: 'slug',
  title: 'Slug (adres) · Slug',
  type: 'slug',
  description:
    'Het stukje van het webadres. Laat dit staan zoals het is: bestaande links en QR-codes verwijzen ernaar.',
  options: { source: 'titel', maxLength: 96 },
  validation: (Rule) => Rule.required(),
});

/** Portable text met kop, lijst, link, citaat en beeld. */
export const bodyVeld = defineField({
  name: 'body',
  title: 'Tekst · Tekst',
  type: 'array',
  of: [
    {
      type: 'block',
      title: 'Alinea',
      styles: [
        { title: 'Alinea', value: 'normal' },
        { title: 'Kop 2', value: 'h2' },
        { title: 'Kop 3', value: 'h3' },
        { title: 'Citaat', value: 'blockquote' },
      ],
      lists: [
        { title: 'Opsomming', value: 'bullet' },
        { title: 'Genummerd', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Vet', value: 'strong' },
          { title: 'Cursief', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              defineField({
                name: 'href',
                title: 'Adres · Adres',
                type: 'url',
                validation: (Rule) =>
                  Rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
              }),
            ],
          },
        ],
      },
    },
    {
      type: 'image',
      title: 'Beeld',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-tekst · Alternatif metin',
          type: 'string',
          description: 'Wat er op de foto te zien is, in één zin. Verplicht, ook voor de zoekmachine.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({ name: 'onderschrift', title: 'Onderschrift · Altyazı', type: 'string' }),
      ],
    },
  ],
});

export const seoVeld = defineField({
  name: 'seo',
  title: 'Zoekmachine · Arama motoru',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'titel',
      title: 'Titel in Google · Google başlığı',
      type: 'string',
      description: 'Laat leeg om de titel van de pagina te gebruiken. Maximaal 60 tekens.',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'beschrijving',
      title: 'Beschrijving · Açıklama',
      type: 'text',
      rows: 3,
      description: 'Eén of twee zinnen die in Google onder de titel staan. Maximaal 160 tekens.',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'ogBeeld',
      title: 'Deelbeeld · Paylaşım görseli',
      type: 'image',
      options: { hotspot: true },
      description: 'Het beeld dat verschijnt als iemand de pagina deelt. 1200 bij 630 pixels.',
    }),
  ],
});

export const adresVeld = defineField({
  name: 'adres',
  title: 'Adres · Adres',
  type: 'object',
  fields: [
    defineField({ name: 'straat', title: 'Straat · Sokak', type: 'string' }),
    defineField({ name: 'postcode', title: 'Postcode · Posta kodu', type: 'string' }),
    defineField({ name: 'gemeente', title: 'Gemeente · Şehir', type: 'string' }),
    defineField({ name: 'land', title: 'Land · Ülke', type: 'string', initialValue: 'BE' }),
  ],
});

export const coordinatenVeld = defineField({
  name: 'coordinaat',
  title: 'Kaartcoördinaten · Harita koordinatı',
  type: 'geopoint',
  description: 'Sleep de speld op de kaart, of typ de breedte- en lengtegraad.',
});

export const openingstijdenVeld = defineField({
  name: 'openingstijden',
  title: 'Openingsuren · Açılış saatleri',
  type: 'array',
  of: [
    {
      type: 'object',
      name: 'openingsblok',
      title: 'Periode',
      fields: [
        defineField({
          name: 'dagen',
          title: 'Dagen · Günler',
          type: 'string',
          description: 'Bijvoorbeeld: maandag tot vrijdag',
        }),
        defineField({ name: 'van', title: 'Van · Başlangıç', type: 'string', description: 'Bijvoorbeeld 09:00' }),
        defineField({ name: 'tot', title: 'Tot · Bitiş', type: 'string', description: 'Bijvoorbeeld 17:00' }),
      ],
      preview: {
        select: { dagen: 'dagen', van: 'van', tot: 'tot' },
        prepare: ({ dagen, van, tot }) => ({ title: [dagen, van && tot ? `${van}–${tot}` : ''].filter(Boolean).join(' · ') }),
      },
    },
  ],
});
