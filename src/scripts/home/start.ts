/**
 * Startpagina: het kleine stuk dat in de eerste bundel zit.
 *
 * Het meet de echte hoogte van de kop (het podium plakt eronder) en haalt de
 * scène pas ná `load` op, als de bezoeker beweging wil en het venster hoog genoeg
 * is. GSAP zit dus niet in de eerste bundel en laadt alleen op de startpagina.
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
  if (!hoogte) return;
  const waarde = `${hoogte}px`;
  if (wortel.style.getPropertyValue('--kop-echt') !== waarde) wortel.style.setProperty('--kop-echt', waarde);
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

if (document.readyState === 'complete') laadScene();
else window.addEventListener('load', laadScene, { once: true });
