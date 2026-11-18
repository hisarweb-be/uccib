/**
 * De twee vastgezette scènes van de startpagina: hero-unie en piek-ruimtes.
 *
 * Dit bestand laadt pas na `load` (zie `start.ts`). Het podium staat vast met
 * `position: sticky` in CSS; GSAP en ScrollTrigger doen hier maar één ding: de
 * scrollstand met `scrub: 0.3` omzetten in een getal van 0 tot 1. Dat getal gaat
 * als `--hero-p` of `--piek-p` naar de sectie en elke stand volgt daaruit in
 * `home.css`. Wat CSS niet kan meten (waar het venster heen verhuist, hoe ver de
 * kern open moet) meet dit script en zet het als maat op het podium.
 *
 * Films en de frame-reeks komen uit het manifest, via `data-`attributen die de
 * componenten bij de bouw zetten. Zonder film gebeurt hier niets voor dat shot.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const klem = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));
const breed = window.matchMedia('(min-width: 768px)');
const banden = window.matchMedia('(min-width: 1024px)');

interface Verbinding {
  saveData?: boolean;
  effectiveType?: string;
}
const verbinding = (navigator as Navigator & { connection?: Verbinding }).connection;
/** Zuinige of trage verbinding: alleen de posters (CONTRACT 3). */
const zuinig = Boolean(verbinding?.saveData) || /(^|-)(2g|3g)$/.test(verbinding?.effectiveType ?? '');

function filmKlaar(shot: string) {
  document.dispatchEvent(new CustomEvent('uccib:film-klaar', { detail: { shot } }));
}

/** Koppelt de scrollweg van één sectie aan een getal van 0 tot 1. */
function scrub(sectie: HTMLElement, podium: HTMLElement, lengte: number, zet: (p: number) => void) {
  const maat = sectie.querySelector<HTMLElement>('.sh-maat');
  const staat = { p: 0 };
  gsap.to(staat, {
    p: 1,
    ease: 'none',
    onUpdate: () => zet(staat.p),
    scrollTrigger: {
      trigger: sectie,
      start: () => `top ${parseFloat(getComputedStyle(podium).top) || 0}px`,
      end: () => `+=${lengte * (maat?.offsetHeight || window.innerHeight)}`,
      scrub: 0.3,
      invalidateOnRefresh: true,
    },
  });
  return staat;
}

/* ── Hero-unie ── */

interface ReeksData {
  map: string;
  patroon: string;
  aantal: number;
  breedte: number;
  hoogte: number;
}

function heroReeks(canvas: HTMLCanvasElement) {
  const ruw = (breed.matches ? canvas.dataset.reeksD : canvas.dataset.reeksM) ?? canvas.dataset.reeksD ?? canvas.dataset.reeksM;
  const ctx = canvas.getContext('2d');
  if (!ruw || !ctx || zuinig) return null;
  const reeks = JSON.parse(ruw) as ReeksData;
  if (!(reeks.aantal > 0)) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const doel = Math.max(canvas.clientWidth, canvas.clientHeight, 320) * 2 * dpr;
  const schaal = Math.min(1, doel / Math.min(reeks.breedte, reeks.hoogte));
  canvas.width = Math.round(reeks.breedte * schaal);
  canvas.height = Math.round(reeks.hoogte * schaal);

  const beelden: Array<HTMLImageElement | undefined> = new Array(reeks.aantal);
  let geladen = 0;
  let getekend = -1;
  let gevraagd = 0;

  const teken = (index: number) => {
    gevraagd = index;
    /* Het dichtstbijzijnde beeld dat er al is. */
    for (let d = 0; d < reeks.aantal; d += 1) {
      const kandidaat = beelden[index - d] ?? beelden[index + d];
      if (kandidaat) {
        const nummer = beelden[index - d] ? index - d : index + d;
        if (nummer !== getekend) {
          ctx.drawImage(kandidaat, 0, 0, canvas.width, canvas.height);
          getekend = nummer;
        }
        return;
      }
    }
  };

  for (let i = 0; i < reeks.aantal; i += 1) {
    const beeld = new Image();
    beeld.decoding = 'async';
    beeld.onload = () => {
      beelden[i] = beeld;
      geladen += 1;
      if (geladen === 1 || i === gevraagd) teken(gevraagd);
      if (geladen === reeks.aantal) {
        canvas.classList.add('is-klaar');
        filmKlaar('h1');
      }
    };
    beeld.src = `${reeks.map.replace(/\/$/, '')}/${reeks.patroon.replace('%04d', String(i + 1).padStart(4, '0'))}`;
  }

  /* Frame uit p: de reeks loopt over het stuk van `h1` in het manifest (0,09 tot 0,92). */
  return (p: number) => teken(Math.round(klem((p - 0.09) / 0.83) * (reeks.aantal - 1)));
}

