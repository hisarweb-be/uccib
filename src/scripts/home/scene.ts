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
      /* Een refresh (fonts, een film die klaar is) zet de tween even op 0 en weer
         terug zonder `onUpdate`: wie dan stilstaat, zag de scène op p 0 tot de
         volgende scrollbeweging (gemeten 18-11: --piek-p 0,46 viel na een refresh
         op 0 en bleef daar). Daarom na elke refresh de stand opnieuw zetten. */
      onRefresh: () => zet(staat.p),
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

    const nu = p >= 0.95 ? 'slot' : p > 0.14 ? 'fasen' : 'eerste';
    if (nu !== stand) {
      stand = nu;
      sectie.dataset.stand = nu;
      if (knoppenEerste) knoppenEerste.inert = nu !== 'eerste';
      if (knoppenSlot) knoppenSlot.inert = nu !== 'slot';
    }

    let index = -1;
    if (p < 0.9) for (let i = 0; i < grenzen.length; i += 1) if (p >= (grenzen[i] ?? 2)) index = i;
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

  /* De ruimtes: elk een eigen stuk van de tijdlijn [a, b], met haar foto in een raam. */
  const kamers = [...sectie.querySelectorAll<HTMLElement>('.piek-laag')].flatMap((el, i) => {
    const raam = el.querySelector<HTMLElement>('.piek-raam');
    const a = Number(el.dataset.a);
    const b = Number(el.dataset.b);
    if (!raam || !(b > a)) return [];
    return [
      {
        raam,
        a,
        b,
        /* Elk raam schuift, ook onder een film (herkeuring PR3: nooit stil). Om en om naar links en naar rechts. */
        film: el.dataset.vorm === 'film',
        richting: i % 2 === 0 ? 1 : -1,
        eigen: (el.dataset.eigen ?? '').split(',').map(Number),
        aspect: (el.dataset.aspect ?? '').split(',').map(Number),
        sMax: 1,
        venster: false,
        x: [0, 0] as [number, number],
        y: [0, 0] as [number, number],
      },
    ];
  });
  /* De wissels: daar knijpt de kern dicht en draait ze een slag. */
  const wissels = kamers.slice(0, -1).map((k) => k.b);

  const tekst = sectie.querySelector<HTMLElement>('.piek-tekst');
  let r0 = 1;
  function meet() {
    const doos = rozet!.getBoundingClientRect().width;
    const B = beeld!.clientWidth;
    const H = beeld!.clientHeight;
    if (!doos || !B || !H) return;
    r0 = 0.188 * doos;
    const bp = breed.matches ? 0 : 1;
    /* Hoe groot een venster wil worden: wat de foto zelf toelaat (zie hieronder). */
    const wens = (W: number, D: number, aspect: number) => Math.max(r0, Math.min((W * (1 - D)) / 2, (0.94 * W) / aspect / 2));
    /* Zoveel van haar breedte schuift de foto over haar hele stuk: per tiende van de tijdlijn een tiende.
       Een film die schermvullend past, schuift hooguit zover dat ze schermvullend blijft. */
    const schuif = (k: (typeof kamers)[number], eigen: number, aspect: number) => {
      const D = Math.min(0.5, k.b - k.a);
      const ruim = 1 - B / (1.1 * eigen);
      return k.film && H * aspect <= 1.1 * eigen && ruim > 0 ? Math.min(D, ruim) : D;
    };
    const nodig = kamers.reduce((m, k) => {
      const eigen = k.eigen[bp] || k.eigen[0] || B;
      const aspect = k.aspect[bp] || k.aspect[0] || B / H;
      const D = schuif(k, eigen, aspect);
      const W = Math.max(B / (1 - D), H * aspect);
      return W > 1.1 * eigen ? Math.max(m, wens(1.1 * eigen, D, aspect)) : m;
    }, r0);
    /* De tekstplaat bedekt het venster nooit (herkeuring PR3): het midden schuift naar rechts
       tot het venster vrij van de plaat blijft (de rozet blijft heel in beeld), en wat dan nog
       niet past, maakt het venster kleiner. Plaat in de eindstand, met de knoppenrij erbij. */
    const plaat = tekst && tekst.offsetWidth ? {
      l: tekst.offsetLeft - beeld!.offsetLeft,
      t: tekst.offsetTop - beeld!.offsetTop,
      r: tekst.offsetLeft - beeld!.offsetLeft + tekst.offsetWidth,
      o: tekst.offsetTop - beeld!.offsetTop + tekst.offsetHeight,
    } : null;
    const cy = H / 2;
    const vrij = (cx: number) =>
      plaat
        ? Math.hypot(Math.max(plaat.l - cx, 0, cx - plaat.r), Math.max(plaat.t - cy, 0, cy - plaat.o)) - 16
        : Infinity;
    const dxMax = Math.max(0, B / 2 - doos / 2 - 0.04 * B);
    let dx = 0;
    for (let d = 0; d <= dxMax; d += 4) {
      if (vrij(B / 2 + d) > vrij(B / 2 + dx)) dx = d;
      if (vrij(B / 2 + dx) >= nodig) break;
    }
    const cx = B / 2 + dx;
    const ruimte = vrij(cx);
    /* De inkeping van de kern ligt op 0,75 van de punt: zo ver open dat ook die buiten beeld valt. */
    const vol = Math.hypot(Math.max(cx, B - cx), H / 2) / 0.72;
    for (const k of kamers) {
      const eigen = k.eigen[bp] || k.eigen[0] || B;
      const aspect = k.aspect[bp] || k.aspect[0] || B / H;
      const D = schuif(k, eigen, aspect);
      /* Nooit groter dan 110 % van de eigen pixels (BIJSTURING-MOEDER ronde 2g). */
      const maxW = 1.1 * eigen;
      let W = Math.max(B / (1 - D), H * aspect);
      /* Het midden en de halve maat van wat het raam moet dekken: het venster of het hele beeld. */
      let mx = B / 2;
      let Rx = B / 2;
      let Ry = H / 2;
      k.venster = W > maxW;
      if (k.venster) {
        /* Te klein voor het hele scherm: de foto blijft in het venster van de rozet. */
        W = maxW;
        const R = Math.max(r0, Math.min(wens(W, D, aspect), ruimte));
        mx = cx;
        Rx = R;
        Ry = R;
        k.sMax = R / r0;
      } else k.sMax = Math.max(1, vol / r0);
      const Hf = W / aspect;
      k.raam.style.setProperty('--rw', `${W.toFixed(1)}px`);
      k.raam.style.setProperty('--rh', `${Hf.toFixed(1)}px`);
      /* Het raam dekt altijd het venster (of het hele beeld): links tussen deze twee grenzen. */
      const links: [number, number] = [mx + Rx - W, mx - Rx];
      const boven: [number, number] = [H / 2 + Ry - Hf, H / 2 - Ry];
      k.x = k.richting > 0 ? [links[1], links[0]] : links;
      const midden = (boven[0] + boven[1]) / 2;
      const zak = Math.min((boven[1] - boven[0]) / 2, 0.03 * Hf);
      k.y = [midden + zak, midden - zak];
    }
    podium!.style.setProperty('--piek-eenheid', String(doos / 100));
    podium!.style.setProperty('--piek-dx', `${dx}px`);
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

    /* De kern gaat open en knijpt bij elke wissel helemaal dicht terwijl ze een slag
       draait: de rozet draagt de overgang naar de volgende ruimte. */
    const dicht = wissels.reduce((som, m) => som + klem(1 - Math.abs(q - m) / 0.04), 0);
    const e = klem(klem((q - 0.07) / 0.11) - dicht);
    const nu = kamers.findLast((k) => q >= k.a) ?? kamers[0];
    const s = nu ? Math.pow(nu.sMax, e) : 1;
    const stijl = podium!.style;
    stijl.setProperty('--piek-s', s.toFixed(4));
    stijl.setProperty('--piek-phi', `${wissels.reduce((som, m) => som + 45 * klem((q - m + 0.02) / 0.04), 0).toFixed(2)}deg`);
    /* De petrol rozet blijft rond een venster staan; gaat het beeld schermvullend, dan wijkt ze. */
    stijl.setProperty('--piek-rozet-o', (nu?.venster ? 1 : klem(1 - (e - 0.3) / 0.4)).toFixed(3));
    for (const k of kamers) {
      const t = klem((q - k.a) / (k.b - k.a));
      const x = k.x[0] + (k.x[1] - k.x[0]) * t;
      const y = k.y[0] + (k.y[1] - k.y[0]) * t;
      k.raam.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }

    const klaar = q >= 0.86;
    if (knoppen && klaar !== open) {
      open = klaar;
      knoppen.inert = !klaar;
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

  /* Maten kloppen pas als de letters er zijn en als een film zijn plek heeft.
     Een refresh zet de scrollpositie terug en breekt zo een lopende (smooth)
     scroll af: daarom pas verversen als er 200 ms niet gescrold is. */
  let wacht = 0;
  let nodig = false;
  const ververs = () => {
    nodig = true;
    clearTimeout(wacht);
    wacht = window.setTimeout(() => {
      nodig = false;
      ScrollTrigger.refresh();
    }, 200);
  };
  window.addEventListener('scroll', () => nodig && ververs(), { passive: true });
  document.addEventListener('uccib:film-klaar', ververs);
  document.fonts?.ready.then(ververs);
}
