import { defineField, defineType } from 'sanity';
import { bodyVeld, seoVeld, slugVeld, taalVeld, vertaalgroepVeld } from './objecten';

export const pagina = defineType({
  name: 'pagina',
  title: 'Pagina · Sayfa',
  type: 'document',
  groups: [
    { name: 'inhoud', title: 'Inhoud · İçerik', default: true },
    { name: 'seo', title: 'Zoekmachine · Arama motoru' },
    { name: 'taal', title: 'Taal · Dil' },
  ],
  fields: [
    defineField({
      name: 'titel',
      title: 'Titel · Başlık',
      type: 'string',
      group: 'inhoud',
      description: 'De naam van de pagina in het menu en in de titelbalk van de browser.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'h1',
      title: 'Grote kop bovenaan · Sayfa başlığı',
      type: 'string',
      group: 'inhoud',
      description: 'De grote kop die bovenaan de pagina staat.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ ...slugVeld, group: 'taal' }),
    defineField({ ...taalVeld, group: 'taal' }),
    defineField({ ...vertaalgroepVeld, group: 'taal' }),
    defineField({
      name: 'intro',
      title: 'Inleiding · Giriş',
      type: 'text',
      rows: 4,
      group: 'inhoud',
      description: 'De alinea onder de grote kop. Kort houden: twee tot vier zinnen.',
    }),
    defineField({ ...bodyVeld, group: 'inhoud' }),
    defineField({
      name: 'volgorde',
      title: 'Volgorde · Sıra',
      type: 'number',
      group: 'inhoud',
      description: 'Lager getal staat hoger in een lijst. Leeg laten mag.',
    }),
    defineField({ ...seoVeld, group: 'seo' }),
  ],
  orderings: [
    {
      title: 'Volgorde · Sıra',
      name: 'volgorde',
      by: [
        { field: 'volgorde', direction: 'asc' },
        { field: 'titel', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'titel', subtitle: 'slug.current', taal: 'taal' },
    prepare: ({ title, subtitle, taal }) => ({
      title: title || '(geen titel)',
      subtitle: [taal?.toUpperCase(), subtitle ? `/${subtitle}` : ''].filter(Boolean).join(' · '),
    }),
  },
});