function hero(sectie: HTMLElement) {
  const podium = sectie.querySelector<HTMLElement>('.hero-podium');
  const eerste = sectie.querySelector<HTMLElement>('.hero-eerste');
  const venster = sectie.querySelector<HTMLElement>('[data-hero-venster]');
  if (!podium || !eerste || !venster) return;

  const fasen = sectie.querySelector<HTMLElement>('.hero-fasen');
  const verhaal = sectie.querySelector<HTMLElement>('.hero-verhaal');
  const klok = [...sectie.querySelectorAll<HTMLElement>('.hero-klok li')];
  const knoppenEerste = sectie.querySelector<HTMLElement>('[data-hero-knoppen="eerste"]');
  const knoppenSlot = sectie.querySelector<HTMLElement>('[data-hero-knoppen="slot"]');
  const grenzen = (sectie.dataset.fasen ?? '').split(',').map(Number).filter(Number.isFinite);
  const canvas = sectie.querySelector<HTMLCanvasElement>('canvas.hero-reeks');
  const tekenReeks = canvas ? heroReeks(canvas) : null;

  function meet() {
    const W = podium!.clientWidth;
    const H = podium!.clientHeight;
    const maat = venster!.offsetWidth;
    if (!W || !H || !maat) return;

    let links = 0;
    let boven = 0;
    for (let el: HTMLElement | null = venster; el && el !== podium; el = el.offsetParent as HTMLElement | null) {
      links += el.offsetLeft;
      boven += el.offsetTop;
    }
    const blad = parseFloat(getComputedStyle(eerste!).paddingLeft) || 0;

    /* Waar de rozet staat tijdens de fasen: `D` is de doorsnede van haar cirkel. */
    let D: number;
    let cx: number;
    let cy: number;
    if (banden.matches) {
      const van = blad + ((W - 2 * blad) * 5) / 12 + 24;
      const tot = W - 24;
      D = Math.min(905, H - 48, tot - van);
      cx = (van + tot) / 2;
      cy = H / 2;
    } else {
      D = Math.min(W - 32, 0.5 * H - 28, 560);
      cx = W / 2;
      cy = 0.25 * H + 4;
    }
    const zijde = D / Math.SQRT2;

    /* En in het slot: klein, links, boven of naast de belofte. */
    const slotD = banden.matches ? 96 : 112;
    const slotX = blad + slotD / 2;
    const slotY = banden.matches ? 0.36 * H + slotD / 2 : 24 + slotD / 2;
    const slotZijde = slotD / Math.SQRT2;

    const stijl = podium!.style;
    stijl.setProperty('--fs', String(zijde / maat));
    stijl.setProperty('--fx', `${cx - zijde / 2 - links}px`);
    stijl.setProperty('--fy', `${cy - zijde / 2 - boven}px`);
    stijl.setProperty('--gs', String(slotZijde / maat));
    stijl.setProperty('--gx', `${slotX - slotZijde / 2 - links}px`);
    stijl.setProperty('--gy', `${slotY - slotZijde / 2 - boven}px`);
    stijl.setProperty('--hero-eenheid', String((maat * 1.50446) / 100));

    /* Rechtsonder zweeft de WhatsApp-knop: komt de tekst daar, dan wijkt de zin. */
    if (fasen && verhaal) {
      const krap =
        !banden.matches && verhaal.getBoundingClientRect().bottom > podium!.getBoundingClientRect().bottom - 88;
      fasen.classList.toggle('is-krap', krap);
    }
  }

  let stand = '';
  let actief = -2;
  function zet(p: number) {
    sectie.style.setProperty('--hero-p', p.toFixed(4));

    const nu = p >= 0.92 ? 'slot' : p > 0.14 ? 'fasen' : 'eerste';
    if (nu !== stand) {
      stand = nu;
      sectie.dataset.stand = nu;
      if (knoppenEerste) knoppenEerste.inert = nu !== 'eerste';
      if (knoppenSlot) knoppenSlot.inert = nu !== 'slot';
    }

    let index = -1;
    if (p < 0.92) for (let i = 0; i < grenzen.length; i += 1) if (p >= (grenzen[i] ?? 2)) index = i;
    if (index !== actief) {
      actief = index;
      klok.forEach((li, i) => {
        if (i === index) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
      });
    }

    tekenReeks?.(p);
  }

  meet();
  zet(0);
  ScrollTrigger.addEventListener('refreshInit', meet);
  scrub(sectie, podium, 3, zet);
}

/* ── Piek-ruimtes ── */

interface FilmBestand {
  pad: string;
  breedte: number;
  hoogte: number;
  duur: number;
}

