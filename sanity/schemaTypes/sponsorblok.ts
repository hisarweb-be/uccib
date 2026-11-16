import { defineField, defineType } from 'sanity';

/**
 * Eén sponsortegel op `/bagislar/`: een vast bedrag en de betaallink die de
 * vzw al bij Mollie heeft. De voorzitter zet een tegel uit met `actief` in
 * plaats van hem te verwijderen, zodat de link en het bedrag bewaard blijven.
 *
 * Geen taalveld: een bedrag en een betaallink zijn in drie talen identiek. Wat
 * de bezoeker leest komt uit het vertaalwoordenboek, niet uit dit document.
 */
export const sponsorblok = defineType({
  name: 'sponsorblok',
  title: 'Sponsortegel · Bağış bloğu',
  type: 'document',
  fields: [
    defineField({
      name: 'bedrag',
      title: 'Bedrag in euro · Tutar (€)',
      type: 'number',
      description: 'Alleen het getal, bijvoorbeeld 25. Gebruik 0 voor de tegel “eigen bedrag”.',
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'label',
      title: 'Tekst op de knop · Düğme yazısı',
      type: 'string',
      description:
        'Optioneel. Laat leeg om het bedrag te tonen (“25 €”). Bij een eigen bedrag is dit de enige tekst.',
    }),
    defineField({
      name: 'link',
      title: 'Betaallink · Ödeme bağlantısı',
      type: 'url',
      description:
        'De Mollie-link van dit bedrag, volledig met https://. Nooit een sleutel, alleen de link die de bezoeker volgt.',
      validation: (Rule) => Rule.required().uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'volgorde',
      title: 'Volgorde · Sıra',
      type: 'number',
      description: 'Lager getal staat eerder. Leeg laten mag.',
    }),
    defineField({
      name: 'actief',
      title: 'Tonen op de site · Sitede göster',
      type: 'boolean',
      initialValue: true,
      description: 'Uitvinken verbergt de tegel zonder het bedrag of de link te wissen.',
    }),
  ],
  orderings: [
    {
      title: 'Volgorde · Sıra',
      name: 'volgorde',
      by: [
        { field: 'volgorde', direction: 'asc' },
        { field: 'bedrag', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { bedrag: 'bedrag', label: 'label', actief: 'actief' },
    prepare: ({ bedrag, label, actief }) => ({
      title: label || (typeof bedrag === 'number' ? `${bedrag} €` : '(zonder bedrag)'),
      subtitle: actief === false ? 'niet zichtbaar op de site' : undefined,
    }),
  },
});
