/**
 * De bewegingslaag van de site (F4, scroll cinema).
 *
 * Eén scroll-listener, één rAF-lus, geen animatiebibliotheek. Dezelfde opzet als
 * `hisarweb/components/realisaties/FrameSequence.tsx` (HIS-559): wie een frame
 * vraagt zet een vlag, de volgende `requestAnimationFrame` tekent iedereen, en er
 * is geen staat per scrollframe buiten dit bestand.
 *
 * Waarom geen GSAP met ScrollTrigger, terwijl plan §6 dat noemt: op 17-11 gemeten
 * met esbuild (bundle, minify, gzip -9) kosten `gsap@3.13.0` + `ScrollTrigger`
 * samen 44,9 kB gzip vóór één regel eigen code, en de poort is 40 kB gzip voor de
 * hele bewegingslaag. Dit bestand doet hetzelfde werk in een fractie daarvan en
 * houdt de drie andere poorten (stil bij reduced motion, CLS, 60 fps) zelf in de
 * hand. De meting staat in `voortgang/F4.md`.
 *
 * Wat het doet:
 * - het podium (`[data-cinema]`): de voortgang door de vastgepinde sectie zet per
 *   laag één `opacity`, van korrel en lijncontour naar massa naar de eindfoto;
 * - beeldsecties (`[data-parallax]`): een trage verschuiving van het beeld zelf;
 * - beeldsecties (`[data-onthul]`): één keer zacht in beeld komen.
 *
 * Nooit meer dan één geanimeerde laag tegelijk: zolang het podium in beeld staat
 * doen de parallax-beelden niets, en het podium vult het hele venster.
 *
 * Alles staat uit zonder de klasse `cinema-aan` op `<html>` (zie `Layout.astro`).
 */

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/** Standaard parallax-uitslag als deel van de eigen hoogte; past binnen de 7% marge van de schaal. */
const PARALLAX = 0.06;

type Kijker = () => void;

const kijkers = new Set<Kijker>();
let gepland = false;
let laatsteOpacity = new WeakMap<HTMLElement, number>();

function tik(): void {
  gepland = false;
  for (const kijker of kijkers) kijker();
}

function vraagTick(): void {
  if (gepland) return;
  gepland = true;
  requestAnimationFrame(tik);
}

/** Voortgang 0..1 omgezet in een zachte overgang tussen twee punten. */
function trap(p: number, van: number, tot: number): number {
  if (p <= van) return 0;
  if (p >= tot) return 1;
  const t = (p - van) / (tot - van);
  return t * t * (3 - 2 * t);
}

function zetOpacity(el: HTMLElement | null | undefined, waarde: number): void {
  if (!el) return;
  const afgerond = Math.round(waarde * 1000) / 1000;
  if (laatsteOpacity.get(el) === afgerond) return;
  laatsteOpacity.set(el, afgerond);
  el.style.opacity = String(afgerond);
}

/* ── Het podium: de gebouwonthulling ── */

interface Podium {
  el: HTMLElement;
  lagen: Map<string, HTMLElement>;
}

function leesPodium(el: HTMLElement): Podium {
  const lagen = new Map<string, HTMLElement>();
  el.querySelectorAll<HTMLElement>('[data-laag]').forEach((laag) => {
    const naam = laag.dataset.laag;
    if (naam) lagen.set(naam, laag);
  });
  return { el, lagen };
}

/**
 * De voortgang door het podium is de scrollstand van de sectie zelf: van het
 * moment dat de vastgepinde laag bovenaan plakt tot hij weer loslaat.
 *
 * Fase 2 (een echte 120-frames-reeks) hoeft hier niets te verbouwen: dezelfde
 * `p` voedt dan een canvas in plaats van deze vier lagen. Zie `voortgang/F4.md`.
 */
