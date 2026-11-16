import { defineField, defineType } from 'sanity';
import { taalVeld, vertaalgroepVeld } from './objecten';

/**
 * Een regio (bölge) met haar afdelingen in een vaste volgorde.
 *
 * De regio bezit de volgorde: `afdelingen` is een geordende lijst verwijzingen.
 * `afdeling` heeft géén eigen regio-veld, dus een afdeling kan niet in twee
 * lijsten staan en de volgorde kan niet op twee plekken verschillen.
 */
export const regio = defineType({
  name: 'regio',
  title: 'Regio · Bölge',
  type: 'document',
  groups: [
    { name: 'inhoud', title: 'Inhoud · İçerik', default: true },
    { name: 'taal', title: 'Taal · Dil' },
  ],
  fields: [
    defineField({
      name: 'naam',
      title: 'Naam · Ad',
      type: 'string',
      group: 'inhoud',
      description: 'Bijvoorbeeld “Brussel”, “Antwerpen”, “Limburg”.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (adres) · Slug',
      type: 'slug',
      group: 'taal',
      options: { source: 'naam', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ ...taalVeld, group: 'taal' }),
    defineField({ ...vertaalgroepVeld, group: 'taal' }),
    defineField({
      name: 'omschrijving',
      title: 'Omschrijving · Açıklama',
      type: 'text',
      rows: 3,
      group: 'inhoud',
    }),
    defineField({
      name: 'afdelingen',
      title: 'Afdelingen, in deze volgorde · Şubeler, bu sırayla',
      type: 'array',
      group: 'inhoud',
      of: [{ type: 'reference', to: [{ type: 'afdeling' }] }],
      description:
        'Sleep de volgorde zoals ze op de site moet staan. Een afdeling hoort bij één regio.',
    }),
    defineField({
      name: 'volgorde',
      title: 'Volgorde van de regio · Bölge sırası',
      type: 'number',
      group: 'inhoud',
      description: 'Lager getal staat hoger in de lijst met regio’s.',
    }),
  ],
  orderings: [
    {
      title: 'Volgorde · Sıra',
      name: 'volgorde',
      by: [
        { field: 'volgorde', direction: 'asc' },
        { field: 'naam', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'naam', taal: 'taal', aantal: 'afdelingen.length' },
    prepare: ({ title, taal, aantal }) => ({
      title: title || '(zonder naam)',
      subtitle: [taal?.toUpperCase(), aantal ? `${aantal} afdeling(en)` : 'nog geen afdelingen']
        .filter(Boolean)
        .join(' · '),
    }),
  },
});
