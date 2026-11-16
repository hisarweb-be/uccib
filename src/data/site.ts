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
  logo: '/brand/uccib-logo.png',
  logoWidth: 1600,
  logoHeight: 503,
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
