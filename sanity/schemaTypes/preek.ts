import { defineField, defineType } from 'sanity';
import { bodyVeld, taalVeld, vertaalgroepVeld } from './objecten';

/**
 * Een vrijdagpreek (hutbe): één per week, in de taal waarin ze is uitgesproken.
 * De pdf is het blaadje dat in de moskee ligt; de tekst staat hier zodat de
 * preek ook leesbaar en vindbaar is zonder de pdf te openen.
 */
export const preek = defineType({
  name: 'preek',
  title: 'Preek · Hutbe',
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
      title: 'Datum van de vrijdag · Cuma tarihi',
      type: 'date',
      group: 'inhoud',
      options: { dateFormat: 'DD-MM-YYYY' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (adres) · Slug',
      type: 'slug',
      group: 'taal',
      options: { source: 'titel', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ ...taalVeld, group: 'taal' }),
    defineField({ ...vertaalgroepVeld, group: 'taal' }),
    defineField({ ...bodyVeld, group: 'inhoud' }),
    defineField({
      name: 'pdf',
      title: 'Pdf om af te drukken · Yazdırılacak PDF',
      type: 'file',
      group: 'inhoud',
      options: { accept: 'application/pdf' },
    }),
  ],
  orderings: [
    {
      title: 'Nieuwste eerst · En yeni',
      name: 'datumAflopend',
      by: [{ field: 'datum', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'titel', datum: 'datum', taal: 'taal' },
    prepare: ({ title, datum, taal }) => ({
      title: title || '(zonder titel)',
      subtitle: [datum, taal?.toUpperCase()].filter(Boolean).join(' · '),
    }),
  },
});
