import { defineField, defineType } from 'sanity';
import { adresVeld, openingstijdenVeld, taalVeld, vertaalgroepVeld } from './objecten';

/**
 * Een afdeling (şube): een lokaal centrum van de vzw.
 *
 * Bewust GEEN `regio`-veld: de regio bezit de volgorde (zie `regio.ts`). Eén
 * bron voor de indeling, geen dubbel onderhoud dat uit elkaar kan lopen.
 */
export const afdeling = defineType({
  name: 'afdeling',
  title: 'Afdeling · Şube',
  type: 'document',
  groups: [
    { name: 'inhoud', title: 'Inhoud · İçerik', default: true },
    { name: 'contact', title: 'Contact · İletişim' },
    { name: 'taal', title: 'Taal · Dil' },
  ],
  fields: [
    defineField({
      name: 'naam',
      title: 'Naam · Ad',
      type: 'string',
      group: 'inhoud',
      description: 'De naam van het centrum, bijvoorbeeld “UCCIB Brussel”.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (adres) · Slug',
      type: 'slug',
      group: 'taal',
      description: 'Het stukje van het webadres. Laat staan zodra het bestaat.',
      options: { source: 'naam', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ ...taalVeld, group: 'taal' }),
    defineField({ ...vertaalgroepVeld, group: 'taal' }),
    defineField({
      name: 'omschrijving',
      title: 'Korte omschrijving · Kısa açıklama',
      type: 'text',
      rows: 4,
      group: 'inhoud',
      description: 'Twee tot vier zinnen over dit centrum.',
    }),
    defineField({
      name: 'foto',
      title: 'Foto · Fotoğraf',
      type: 'image',
      group: 'inhoud',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-tekst · Alternatif metin',
          type: 'string',
          description: 'Wat er op de foto te zien is, in één zin. Verplicht.',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({ ...adresVeld, group: 'contact' }),
    defineField({
      name: 'telefoon',
      title: 'Telefoon · Telefon',
      type: 'string',
      group: 'contact',
      description: 'Met landcode, bijvoorbeeld +32 493 344 665.',
    }),
    defineField({
      name: 'email',
      title: 'E-mail · E-posta',
      type: 'string',
      group: 'contact',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'coordinaat',
      title: 'Kaartcoördinaten · Harita koordinatı',
      type: 'geopoint',
      group: 'contact',
      description: 'Sleep de speld op de kaart, of typ de breedte- en lengtegraad.',
    }),
    defineField({ ...openingstijdenVeld, group: 'contact' }),
    defineField({
      name: 'volgorde',
      title: 'Volgorde · Sıra',
      type: 'number',
      group: 'inhoud',
      description: 'Lager getal staat hoger. Leeg laten mag; dan geldt de naam.',
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
    select: { title: 'naam', gemeente: 'adres.gemeente', taal: 'taal', media: 'foto' },
    prepare: ({ title, gemeente, taal, media }) => ({
      title: title || '(zonder naam)',
      subtitle: [taal?.toUpperCase(), gemeente].filter(Boolean).join(' · '),
      media,
    }),
  },
});
