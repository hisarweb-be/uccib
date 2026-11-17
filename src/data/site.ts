/**
 * Vaste gegevens van de organisatie. Eén bron voor header, footer, contactpagina
 * en de schema.org-gegevens. Wijzigt de vzw iets, dan wijzigt ze het hier.
 */
export const SITE = {
  url: 'https://uccib.com',
  founded: '1979',
  phone: '+32 493 344 665',
  phoneHref: '+32493344665',
  email: 'info@uccib.com',
  whatsapp: '+32493344665',
  street: 'Rue Charles Demeer 3',
  postalCode: '1020',
  city: 'Brussel',
  country: 'BE',
  geo: { lat: 50.8676, lng: 4.3529 },
  /** Terugvalbeeld van het logo: de kleinste WebP uit de F1-set, 560x176, 21,7 kB in plaats van 203 kB. */
  logo: '/beeld/logo/uccib-woordmerk/560.webp',
  logoWidth: 560,
  logoHeight: 176,
  themeColor: '#0f6b66',
  openingHours: 'ma-vr 09:00-17:00',
} as const;

/** De veertien slugs uit plan §8. Leeg = de hoofdpagina. */
export const SLUGS = [
  '',
  'hakkimizda',
  'hizmetlerimiz',
  'haberler',
  'iletisim',
  'bagislar',
  'bagis-onayi',
  'subelerimiz',
  'bolge-derneklerimiz',
  'namaz-vakitleri',
  'cuma-hutbesi',
  'disclameer',
  'cerez-politikasi-cookie-policy',
  'baharkermesi-menu',
] as const;

export type Slug = (typeof SLUGS)[number];

/**
 * Pagina's die tijdelijk geen eigen inhoud hebben.
 *
 * Deze lijst is de enige schakelaar. Wat erin staat krijgt noindex, komt niet in
 * de navigatie en niet in de sitemap, en wordt door de keuring als concept
 * gekeurd in plaats van als pagina met inhoud.
 *
 * Sinds F3 hebben alle veertien pagina's eigen inhoud, dus de lijst is leeg. Hij
 * blijft bestaan omdat de sitemap, de navigatie en de keuring erop leunen: komt
 * er ooit een pagina bij die nog gevuld moet worden, dan is één regel hier
 * genoeg om hem netjes te verbergen.
 *
 * De geschiedenis is dezelfde regel in omgekeerde beweging: tien slugs bij F1,
 * acht nadat F5 `bagislar` en `bagis-onayi` vulde, en nu nul.
 */
export const CONCEPT_SLUGS = [] as const;

export type ConceptSlug = (typeof CONCEPT_SLUGS)[number];

/** De pagina's die nu echt bestaan: alle veertien, er is geen concept meer. */
export type ActiveSlug = Exclude<Slug, ConceptSlug>;

export const ACTIVE_SLUGS: readonly ActiveSlug[] = SLUGS.filter(
  (slug): slug is ActiveSlug => !(CONCEPT_SLUGS as readonly string[]).includes(slug),
);

export function isActiveSlug(slug: Slug): slug is ActiveSlug {
  return (ACTIVE_SLUGS as readonly string[]).includes(slug);
}