function piek(sectie: HTMLElement) {
  const podium = sectie.querySelector<HTMLElement>('.piek-podium');
  const beeld = sectie.querySelector<HTMLElement>('.piek-beeld');
  const rozet = sectie.querySelector<SVGElement>('.piek-rozet');
  if (!podium || !beeld || !rozet) return;

  const knoppen = sectie.querySelector<HTMLElement>('[data-piek-knoppen="scene"]');
  const lengte = Number(sectie.dataset.lengte) || 5;
  /* Ontbreekt een shot, dan slaat de scrollweg zijn stuk over; p blijft de tijdlijn van het draaiboek. */
  const [sprongVan = NaN, sprongTot = NaN] = (sectie.dataset.sprong ?? '').split(',').map(Number);
  const gat = Number.isFinite(sprongVan) && Number.isFinite(sprongTot) ? sprongTot - sprongVan : 0;
  const naarTijdlijn = (u: number) => {
    if (!gat) return u;
    const t = u * (1 - gat);
    return t <= sprongVan ? t : t + gat;
  };

  let maxSchaal = 8;
  function meet() {
    const doos = rozet!.getBoundingClientRect().width / (Number(podium!.style.getPropertyValue('--piek-s')) || 1);
    const B = beeld!.clientWidth;
    const H = beeld!.clientHeight;
    if (!doos || !B || !H) return;
    /* De inkeping van de kern ligt op 0,75 van de punt: zo ver open dat ook die buiten beeld valt. */
    const ver = Math.hypot(B, H) / 2 / 0.72;
    maxSchaal = Math.max(1, ver / (0.188 * doos));
    podium!.style.setProperty('--piek-eenheid', String(doos / 100));
    if (knoppen) {
      const marge = parseFloat(getComputedStyle(knoppen).marginTop) || 0;
      podium!.style.setProperty('--piek-knop-h', `${knoppen.offsetHeight + marge}px`);
    }
  }

  /* De laatste stand: een film die later klaar is dan de scroll, springt er meteen naartoe. */
  let laatste = 0;

  /* Films: bron pas zetten als de sectie nadert, scrubben zodra ze kunnen spelen. */
  const films = zuinig
    ? []
    : [...sectie.querySelectorAll<HTMLVideoElement>('video.piek-film')].flatMap((video) => {
        try {
          const data = JSON.parse(video.dataset.film ?? '{}') as { d?: FilmBestand | null; m?: FilmBestand | null };
          const bestand = (breed.matches ? data.d : data.m) ?? data.d ?? data.m;
          const van = Number(video.dataset.van);
          const tot = Number(video.dataset.tot);
          if (!bestand?.pad || !(tot > van)) return [];
          return [{ video, bestand, van, tot, klaar: false }];
        } catch {
          return [];
        }
      });

  if (films.length > 0) {
    const laad = () => {
      for (const film of films) {
        const { video, bestand } = film;
        video.width = bestand.breedte;
        video.height = bestand.hoogte;
        video.addEventListener(
          'canplaythrough',
          () => {
            film.klaar = true;
            video.classList.add('is-klaar');
            filmKlaar(video.dataset.filmShot ?? '');
            zet(laatste);
          },
          { once: true },
        );
        video.preload = 'auto';
        video.src = bestand.pad;
        video.load();
      }
    };
    if ('IntersectionObserver' in window) {
      const kijker = new IntersectionObserver(
        (items) => {
          if (items.some((item) => item.isIntersecting)) {
            kijker.disconnect();
            laad();
          }
        },
        { rootMargin: '100% 0px' },
      );
      kijker.observe(sectie);
    } else laad();
  }

  let open = false;
  function zet(u: number) {
    laatste = u;
    const q = naarTijdlijn(u);
    sectie.style.setProperty('--piek-p', q.toFixed(4));

    /* De kern gaat open, en knijpt bij elke wissel even dicht terwijl ze een slag draait. */
    const dip = (midden: number) => klem(1 - Math.abs(q - midden) / 0.02);
    const e = klem(klem((q - 0.08) / 0.12) - 0.8 * dip(0.44) - 0.8 * dip(0.6));
    const stijl = podium!.style;
    stijl.setProperty('--piek-s', Math.pow(maxSchaal, e).toFixed(4));
    stijl.setProperty('--piek-phi', `${(45 * (klem((q - 0.42) / 0.04) + klem((q - 0.58) / 0.04))).toFixed(2)}deg`);
    stijl.setProperty('--piek-rozet-o', klem(1 - (e - 0.3) / 0.4).toFixed(3));

    const nu = q >= 0.86;
    if (knoppen && nu !== open) {
      open = nu;
      knoppen.inert = !nu;
    }

    for (const film of films) {
      if (!film.klaar) continue;
      const duur = film.bestand.duur || film.video.duration || 0;
      const t = Math.min(klem((q - film.van) / (film.tot - film.van)) * duur, Math.max(0, duur - 0.05));
      if (Math.abs(film.video.currentTime - t) > 0.01) film.video.currentTime = t;
    }
  }

  if (knoppen) knoppen.inert = true;
  meet();
  zet(0);
  ScrollTrigger.addEventListener('refreshInit', meet);
  scrub(sectie, podium, lengte, zet);
}

export function start() {
  gsap.registerPlugin(ScrollTrigger);

  const heroSectie = document.querySelector<HTMLElement>('[data-sectie="hero-unie"]');
  const piekSectie = document.querySelector<HTMLElement>('[data-sectie="piek-ruimtes"]');
  if (heroSectie) hero(heroSectie);
  if (piekSectie) piek(piekSectie);

  /* Maten kloppen pas als de letters er zijn en als een film zijn plek heeft. */
  document.addEventListener('uccib:film-klaar', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
