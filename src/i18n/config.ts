import { SLUGS, type Slug } from '../data/site';

export const LOCALES = ['tr', 'nl', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'tr';

/** Naam van de taal in die taal zelf, voor de taalkiezer. */
export const LOCALE_LABELS: Record<Locale, { native: string; short: string }> = {
  tr: { native: 'Türkçe', short: 'TR' },
  nl: { native: 'Nederlands', short: 'NL' },
  fr: { native: 'Français', short: 'FR' },
};

/** `<html lang>` en de waarde voor og:locale. */
export const LOCALE_TAGS: Record<Locale, { html: string; og: string }> = {
  tr: { html: 'tr-BE', og: 'tr_BE' },
  nl: { html: 'nl-BE', og: 'nl_BE' },
  fr: { html: 'fr-BE', og: 'fr_BE' },
};

export const ALL_SLUGS: readonly Slug[] = SLUGS;

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isSlug(value: string): value is Slug {
  return (SLUGS as readonly string[]).includes(value);
}

/**
 * Pad voor één pagina in één taal. De slugs blijven in alle drie de talen
 * exact gelijk, zodat bestaande links en QR-codes blijven werken.
 *   tr  /hakkimizda/        nl  /nl/hakkimizda/        fr  /fr/hakkimizda/
 * De hoofdpagina is de uitzondering: /  /nl/  /fr/
 */
export function pagePath(locale: Locale, slug: Slug): string {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return slug === '' ? `${prefix}/` : `${prefix}/${slug}/`;
}

/**
 * Pad van de gebedstijden van één stad. De stad staat in het pad en niet in een
 * queryparameter, zodat een gedeelde link de juiste plaats meeneemt, de pagina
 * een eigen titel en canonical heeft en een zoekmachine hem kan vinden:
 *   tr  /namaz-vakitleri/gent/   nl  /nl/namaz-vakitleri/gent/   fr  /fr/...
 * Brussel houdt bewust géén eigen adres: dat is de stad van de hoofdpagina
 * `/namaz-vakitleri/` zelf, en twee adressen voor dezelfde inhoud is precies de
 * dubbele inhoud die we nergens willen.
 */
export function stadPath(locale: Locale, stad: string): string {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return `${prefix}/namaz-vakitleri/${stad}/`;
}
