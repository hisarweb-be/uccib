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
 * F3 heeft de acht pagina's die hier stonden gevuld en eruit gehaald; die staan
 * nu in de navigatie, de sitemap en de keuring. Wat overblijft zijn de twee
 * pagina's van F5: het doneerformulier en het bedankscherm erna.
 *
 * Zolang ze leeg zijn, staan ze niet in de navigatie en antwoorden ze met een
 * rustige mededeling plus noindex, zodat een bezoeker nooit een lege pagina
 * ziet en een zoekmachine de pagina laat vallen. De route blijft bestaan, zodat
 * een inkomende link geen 404 wordt. (Een echt 410 kan niet: Cloudflare Pages
 * kent in _redirects alleen 301, 302, 303, 307, 308 en 200.)
 */
export const CONCEPT_SLUGS = ['bagislar', 'bagis-onayi'] as const;

export type ConceptSlug = (typeof CONCEPT_SLUGS)[number];

/** De pagina's die nu echt bestaan: veertien min de twee concepten van F5. */
export type ActiveSlug = Exclude<Slug, ConceptSlug>;

export const ACTIVE_SLUGS: readonly ActiveSlug[] = SLUGS.filter(
  (slug): slug is ActiveSlug => !(CONCEPT_SLUGS as readonly string[]).includes(slug),
);

export function isActiveSlug(slug: Slug): slug is ActiveSlug {
  return (ACTIVE_SLUGS as readonly string[]).includes(slug);
}
