/**
 * De lijnen van de rozet voor de twee scènes van de startpagina. Zelfde
 * maatvoering als `Rozet.astro`: viewBox 0 0 100 100, buitenstraal R = 47.
 * Alleen bouwtijd.
 */
export const R = 47;

/** De kern is een ster van zestien punten: punt op 0,4 R, inkeping op 0,3 R. */
export const KERN_PUNT = 0.4;
export const KERN_INKEPING = 0.3;

const pt = (graden: number, r: number) => {
  const a = (graden * Math.PI) / 180;
  return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 - r * Math.sin(a)).toFixed(2)}`;
};
const veelhoek = (punten: string[]) => `M${punten.join('L')}Z`;

/** `n` hoeken in graden, vanaf `start`, telkens `stap` verder. */
export const hoeken = (start: number, stap: number, n: number) =>
  Array.from({ length: n }, (_, i) => start + i * stap);

const ster = (buiten: number, inkeping: number) =>
  veelhoek(hoeken(0, 22.5, 16).map((g, i) => pt(g, i % 2 === 0 ? buiten : inkeping)));

const hoek = 50 - R * Math.SQRT1_2;
const ver = 100 - hoek;
const h = hoek.toFixed(2);
const v = ver.toFixed(2);

export const lijnen = {
  /* De cirkel begint in de linkerbovenhoek van vierkant A. */
  cirkel: `M${h} ${h}A${R} ${R} 0 1 1 ${v} ${v}A${R} ${R} 0 1 1 ${h} ${h}`,
  a: `M${h} ${h}H${v}V${v}H${h}Z`,
  b: veelhoek(hoeken(90, -90, 4).map((g) => pt(g, R))),
  binnen: veelhoek(hoeken(22.5, 45, 8).map((g) => pt(g, R * 0.7654))),
  kern: ster(R * KERN_PUNT, R * KERN_INKEPING),
  buitenster: ster(R, R * 0.7654),
};
