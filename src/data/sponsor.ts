/**
 * De negen doneerknoppen en de betaallink die erachter zit.
 *
 * Eén bron voor de pagina én voor scripts/verify-sponsor.mjs: dat script leest
 * dezelfde bedragen en vergelijkt ze met wat Mollie op zijn scherm toont. Zo kan
 * een knop met het verkeerde bedrag er niet stil doorheen glippen.
 *
 * De bedragen en de link-id's zijn op 16 november 2026 met een echte browser op
 * elke betaallink gemeten: 5, 10, 25, 50, 100, 250, 500 en 1.000 euro. Niets
 * hier is geschat.
 */
import type { Locale } from '../i18n/config';

export const MOLLIE_BASE = 'https://payment-links.mollie.com/payment/';

export interface Doneerlink {
  readonly euro: number;
  readonly id: string;
}

/** De acht vaste bedragen, in oplopende volgorde. */
export const BEDRAGEN: readonly Doneerlink[] = [
  { euro: 5, id: '2dXLCiwCd2BerhRaawwXY' },
  { euro: 10, id: 'qzZr3eJc4Q9AKtj2gWvtZ' },
  { euro: 25, id: '7jQLY9LmoHdM7zVuTJkT9' },
  { euro: 50, id: '7Rko4nphmSTRBCzDXLepQ' },
  { euro: 100, id: 'pJzUpd7m3nA9e7ZQu37zT' },
  { euro: 250, id: 'oFkusZKDQZncSjD9Zjd2f' },
  { euro: 500, id: 'eAYeiSrFRf27DZcnJKni5' },
  { euro: 1000, id: 'FvxiwaRhqDa6N5Zw7Y2TU' },
] as const;

/**
 * De negende knop, "eigen bedrag".
 *
 * Er bestaat nog geen Mollie-link met een vrij bedrag: die maak je met
 * `POST https://api.mollie.com/v2/payment-links` en daar is de API-sleutel voor
 * nodig, die wij niet hebben. Tot die link er is, wijst deze knop naar het
 * dichtstbijzijnde vaste bedrag van 50 euro. Nooit naar 1.000 euro, want dat was
 * precies de fout op de oude site. De pagina zegt dat er ook bij.
 */
export const EIGEN_BEDRAG: Doneerlink = { euro: 50, id: '7Rko4nphmSTRBCzDXLepQ' };

/**
 * Duizendtallen met een punt in alle drie de talen, zodat het label en het bedrag
 * op het Mollie-scherm dezelfde cijfers tonen.
 */
const GETAL = new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 0 });

/** Het label op de knop, in de vorm die de taal gewoon is. */
export function bedragLabel(euro: number, locale: Locale): string {
  const getal = GETAL.format(euro);
  if (locale === 'tr') return `${getal}€`;
  if (locale === 'fr') return `${getal} €`;
  return `€ ${getal}`;
}

/**
 * De link naar Mollie, met de cookieloze herkomstparameters van plan §7.
 * `utm_campaign` draagt het bedrag, zodat de campagne in de statistiek per
 * bedrag te onderscheiden is.
 */
export function doneerUrl(euro: number, id: string): string {
  return `${MOLLIE_BASE}${id}?utm_source=uccib&utm_medium=doneer&utm_campaign=${euro}`;
}
