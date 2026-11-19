/**
 * De gebedstijden levend maken (eigenaar 19 nov: "meer interactief en dynamisch").
 *
 * Drie dingen, in deze volgorde:
 *   1. de klok telt af naar de eerstvolgende tijd, elke seconde, zonder verzoeken:
 *      de tijden komen één keer per paginaophaling binnen;
 *   2. de tijden worden vers opgehaald bij `/api/vakitler?stad=<stad>`; lukt dat
 *      niet, dan blijven de tijden van de bouw staan (`src/data/vakitler.json`).
 *      Er komt dus nooit een lege tabel en nooit een foutmelding in beeld;
 *   3. op de gebedstijdenpagina's kiest de lezer een andere stad; de pagina gaat
 *      dan naar het adres van die stad (`/namaz-vakitleri/<stad>/`) in plaats van
 *      de tabel stilletjes te verwisselen. Zo is wat de lezer ziet altijd wat de
 *      link in zijn adresbalk zegt, en is een gedeelde link de juiste stad. Die
 *      keuze wordt bovendien onthouden (`localStorage`), zodat wie de volgende keer
 *      terugkomt op `/namaz-vakitleri/` zijn eigen stad ziet.
 *
 * Waarom geen aftel-loop met een verzoek per seconde: dat zou 86.400 verzoeken
 * per bezoeker per dag zijn. De tijden zijn genoeg voor de hele dag; alleen de
 * klok hoeft te lopen, en die rekent de browser zelf uit.
 *
 * Zonder JavaScript staat alles er al: dit script verbergt niets en voegt alleen
 * scherpte toe.
 */

/** De zes tijden in de volgorde van de dag. */
const TIJDEN = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;

type Dag = { datum: string; tijden: Record<string, string> };
type Antwoord = { success?: boolean; stad?: string; dagen?: Dag[] };

/** Namen per taal, dezelfde als in `src/lib/vakitler.ts`. */
const NAMEN: Record<string, Record<string, string>> = {
  tr: { imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı' },
  nl: { imsak: 'Imsak', gunes: 'Zonsopgang', ogle: 'Middag', ikindi: 'Namiddag', aksam: 'Avond', yatsi: 'Nacht' },
  fr: { imsak: 'Imsak', gunes: 'Lever du soleil', ogle: 'Midi', ikindi: 'Après-midi', aksam: 'Soir', yatsi: 'Nuit' },
};

const GEKOZEN_STAD = 'uccib:vakit:stad';
const TIJDZONE = 'Europe/Brussels';

const zetTekst = (element: Element | null, waarde: string): void => {
  if (element && element.textContent !== waarde) element.textContent = waarde;
};

const vandaagIso = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIJDZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

/** `HH:mm` in de klok van Brussel. */
function klok(iso: string): string {
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return '--:--';
  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: TIJDZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(moment);
}

/** `donderdag 19 november`, in de taal van de pagina (dezelfde opmaak als bij de bouw). */
function datumTekst(datum: string, taal: string): string {
  const [jaar, maand, dag] = datum.split('-').map(Number);
  if (!jaar || !maand || !dag) return datum;
  return new Intl.DateTimeFormat(taal === 'tr' ? 'tr-BE' : taal === 'fr' ? 'fr-BE' : 'nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TIJDZONE,
  }).format(new Date(Date.UTC(jaar, maand - 1, dag, 12)));
}

/** De eerstvolgende tijd over alle dagen heen; na yatsi is dat de imsak van morgen. */
function volgende(dagen: readonly Dag[], nu: number): { sleutel: string; moment: Date } | null {
  const gesorteerd = [...dagen].sort((a, b) => (a.datum < b.datum ? -1 : 1));
  for (const dag of gesorteerd) {
    for (const sleutel of TIJDEN) {
      const waarde = dag.tijden[sleutel];
      if (!waarde) continue;
      const moment = new Date(waarde);
      if (Number.isNaN(moment.getTime())) continue;
      if (moment.getTime() > nu) return { sleutel, moment };
    }
  }
  return null;
}

