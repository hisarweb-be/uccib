/**
 * Startpagina: het kleine stuk dat in de eerste bundel zit.
 *
 * Het meet de echte hoogte van de kop (het podium plakt eronder) en haalt de
 * scène pas op als de bezoeker iets doet (scrollen, aanraken, een toets) of
 * uiterlijk 3 s na `load`, als de bezoeker beweging wil en het venster hoog
 * genoeg is. Het eerste scherm is bij
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
const NA_RUST_MS = 3000;
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
  requestAnimationFrame(() => setTimeout(() => window.scrollY > 0 && bijIntentie(), 0));
  // Wie niets doet, krijgt de scène toch klaar voor de eerste scroll: na de rust
  // die op het eerste scherm volgt, niet erin.
  setTimeout(bijIntentie, NA_RUST_MS);
}

if (document.readyState === 'complete') naLoad();
else window.addEventListener('load', naLoad, { once: true });
