/**
 * Vaste gegevens van de organisatie. Eén bron voor header, footer, contactpagina
 * en de schema.org-gegevens. Wijzigt UCCIB iets, dan wijzigt het hier.
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
 * Welke pagina's aan of uit staan, staat sinds 17-11 niet meer hier. De schakelaar
 * is de front-matter van `src/content/paginas/tr/<slug>.md` (`active: false`), zodat
 * dhr. Omer hem in Sveltia CMS kan omzetten zonder code. Zie `src/lib/actief.ts`.
 */