/** `2 dagen 04:11:09` of `04:11:09`. Nooit negatief. */
function restTekst(ms: number): string {
  const totaal = Math.max(0, Math.floor(ms / 1000));
  const dagen = Math.floor(totaal / 86400);
  const uren = Math.floor((totaal % 86400) / 3600);
  const minuten = Math.floor((totaal % 3600) / 60);
  const seconden = totaal % 60;
  const twee = (n: number) => String(n).padStart(2, '0');
  const kern = `${twee(uren)}:${twee(minuten)}:${twee(seconden)}`;
  return dagen > 0 ? `${dagen} ${dagen === 1 ? 'dag' : 'dagen'} ${kern}` : kern;
}

function levend(root: HTMLElement): void {
  const taal = root.dataset.taal ?? 'nl';
  const namen = NAMEN[taal] ?? NAMEN.nl ?? {};

  const datumEl = root.querySelector('[data-vakit-datum]');
  const plaatsEl = root.querySelector('[data-vakit-plaats]');
  const volgendEl = root.querySelector('[data-vakit-volgend]');
  const tijdEl = root.querySelector('[data-vakit-tijd]');
  const klokEl = root.querySelector('[data-vakit-klok]');
  const vulEl = root.querySelector<HTMLElement>('[data-vakit-vul]');
  const statusEl = root.querySelector('[data-vakit-status]');
  const tabel = root.querySelector<HTMLTableElement>('[data-vakit-tabel]');
  const keuze = root.querySelector<HTMLSelectElement>('[data-vakit-stad]');
  const rij = root.querySelector('[data-vakit-rij]');

  /** De tijden die de bouw al in de pagina zette; zonder netwerk werkt dit door. */
  let dagen: Dag[] = [];
  /** De plaatsnamen per taal, meegegeven door het onderdeel (dezelfde lijst als de kiezer). */
  let plaatsen: Record<string, string> = {};
  try {
    const bron = root.querySelector('[data-vakit-data]');
    const mee = bron
      ? (JSON.parse(bron.textContent ?? '{}') as { dagen?: Dag[]; plaatsen?: Record<string, string> })
      : null;
    if (Array.isArray(mee?.dagen)) dagen = mee.dagen;
    if (mee?.plaatsen) plaatsen = mee.plaatsen;
  } catch {
    /* Onleesbare gegevens: dan beginnen we leeg en vult het verzoek de rest. */
  }

  let nuVolgend: { sleutel: string; moment: Date } | null = null;
  let timer: number | undefined;
  /** De stad waarvan de tijden nu in de tabel staan. */
  let huidigeStad = root.dataset.stad || 'brussel';

  /*
   * De plaats van de getoonde tijden staat als tekst in beeld ("Stad: Brussel").
   * Die moet meeveranderen met de keuze: anders leest de bezoeker na het kiezen
   * van Gent nog steeds Brussel, en dat is precies de verwarring van 19-11.
   */
  const zetPlaats = (slug: string): void => zetTekst(plaatsEl, plaatsen[slug] ?? slug);

  /**
   * De stad van deze pagina komt van de server (`data-stad`), niet uit het
   * geheugen. Op een stadspagina is het adres de baas: wie `/namaz-vakitleri/gent/`
   * opent hoort Gent te zien, ook als hij de vorige keer Brussel koos.
   */
  const paginaStad = root.dataset.stad || 'brussel';

  /**
   * Waar de pagina van een stad staat. Brussel is de hoofdpagina zelf; elke andere
   * stad heeft een eigen adres. Deze regel moet vóór het doorsturen staan, anders
   * verwijst de kiezer op een stadspagina naar een adres dat niet bestaat.
   */
  const padVanStad = (slug: string): string => {
    const voor = taal === 'tr' ? '' : `/${taal}`;
    return slug === 'brussel' ? `${voor}/namaz-vakitleri/` : `${voor}/namaz-vakitleri/${slug}/`;
  };

  /**
   * Op de hoofdpagina van de gebedstijden (`/namaz-vakitleri/`) telt de eerder
   * gekozen stad wel: die stuurt de lezer één keer door naar het adres van zijn
   * stad. Dat is wat de keuze onthouden betekent nu elke stad een eigen adres
   * heeft; de keuzelijst verwisselde vroeger stil de tabel.
   */
  const isHoofdblad = keuze !== null && paginaStad === 'brussel';
  if (isHoofdblad) {
    try {
      const bewaard = window.localStorage.getItem(GEKOZEN_STAD);
      if (bewaard && bewaard !== 'brussel' && plaatsen[bewaard]) {
        window.location.replace(padVanStad(bewaard));
        return;
      }
    } catch {
      /* Privémodus: geen keuze bewaren en dus ook niet doorsturen. */
    }
  }

  if (keuze) keuze.value = paginaStad;
  zetPlaats(paginaStad);

  /** De zeven tijden van de dag, de weektabel en de klok, uit `dagen`. */
  const teken = (): void => {
    if (dagen.length === 0) return;

    const vandaag = dagen.find((dag) => dag.datum === vandaagIso()) ?? dagen[dagen.length - 1];
    if (!vandaag) return;

    zetTekst(datumEl, datumTekst(vandaag.datum, taal));
    nuVolgend = volgende(dagen, Date.now());

    if (rij) {
      const nu = Date.now();
      for (const cel of rij.querySelectorAll<HTMLElement>('[data-tijd]')) {
        const waarde = vandaag.tijden[cel.dataset.tijd ?? ''];
        const tijd = cel.querySelector('time');
        if (tijd) zetTekst(tijd, waarde ? klok(waarde) : '--:--');
        /* De merkjes onder de cellen: geweest, nu, of nog komen. */
        const moment = waarde ? Date.parse(waarde) : Number.NaN;
        const isGeweest = Number.isFinite(moment) && moment <= nu;
        cel.classList.toggle('is-geweest', isGeweest);
        cel.classList.toggle('is-nu', nuVolgend?.sleutel === cel.dataset.tijd);
      }
    }

    /*
     * De weektabel: elke cel hoort bij een kolomdatum en een rijnaam. De rijnaam
     * komt uit de kop van de rij, in de taal van de pagina, en wordt via NAMEN
     * terugvertaald naar de sleutel die het bestand gebruikt.
     */
    if (tabel) {
      const kolommen = [...tabel.querySelectorAll<HTMLElement>('th[data-datum]')].map((th) => th.dataset.datum ?? '');
      for (const kolom of tabel.querySelectorAll<HTMLElement>('th[data-datum]')) {
        kolom.classList.toggle('is-vandaag', kolom.dataset.datum === vandaag.datum);
      }
      const vandaagKolom = kolommen.indexOf(vandaag.datum);
      for (const rijEl of tabel.querySelectorAll('tbody tr')) {
        [...rijEl.querySelectorAll('td')].forEach((cel, i) => {
          cel.classList.toggle('is-vandaag', i === vandaagKolom);
        });
      }
      for (const rijEl of tabel.querySelectorAll('tbody tr')) {
        const rijNaam = rijEl.querySelector('th')?.textContent?.trim() ?? '';
        const sleutel = TIJDEN.find((k) => namen[k] === rijNaam);
        if (!sleutel) continue;
        const cellen = [...rijEl.querySelectorAll('td')];
        cellen.forEach((cel, i) => {
          const dag = dagen.find((d) => d.datum === kolommen[i]);
          const waarde = dag ? dag.tijden[sleutel] : undefined;
          const tijd = cel.querySelector('time');
          if (tijd) zetTekst(tijd, waarde ? klok(waarde) : '--:--');
        });
      }
    }

    if (nuVolgend) {
      zetTekst(volgendEl, namen[nuVolgend.sleutel] ?? nuVolgend.sleutel);
      zetTekst(tijdEl, klok(nuVolgend.moment.toISOString()));
    }
    tik();
  };

  /** Alleen de klok en de daglijn: dit draait elke seconde, zonder netwerk. */
  const tik = (): void => {
    if (!nuVolgend) return;
    const nu = Date.now();
    zetTekst(klokEl, restTekst(nuVolgend.moment.getTime() - nu));

    if (!vulEl) return;
    const dag = dagen.find((d) => d.datum === nuVolgend?.moment.toISOString().slice(0, 10));
    const begin = dag ? Date.parse(dag.tijden.imsak ?? '') : Number.NaN;
    const eind = dag ? Date.parse(dag.tijden.yatsi ?? '') : Number.NaN;
    const deel =
      Number.isFinite(begin) && Number.isFinite(eind) && eind > begin
        ? Math.min(1, Math.max(0, (nu - begin) / (eind - begin)))
        : 1;
    vulEl.style.transform = `scaleX(${deel.toFixed(4)})`;
  };

  teken();
  if (timer === undefined) timer = window.setInterval(tik, 1000);

  /**
   * Verse tijden. Eén verzoek per pagina; de functie op de rand bewaart ze zelf
   * een half uur. Lukt het niet, dan blijft staan wat er stond en zegt de
   * statusregel het eerlijk (alleen op de pagina met de stadskiezer).
   */
  const haal = async (stad: string): Promise<void> => {
    try {
      const antwoord = await fetch(`/api/vakitler?stad=${encodeURIComponent(stad)}`, {
        headers: { accept: 'application/json' },
      });
      if (!antwoord.ok) {
        zetTekst(statusEl, root.dataset.meldingFout ?? '');
        toonHuidigeStad();
        return;
      }
      const body = (await antwoord.json()) as Antwoord;
      if (!Array.isArray(body.dagen) || body.dagen.length === 0) {
        zetTekst(statusEl, root.dataset.meldingFout ?? '');
        toonHuidigeStad();
        return;
      }
      dagen = body.dagen;
      huidigeStad = stad;
      zetPlaats(stad);
      zetTekst(statusEl, '');
      teken();
    } catch {
      zetTekst(statusEl, root.dataset.meldingFout ?? '');
      toonHuidigeStad();
    }
  };

  /*
   * Mislukt het ophalen, dan blijven de tijden van de vorige stad staan. De
   * plaatsregel en de kiezer moeten dan terug naar die stad, anders zeggen ze
   * iets anders dan de tabel (en de tijden zijn dan van de verkeerde plaats).
   */
  function toonHuidigeStad(): void {
    zetPlaats(huidigeStad);
    if (keuze) keuze.value = huidigeStad;
  }

  void haal(paginaStad);

  /*
   * Een andere stad kiezen is naar die stad gaan, niet de tabel van deze pagina
   * verwisselen. Zo klopt het adres altijd met wat er op het scherm staat, kan de
   * lezer de link doorsturen en werkt de terugknop van de browser zoals hij hoort.
   */
  keuze?.addEventListener('change', () => {
    const gekozen = keuze.value || 'brussel';
    try {
      window.localStorage.setItem(GEKOZEN_STAD, gekozen);
    } catch {
      /* Privémodus: de keuze geldt alleen deze keer. */
    }
    if (gekozen === paginaStad) return;
    window.location.assign(padVanStad(gekozen));
  });

  /*
   * Terug naar het tabblad na een tijd: de klok kan achterlopen als de browser
   * gespaard heeft. Eén hertekening is genoeg; geen tweede loop.
   */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    nuVolgend = volgende(dagen, Date.now());
    tik();
  });
}

for (const root of document.querySelectorAll<HTMLElement>('[data-vakitler]')) {
  levend(root);
}
