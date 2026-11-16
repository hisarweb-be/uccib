import { defineField, defineType } from 'sanity';
import { bodyVeld, slugVeld, taalVeld, vertaalgroepVeld } from './objecten';

export const CATEGORIEEN = [
  { title: 'Güncel · Actualiteit', value: 'guncel' },
  { title: 'Basın bildirisi · Persbericht', value: 'basin-bildirisi' },
  { title: 'Blog · Blog', value: 'blog' },
] as const;

export const nieuwsbericht = defineType({
  name: 'nieuwsbericht',
  title: 'Nieuwsbericht · Haber',
  type: 'document',
  groups: [
    { name: 'inhoud', title: 'Inhoud · İçerik', default: true },
    { name: 'taal', title: 'Taal · Dil' },
  ],
  fields: [
    defineField({
      name: 'titel',
      title: 'Titel · Başlık',
      type: 'string',
      group: 'inhoud',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'datum',
      title: 'Datum · Tarih',
      type: 'date',
      group: 'inhoud',
      options: { dateFormat: 'DD-MM-YYYY' },
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'samenvatting',
      title: 'Samenvatting · Özet',
      type: 'text',
      rows: 3,
      group: 'inhoud',
      description: 'Twee zinnen voor de lijst met berichten. Maximaal 200 tekens.',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'categorie',
      title: 'Categorie · Kategori',
      type: 'string',
      group: 'inhoud',
      options: { list: [...CATEGORIEEN], layout: 'radio' },
      initialValue: 'guncel',
    }),
    defineField({
      name: 'auteur',
      title: 'Auteur · Yazar',
      type: 'string',
      group: 'inhoud',
      initialValue: 'UCCIB',
    }),
    defineField({
      name: 'omslagbeeld',
      title: 'Omslagbeeld · Kapak görseli',
      type: 'image',
      group: 'inhoud',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-tekst · Alternatif metin',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({ ...bodyVeld, group: 'inhoud' }),
    defineField({ ...slugVeld, group: 'taal' }),
    defineField({ ...taalVeld, group: 'taal' }),
    defineField({ ...vertaalgroepVeld, group: 'taal' }),
  ],
  orderings: [
    {
      title: 'Nieuwste eerst · En yeni',
      name: 'datumAflopend',
      by: [{ field: 'datum', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'titel', datum: 'datum', taal: 'taal', media: 'omslagbeeld' },
    prepare: ({ title, datum, taal, media }) => ({
      title: title || '(zonder titel)',
      subtitle: [datum, taal?.toUpperCase()].filter(Boolean).join(' · '),
      media,
    }),
  },
});
