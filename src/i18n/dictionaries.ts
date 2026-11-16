import type { Locale } from './config';
import tr from './tr.json';
import nl from './nl.json';
import fr from './fr.json';

/** Eén woordenboek heeft de vorm van het Turkse bestand; `lang` blijft een gewone string. */
export type Dictionary = Omit<typeof tr, 'lang'> & { lang: string };

const DICTIONARIES: Record<Locale, Dictionary> = {
  tr,
  nl: nl as Dictionary,
  fr: fr as Dictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
