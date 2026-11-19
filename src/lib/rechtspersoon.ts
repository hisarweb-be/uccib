/**
 * De rechtspersoon achter de site, alleen zoals de KBO hem toont
 * (bewijs: herontwerp/bewijs-f3/kbo.txt, register op 17/11/2026):
 * naam, afkorting, rechtsvorm, zetel en ondernemingsnummer.
 *
 * Bron is src/data/rechtspersoon.json, los van src/data/kerngegevens.json: dat
 * laatste is het CMS-blad voor uren en coördinaten en begint leeg (F3-PLAN A6),
 * en de startpagina leest er nog de oude velden kbo en rechtsvorm uit. Het register geeft de rechtsvorm en het
 * zeteladres in het Nederlands en het Frans; het Turks krijgt de Nederlandse
 * term met een vertaling tussen haakjes (f3.ts `rechtsvormUitleg`), want een
 * Turkse rechtsvorm bestaat in het register niet.
 *
 * Het zeteladres (KBO) en het bezoekadres (site.ts) verschillen; wie ze toont,
 * labelt ze apart. Een leeg veld geeft null: dan toont niemand het.
 */
import kern from '../data/rechtspersoon.json';
import { f3 } from '../i18n/f3';
import type { Locale } from '../i18n';

export interface Rechtspersoon {
  naam: string | null;
  afkorting: string | null;
  rechtsvorm: string | null;
  zetel: string | null;
  kbo: string | null;
}

const tekst = (w: unknown): string | null => (typeof w === 'string' && w.trim() !== '' ? w.trim() : null);

export function rechtspersoon(locale: Locale): Rechtspersoon {
  const fr = locale === 'fr';
  const vorm = tekst(fr ? kern.rechtsvormFr : kern.rechtsvorm);
  const uitleg = tekst(f3(locale).rechtsvormUitleg);
  return {
    naam: tekst(kern.naam),
    afkorting: tekst(kern.afkorting),
    rechtsvorm: vorm && uitleg ? `${vorm} (${uitleg})` : vorm,
    zetel: tekst(fr ? kern.zetelFr : kern.zetel),
    kbo: tekst(kern.kbo),
  };
}
