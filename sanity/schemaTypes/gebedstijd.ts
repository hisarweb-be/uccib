import { defineField, defineType } from 'sanity';

/**
 * De gebedstijden van één dag op één plaats.
 *
 * Zes tijden, niet vijf: `imsak` en `gunes` zijn de twee grenzen vóór de eerste
 * verplichte salat, en de Turkse tabel die de vzw vandaag gebruikt heeft die
 * twee kolommen ook. Wie ze weglaat, kan de imsak (begin van het vasten) niet
 * tonen. Daarom staan hier alle zes: imsak, güneş, öğle, ikindi, akşam, yatsı.
 *
 * Geen taalveld: tijden en datums zijn in elke taal hetzelfde.
 */
export const gebedstijd = defineType({
  name: 'gebedstijd',
  title: 'Gebedstijden · Namaz vakitleri',
  type: 'document',
  fields: [
    defineField({
      name: 'datum',
      title: 'Datum · Tarih',
      type: 'date',
      options: { dateFormat: 'DD-MM-YYYY' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'plaats',
      title: 'Plaats · Şehir',
      type: 'string',
      initialValue: 'Brussel',
      description: 'De stad waar deze tijden voor gelden. Eén document per stad per dag.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'imsak',
      title: 'İmsak (begin van het vasten) · İmsak',
      type: 'string',
      description: 'UU:MM, bijvoorbeeld 06:41.',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: 'tijd' }),
    }),
    defineField({
      name: 'gunes',
      title: 'Güneş (zonsopgang) · Güneş',
      type: 'string',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: 'tijd' }),
    }),
    defineField({
      name: 'ogle',
      title: 'Öğle (middag) · Öğle',
      type: 'string',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: 'tijd' }),
    }),
    defineField({
      name: 'ikindi',
      title: 'İkindi (namiddag) · İkindi',
      type: 'string',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: 'tijd' }),
    }),
    defineField({
      name: 'aksam',
      title: 'Akşam (zonsondergang) · Akşam',
      type: 'string',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: 'tijd' }),
    }),
    defineField({
      name: 'yatsi',
      title: 'Yatsı (nacht) · Yatsı',
      type: 'string',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: 'tijd' }),
    }),
    defineField({
      name: 'methode',
      title: 'Berekeningsmethode · Hesap yöntemi',
      type: 'string',
      description:
        'Welke methode of bron deze tijden heeft bepaald, bijvoorbeeld “Diyanet” of “MWL”. Noteer het, zodat een verschil later te verklaren is.',
    }),
    defineField({
      name: 'bron',
      title: 'Bron · Kaynak',
      type: 'url',
      description: 'Optioneel: de pagina waar de tijden vandaan komen.',
    }),
  ],
  orderings: [
    {
      title: 'Datum, oud naar nieuw · Tarih',
      name: 'datumOplopend',
      by: [
        { field: 'datum', direction: 'asc' },
        { field: 'plaats', direction: 'asc' },
      ],
    },
    {
      title: 'Datum, nieuw naar oud · Tarih (yeni)',
      name: 'datumAflopend',
      by: [{ field: 'datum', direction: 'desc' }],
    },
  ],
  preview: {
    select: { datum: 'datum', plaats: 'plaats', ogle: 'ogle', aksam: 'aksam' },
    prepare: ({ datum, plaats, ogle, aksam }) => ({
      title: [datum, plaats].filter(Boolean).join(' · ') || '(zonder datum)',
      subtitle: ogle && aksam ? `Öğle ${ogle} · Akşam ${aksam}` : undefined,
    }),
  },
});