function podiumKijker(podium: Podium): Kijker {
  const { el, lagen } = podium;
  const kontour = lagen.get('kontour');
  const foto = lagen.get('foto');
  const korrel = lagen.get('korrel');

  return () => {
    const vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= vh * 2) return;

    const span = r.height - vh;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : r.top <= 0 ? 1 : 0;

    // De massa staat altijd (zie `cinema.css`): het begin van de rit is een
    // donkere foto, geen leeg vlak. De contour is een korte flits over die foto
    // heen en dooft daarna weg, zodat hij accent blijft en nooit het enige is
    // dat je ziet. De foto komt er vroeg overheen en staat ruim voor het eind.
    zetOpacity(kontour, 0.95 * trap(p, 0, 0.15) * (1 - trap(p, 0.15, 0.4)));
    zetOpacity(foto, trap(p, 0.12, 0.75));
    // Korrel bouwt mee op en trekt aan het eind terug tot een filmische 12%.
    zetOpacity(korrel, 0.9 * trap(p, 0, 0.15) * (1 - 0.87 * trap(p, 0.3, 0.95)));

    // Zachtjes ageert: de eindfoto ademt de laatste 10% 1,5% groter, alleen op de compositor.
    if (foto) {
      const sta = trap(p, 0.9, 1);
      foto.style.transform = sta > 0 ? `scale(${(1 + 0.015 * sta).toFixed(4)})` : '';
    }
  };
}

/* ── Beeldsecties: trage parallax en onthulling ── */

function parallaxKijker(binnen: HTMLElement, podium: HTMLElement | null): Kijker {
  const fractie = Number(binnen.dataset.parallax) || PARALLAX;

  return () => {
    const vh = window.innerHeight;
    const r = binnen.getBoundingClientRect();
    // Buiten beeld niets schrijven; het beeld staat dan toch stil.
    if (r.bottom <= 0 || r.top >= vh) return;
    // Het podium is het enige dat beweegt zolang het in beeld staat.
    if (podium) {
      const pr = podium.getBoundingClientRect();
      if (pr.bottom > 0 && pr.top < vh) return;
    }
    const midden = r.top + r.height / 2 - vh / 2;
    const bereik = (vh + r.height) / 2;
    const q = Math.max(-1, Math.min(1, midden / bereik));
    binnen.style.transform = `translate3d(0, ${(-q * fractie * r.height).toFixed(2)}px, 0) scale(1.14)`;
  };
}

function startOnthulling(): void {
  const beelden = document.querySelectorAll<HTMLElement>('[data-onthul]');
  if (!beelden.length) return;
  if (typeof IntersectionObserver !== 'function') {
    beelden.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const kijker = new IntersectionObserver(
    (rijen) => {
      for (const rij of rijen) {
        if (!rij.isIntersecting) continue;
        rij.target.classList.add('is-in');
        kijker.unobserve(rij.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  beelden.forEach((el) => kijker.observe(el));
}

/* ── Starten en stoppen ── */

function herstelStil(): void {
  laatsteOpacity = new WeakMap();
  document.querySelectorAll<HTMLElement>('[data-laag], .cinema-korrel').forEach((el) => {
    el.style.opacity = '';
    el.style.transform = '';
  });
}

export function start(): void {
  const wortel = document.documentElement;
  if (!wortel.classList.contains('cinema-aan')) return;

  // De teller van de noodrem in `Layout.astro`: zonder dit sein ruimt die het
  // podium na 2,5 s op als dit bestand nooit geladen raakte.
  (window as unknown as { __cinema?: boolean }).__cinema = true;

  const podiumEl = document.querySelector<HTMLElement>('[data-cinema]');
  if (podiumEl) kijkers.add(podiumKijker(leesPodium(podiumEl)));

  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((binnen) => {
    kijkers.add(parallaxKijker(binnen, podiumEl));
  });

  startOnthulling();

  window.addEventListener('scroll', vraagTick, { passive: true });
  window.addEventListener('resize', vraagTick, { passive: true });

  const reduce = window.matchMedia(REDUCE_QUERY);
  reduce.addEventListener('change', (gebeurtenis) => {
    if (gebeurtenis.matches) {
      wortel.classList.remove('cinema-aan');
      herstelStil();
    } else {
      wortel.classList.add('cinema-aan');
      vraagTick();
    }
  });

  vraagTick();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
