/**
 * Startpagina: het kleine stuk dat in de eerste bundel zit.
 *
 * Het meet de echte hoogte van de kop (het podium plakt eronder) en haalt de
 * scène pas op als de bezoeker iets doet (scrollen, aanraken, een toets), als
 * de bezoeker beweging wil en het venster hoog genoeg is. Er is bewust geen
 * wekker: de oude van 3 s na `load` liet het zware laden (GSAP, 64 verzoeken)
 * in het meetvenster van Lighthouse vallen (herkeuring F2b: 82 en 84). Het
 * eerste scherm is bij
 * p 0 af zonder script; de scène opstarten (GSAP, maten, de frame-reeks) kostte
 * meteen na `load` tot 1,8 s rekentijd op een trage telefoon (keuring F2b,
 * herstelpunt 1). Staat de pagina bij `load` al voorbij de top (herladen
 * halverwege, een anker), dan start ze meteen. GSAP zit dus niet in de eerste
 * bundel en laadt alleen op de startpagina.
 * Lukt het laden niet, dan zet `home-stil` de pagina terug in de stille stand:
 * alles onder elkaar en leesbaar.
 */
const wortel = document.documentElement;
const kop = document.querySelector<HTMLElement>('.kop');

/**
 * De kop wordt gemeten door een ResizeObserver: die meldt zich ná de gewone
 * opmaak, dus zonder een gedwongen opmaak van de hele pagina in het eerste
 * scherm (gemeten met Lighthouse: 350 ms op een trage telefoon).
 */
function meetKop(hoogte: number) {
  if (!hoogte || !kop) return;
  // Klopt de standaard uit de CSS (balkhoogte plus haarlijn) al, dan niets
  // zetten: een variabele op de wortel herberekent de stijl van de hele pagina
  // (keuring F2b, herstelpunt 1: de lange taak meteen na het eerste scherm).
  const balk = kop.querySelector<HTMLElement>('.balk');
  const standaard = balk
    ? Math.round(parseFloat(getComputedStyle(balk).minHeight) + parseFloat(getComputedStyle(kop).borderBottomWidth))
    : NaN;
  const waarde = hoogte === standaard ? '' : `${hoogte}px`;
  if (wortel.style.getPropertyValue('--kop-echt') === waarde) return;
  if (waarde) wortel.style.setProperty('--kop-echt', waarde);
  else wortel.style.removeProperty('--kop-echt');
}

if (kop) {
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver((rijen) => {
      const maat = rijen[0]?.borderBoxSize?.[0]?.blockSize;
      meetKop(Math.round(maat ?? kop.offsetHeight));
    }).observe(kop, { box: 'border-box' });
  } else {
    meetKop(kop.offsetHeight);
    window.addEventListener('resize', () => meetKop(kop.offsetHeight), { passive: true });
  }
}

const hoogGenoeg = window.matchMedia('(min-height: 35rem)');

function laadScene() {
  if (!wortel.classList.contains('beweging-aan') || !hoogGenoeg.matches) return;
  if (!document.querySelector('[data-sectie="hero-unie"], [data-sectie="piek-ruimtes"]')) return;
  import('./scene')
    .then((scene) => scene.start())
    .catch(() => wortel.classList.add('home-stil'));
}

const INTENTIE = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
let gestart = false;
function bijIntentie() {
  if (gestart) return;
  gestart = true;
  for (const soort of INTENTIE) window.removeEventListener(soort, bijIntentie);
  laadScene();
}

function naLoad() {
  for (const soort of INTENTIE) window.addEventListener(soort, bijIntentie, { passive: true });
  if (location.hash) return bijIntentie();
  // scrollY pas lezen na het volgende beeld: meteen in `load` dwingt het een
  // volledige opmaak af (trace herstel F2b-1: 48 ms, x4 op een trage telefoon).
  // Dit start de scène alleen als de pagina al voorbij de top staat; het is geen
  // wekker. Wie niets doet, krijgt geen scène: het eerste scherm is af zonder.
  requestAnimationFrame(() => setTimeout(() => window.scrollY > 0 && bijIntentie(), 0));
}

interface Verbinding {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * De film van de hero (bijsturing eigenaar 19 nov, B1). Hij speelt vanzelf, los
 * van de scène, maar pas na `load` in rust: de poster blijft het LCP-beeld en de
 * video (`preload="none"`, zonder bron in de HTML) valt buiten het eerste beeld.
 * Zonder beweging of op een zuinige verbinding blijft de poster staan. De video
 * wordt pas zichtbaar als hij echt speelt; tot dan staat de poster eronder.
 */
function heroFilm() {
  if (!wortel.classList.contains('beweging-aan')) return;
  const verbinding = (navigator as Navigator & { connection?: Verbinding }).connection;
  if (verbinding?.saveData || /(^|-)(2g|3g)$/.test(verbinding?.effectiveType ?? '')) return;
  const video = document.querySelector<HTMLVideoElement>('video.hero-video');
  if (!video) return;
  const smal = window.matchMedia(video.dataset.smal ?? '(max-width: 47.9375rem)').matches;
  const d = video.dataset;
  const paar = (bp: 'd' | 'm') => [d[`${bp}Webm`], d[`${bp}Mp4`]].filter((pad): pad is string => Boolean(pad));
  const bronnen = smal && paar('m').length ? paar('m') : paar('d');
  if (!bronnen.length) return;
  for (const pad of bronnen) {
    const bron = document.createElement('source');
    bron.src = pad;
    bron.type = pad.endsWith('.webm') ? 'video/webm' : 'video/mp4';
    video.append(bron);
  }
  video.addEventListener('playing', () => video.classList.add('is-klaar'), { once: true });
  video.muted = true;
  video.load();
  video.play()?.catch(() => {
    /* Autoplay geweigerd (energiebesparing): de poster blijft staan. */
  });
}

function inRust(doe: () => void) {
  const rust = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
    .requestIdleCallback;
  if (rust) rust(doe, { timeout: 2000 });
  else setTimeout(doe, 200);
}

function bijLoad() {
  naLoad();
  inRust(heroFilm);
}

if (document.readyState === 'complete') bijLoad();
else window.addEventListener('load', bijLoad, { once: true });
