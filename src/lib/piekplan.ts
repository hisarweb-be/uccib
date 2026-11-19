/**
 * Het draaiboek van de piek (STORYBOARD D12 tot D19) voor de shots die er echt zijn.
 *
 * De tijdlijn `--piek-p` blijft altijd die van het volledige draaiboek (p1 tot p4);
 * een shot dat in het manifest ontbreekt (`vormVan` geeft `weg`) krijgt geen laag,
 * geen zin, geen vermelding en geen sleutelrij, en zijn stuk valt uit de scrollweg
 * (een `sprong`): het script slaat het over, de pin wordt korter (keuring F2b,
 * herstelpunt 2: nooit een plaatshouder in beeld). Zo werkt elke manifestvorm met
 * dezelfde CSS, die alleen de drempels per element leest.
 *
 * Bewust zonder imports en met alleen wegneembare TypeScript: `verify:media` laadt
 * dit bestand rechtstreeks in Node en toetst er alle manifestvormen mee.
 */

export interface PiekSlot {
  naam: string;
  /** De fase van het shot op de tijdlijn (uit het manifest of de plaatshouder). */
  van: number;
  tot: number;
  aanwezig: boolean;
}

export interface PiekLaag {
  naam: string;
  /** Plaats in het volledige draaiboek, 1 tot 4. */
  slot: number;
  /** Het eigen stuk van de tijdlijn: van de wissel ervoor tot de wissel erna. */
  a: number;
  b: number;
  /** Vanaf hier ligt de laag bovenop (-1: de eerste, altijd zichtbaar). */
  in: number;
  /** De vermelding: van `plekIn` tot `plekUit` (2: blijft staan). */
  plekIn: number;
  plekUit: number;
}

export interface PiekZin {
  /** Index in de zinnen van de piek (zin i hoort bij slot i + 1). */
  tekst: number;
  naam: string;
  in: number;
  uit: number;
}

export interface PiekKlein {
  tekst: number;
  in: number;
}

export interface PiekPlan {
  lagen: PiekLaag[];
  zinnen: PiekZin[];
  /** De zin van een ruimte schuift klein bij de opening zodra de volgende zin komt. */
  klein: PiekKlein[];
  /** Stukken [van, tot] van de tijdlijn die de scrollweg overslaat, oplopend. */
  sprongen: [number, number][];
  /** Pin in schermhoogten. */
  lengte: number;
}

/** De pin in schermhoogten met het volledige draaiboek. */
export const PIEK_PIN = 5;
/** De kern gaat open op de eerste ruimte (0,06), staat helemaal open op 0,18. */
const KERN_IN = 0.06;
const KERN_OPEN = 0.18;
/** Vanaf hier staan de knoppen er; wat na de laatste ruimte komt tot hier valt weg. */
const KNOPPEN = 0.86;
/** Alleen p1 tot p3 hebben een zin. */
const MET_ZIN = 3;

const rond = (x: number) => Number(x.toFixed(3));

export function piekPlan(slots: PiekSlot[], aantalZinnen: number): PiekPlan {
  /* De wissels van het volledige draaiboek: midden tussen twee fasen. grens[i] is het begin van slot i. */
  const grens = slots.map((s, i) => (i === 0 ? KERN_IN : rond(((slots[i - 1]?.tot ?? s.van) + s.van) / 2)));
  const er = slots.flatMap((s, i) => (s.aanwezig ? [i] : []));
  const sprongen: [number, number][] = [];
  if (er.length === 0) return { lagen: [], zinnen: [], klein: [], sprongen, lengte: PIEK_PIN };

  const eerste = er[0]!;
  const laatste = er[er.length - 1]!;
  if (eerste > 0) sprongen.push([KERN_OPEN, grens[eerste]!]);
  er.forEach((i, n) => {
    const volgende = er[n + 1];
    if (volgende !== undefined && volgende > i + 1) sprongen.push([grens[i + 1]!, grens[volgende]!]);
  });
  if (laatste < slots.length - 1) sprongen.push([grens[laatste + 1]!, KNOPPEN]);

  const lagen = er.map((i, n): PiekLaag => {
    const volgende = er[n + 1];
    const a = i === 0 ? KERN_IN : grens[i]!;
    /* De laatste ruimte loopt door tot het einde, tenzij er erna een stuk wegvalt: dan
       is ze daar op haar eindpunt, zodat licht en beeld niet over de sprong springen. */
    const b = volgende !== undefined ? grens[i + 1]! : laatste < slots.length - 1 ? grens[laatste + 1]! : 1;
    return {
      naam: slots[i]!.naam,
      slot: i + 1,
      a,
      b,
      in: n === 0 ? -1 : rond(a - 0.005),
      plekIn: n === 0 ? KERN_IN : rond(a - 0.005),
      plekUit: volgende !== undefined ? rond(grens[volgende]! - 0.005) : 2,
    };
  });

  const metZin = er.filter((i) => i < Math.min(MET_ZIN, aantalZinnen));
  const zinnen = metZin.map((i, n): PiekZin => {
    const volgende = metZin[n + 1];
    return {
      tekst: i,
      naam: slots[i]!.naam,
      in: n === 0 ? -1 : rond(grens[i]! - 0.005),
      uit: volgende !== undefined ? rond(grens[volgende]! - 0.02) : 2,
    };
  });
  const klein = metZin.slice(0, -1).map((i, n): PiekKlein => ({ tekst: i, in: rond(grens[metZin[n + 1]!]! - 0.005) }));

  const gat = sprongen.reduce((som, [van, tot]) => som + (tot - van), 0);
  return { lagen, zinnen, klein, sprongen, lengte: rond(PIEK_PIN * (1 - gat)) };
}

/** Scrollvoortgang (0 tot 1) naar de tijdlijn van het draaiboek, over de sprongen heen. */
export function naarTijdlijn(u: number, sprongen: [number, number][]): number {
  const gat = sprongen.reduce((som, [van, tot]) => som + (tot - van), 0);
  let t = u * (1 - gat);
  for (const [van, tot] of sprongen) {
    if (t <= van) break;
    t += tot - van;
  }
  return t;
}
