/**
 * De schermpoort: wat een bezoeker ziet, in pixels gemeten.
 * `npm run verify:scherm`.
 *
 * Aanleiding: op 17-11 stond elke laag van de scroll-cinema "goed" in CSS en was
 * het scherm toch vrijwel zwart met dunne witte contourlijnen. De klacht die dat
 * opleverde kon geen enkele poort vangen, want die keek naar opacity. Opacity
 * vertelt wat de browser denkt; deze poort kijkt naar wat er echt staat: elke
 * pixel van een schermafbeelding, geteld met `lib/beeldhelderheid.mjs`.
 *
 * Twee getallen per scherm, en ze betekenen allebei iets anders:
 *   - gemiddelde helderheid (0-255): is het scherm donker uit sfeer, of is het leeg?
 *   - spreiding: heeft het beeld structuur (een foto) of is het een vlak veld?
 * Een vlak zwart scherm en een donkere foto kunnen hetzelfde gemiddelde hebben;
 * alleen de spreiding scheidt ze. Daarom zijn het er twee en niet een.
 *
 * Drie standen per route, want er zijn drie momenten waarop het mis kan gaan:
 *   1. het eerste scherm (bovenaan): hoort licht te zijn, dit is wat een
 *      bezoeker als eerste ziet;
 *   2. het midden van de hero-scène (`hero-unie`, p=0,5): de rozet groeit uit
 *      de foto en de tekst wisselt; er moet een beeld staan, geen leeg papier;
 *   3. het midden van de piek-scène (`piek-ruimtes`, p=0,5): de foto's van het
 *      gebouw vullen het podium.
 *
 * Sinds F2b PR3 bestaat de donkere gebouw-cinema niet meer (`[data-cinema]`
 * met de lagen kontour, massa en foto). De standen "cinema-opening" en
 * "cinema-einde" maten dat podium; ze zijn vervangen door de twee scènes die er
 * nu staan. De lat van het eerste scherm en die van de eindfoto zijn dezelfde
 * gebleven: het nieuwe ontwerp is licht, dus de lage lat van de donkere opening
 * dient alleen nog voor de nagemaakte tegentoetsen.
 *
 * Elke meting heeft een tegentoets. De klacht van 17-11 (bijna zwart met dunne
 * lijnen) staat er nog als nagemaakte pagina en moet FOUT blijven geven. Op de
 * echte pagina is de tegentoets nu: de foto's van de piek-scène weggehaald. Dan
 * blijft er een podium zonder beeld over en dat moet FOUT geven, ook al is de
 * CSS dan "in orde". Zonder dat geval bewijst groen niets (zelfde opzet als
 * `verify-server.mjs`).
 *
 * De schermafbeeldingen blijven bewaard (standaard `D:/tmp/win/uccib-scherm/` op
 * de laptop, `os.tmpdir()` elders, en `UCCIB_BEELD` wint altijd), zodat het
 * oordeel altijd met een verse afbeelding naast de cijfers te controleren is.
 */
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { helderheid } from './lib/beeldhelderheid.mjs';
import { openBrowser, startStaticServer } from './lib/keuring.mjs';

/**
 * Onze lat, in drie standen. De cijfers liggen onder wat de herstelde site meet
 * en boven wat de oude opening mat (zie de tabel in `voortgang/TOETS.md`), zodat
 * ze de klacht vangen zonder de bedoelde sfeer af te keuren.
 *
 *   gemeten 17-11 na de herstelling        oud (de klacht)
 *   eerste scherm   198 / 78               n.v.t.
 *   cinema-opening   30 / 20 (desktop)     ca. 13 / 1  (zwart met lijnen)
 *   cinema-einde    117 / 54               n.v.t.
 *
 * Sinds F2b PR3 (18-11): `scherm` geldt voor het eerste scherm en het midden van
 * de hero-scène, `eind` voor het midden van de piek-scène (foto's vol in beeld),
 * `opening` alleen nog voor de nagemaakte tegentoetsen.
 */
const LAT = {
  scherm: { gemiddelde: 60, spreiding: 20 },
  opening: { gemiddelde: 20, spreiding: 12 },
  eind: { gemiddelde: 60, spreiding: 30 },
};

/**
 * Waar de schermafbeeldingen heen gaan. Op de laptop `D:/tmp/win` (nooit op C:,
 * zie §20); op de CI-server bestaat dat pad niet, dus daar de tijdmap van het
 * systeem. `UCCIB_BEELD` wint in beide gevallen, zodat een run zijn bewijs zelf
 * kan aanwijzen (de CI@workflow doet dat met de bewaarmap van de actie).
 */
const UIT =
  process.env.UCCIB_BEELD ??
  (process.platform === 'win32'
    ? 'D:/tmp/win/uccib-scherm'
    : join(tmpdir(), 'uccib-scherm'));
const SCHERMEN = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobiel', { width: 390, height: 844 }],
];
const ROUTES = ['/', '/nl/', '/fr/'];

let fouten = 0;
function oordeel(goed, regel, details = []) {
  console.log((goed ? 'OK   ' : 'FOUT ') + regel);
  for (const detail of details.slice(0, 10)) console.log('       ' + detail);
  if (!goed) fouten += 1;
}

/** Meet een schermafbeelding tegen een lat. */
function meet(png, lat) {
  const { gemiddelde, spreiding, pixels } = helderheid(png);
  return {
    gemiddelde,
    spreiding,
    pixels,
    goed: gemiddelde >= lat.gemiddelde && spreiding >= lat.spreiding,
  };
}

const cijfers = (m, lat) =>
  'gemiddelde ' +
  m.gemiddelde.toFixed(1) +
  ' (lat ' +
  lat.gemiddelde +
  '), spreiding ' +
  m.spreiding.toFixed(1) +
  ' (lat ' +
  lat.spreiding +
  '), ' +
  m.pixels +
  ' pixels';

/** De klacht nagebouwd: bijna zwart met een handvol dunne witte contourlijnen. */
const TEGENTOETS_LIJNEN = `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">
<style>
  html,body{margin:0;height:100%;background:#0b0f0f;overflow:hidden}
  svg{width:100%;height:100%;display:block}
</style></head><body>
<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g fill="none" stroke="#f2f5f5" stroke-width="2" opacity="0.85">
    <path d="M120 640 L240 430 L360 640 Z"/>
    <path d="M240 640 L360 380 L480 640 Z"/>
    <path d="M360 640 L480 330 L600 640 Z"/>
    <path d="M600 640 L720 300 L840 640 Z"/>
    <path d="M840 640 L960 350 L1080 640 Z"/>
    <path d="M1080 640 L1200 420 L1320 640 Z"/>
    <path d="M120 700 H1320"/>
    <circle cx="720" cy="250" r="150"/>
  </g>
</svg></body></html>`;

/** Een vlak donker vlak: even donker als een donkere foto, maar zonder structuur. */
const TEGENTOETS_VLAK = `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:#1e2424}</style></head>
<body></body></html>`;

/**
 * Een pagina waarvan het scrollen traag tot stilstand komt, zoals de echte site.
 *
 * Zonder deze controle bewijst een groene schermkeuring niets over de wachttijd:
 * een schermafbeelding midden in de beweging kan dezelfde cijfers geven als een
 * rustig beeld. Deze pagina lost dat op door `window.scrollTo` te vervangen door
 * een eigen beweging van 1200 ms, zodat de traagheid niet afhangt van hoe snel
 * Chromium zelf scrollt. Het vlak over de pagina is fel zolang het scrollen de
 * doelhoogte niet heeft gehaald en wordt daarna een beeld met structuur.
 *
 * Met de wachttijd van `naarPodium` is het beeld dus rustig en haalt het de lat;
 * met de oude vaste 700 ms valt de schermafbeelding midden in de beweging, is het
 * vlak nog fel en zakt de spreiding naar bijna nul. Dat tweede geval is de
 * eigenlijke bewijslast: het toont dat de controle een race kán vangen.
 */
const CONTROLE_BEWEGING = `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">
<style>
  html,body{margin:0;background:#0b0f0f}
  [data-cinema]{height:200vh}
  .staart{height:200vh}
  #linnen{position:fixed;inset:0;z-index:9;background:#f2f5f5}
  #linnen.stil{background:repeating-linear-gradient(115deg,#0d1212 0 18px,#b9c6c6 18px 34px)}
</style></head><body>
<div data-cinema></div><div class="staart"></div><div id="linnen"></div>
<script>
  const ECHT = window.scrollTo.bind(window);
  const DUUR = 1200;
  window.scrollTo = (x, y) => {
    const van = window.scrollY;
    const naar = typeof y === 'number' ? y : 0;
    const start = performance.now();
    window.__schermpoortBeweegt = true;
    const stap = () => {
      const d = Math.min(1, (performance.now() - start) / DUUR);
      ECHT(0, van + (naar - van) * d);
      if (d < 1) requestAnimationFrame(stap);
      else { window.__schermpoortBeweegt = false; }
    };
    requestAnimationFrame(stap);
  };
  const linnen = document.getElementById('linnen');
  const podium = document.querySelector('[data-cinema]');
  const doel = () => podium.getBoundingClientRect().height - window.innerHeight;
  const kijk = () => {
    linnen.classList.toggle('stil', !window.__schermpoortBeweegt && window.scrollY >= doel() - 1);
    requestAnimationFrame(kijk);
  };
  requestAnimationFrame(kijk);
</script></body></html>`;

/** De scènes van de startpagina (F2b PR3). */
const HERO = '[data-sectie="hero-unie"]';
const PIEK = '[data-sectie="piek-ruimtes"]';

/** De klacht op de nieuwe pagina: de piek-scène zonder haar foto's. */
const ZONDER_FOTO = '.piek-laag,.piek-film{opacity:0!important}';

/**
 * Scrollt naar een stand van het podium en wacht tot de pagina daar stil staat.
 *
 * `html { scroll-behavior: smooth }` laat `window.scrollTo` uitlopen: gemeten op
 * 17-11 deed die beweging er 0,65 tot 0,75 s over. Een vaste wachttijd van 700 ms
 * was daardoor een wedstrijd op het scherp van de snede, en in de rij van acht
 * poorten achter elkaar verloor die wedstrijd: de schermafbeelding viel midden in
 * de beweging. `cinema.ts` rekent de stand uit `getBoundingClientRect()`, dus een
 * half opgebouwd podium gaf een veel te licht beeld (gemiddelde 253 in plaats van
 * 117). Deze functie wacht tot `window.scrollY` de doelhoogte heeft gehaald en
 * twee opeenvolgende beelden gelijk blijft, met 4000 ms als plafond. Staat de
 * pagina meteen stil (voorkeur voor minder beweging), dan gaat het direct door.
 * De doelhoogte wordt in de pagina zelf begrensd op wat er te scrollen valt, dus
 * een kortere pagina geeft geen wachttijd die afloopt.
 */
async function naarPodium(page, deel, kies = '[data-cinema]') {
  const doel = await page.evaluate(
    ([d, k]) => {
      const el = document.querySelector(k);
      if (!el) return null;
      let top = el.getBoundingClientRect().top + window.scrollY;
      let span = Math.max(0, el.getBoundingClientRect().height - window.innerHeight);
      // Een scène van de startpagina: het podium plakt onder de kop en de weg is
      // `data-lengte` schermhoogten lang (de hero drie), gemeten aan `.sh-maat`.
      const maat = el.querySelector('.sh-maat');
      const podium = el.querySelector('.hero-podium, .piek-podium');
      if (maat && podium) {
        top -= parseFloat(getComputedStyle(podium).top) || 0;
        span = maat.offsetHeight * (Number(el.dataset.lengte) || 3);
      }
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.min(Math.max(0, top + span * d), max);
      delete window.__schermpoortY;
      window.scrollTo(0, y);
      return y;
    },
    [deel, kies],
  );
  if (doel === null) return;

  await page.waitForFunction(
    (y) => {
      const nu = window.scrollY;
      const vorige = window.__schermpoortY;
      window.__schermpoortY = nu;
      return vorige !== undefined && Math.abs(nu - vorige) < 0.5 && Math.abs(nu - y) < 1.5;
    },
    doel,
    { timeout: 4000, polling: 'raf' },
  );
}

/**
 * Naar een stand van een scène. De voortgang loopt via ScrollTrigger met een
 * naloop van 0,3 s (`scrub: 0.3`), en de bewegingslaag komt pas na `load`
 * binnen: eerst wachten tot ze er is, dan scrollen, dan de naloop uitzitten.
 */
async function naarScene(page, kies, deel) {
  await page
    .waitForFunction(() => document.querySelector('[data-sectie="hero-unie"]')?.dataset.stand, null, {
      timeout: 8000,
    })
    .catch(() => {});
  await naarPodium(page, deel, kies);
  await page.waitForTimeout(800);
}

/**
 * Het vlak van het podium onder de kop. Sinds F2b PR2 staat de kop vast bovenaan
 * (DESIGNSYSTEEM 7.3, papier): over de donkere cinema is dat een lichte band van
 * 56 tot 72 px die het gemiddelde optilt (gemeten 18-11: de oude stand van 17-11
 * kwam met kop op 32,4 en haalde dan de lat van 20). De cinema-standen meten
 * daarom het venster onder de kop; het eerste scherm blijft het hele venster.
 * De lat zelf verandert niet.
 */
async function podiumBeeld(page) {
  const kop = await page.evaluate(() => {
    const h = document.querySelector('header');
    return h ? Math.max(0, Math.round(h.getBoundingClientRect().bottom)) : 0;
  });
  const v = page.viewportSize();
  return page.screenshot({ clip: { x: 0, y: kop, width: v.width, height: v.height - kop } });
}

async function schiet(page, naam) {
  await page.screenshot({ path: UIT + '/' + naam + '.png' });
}

async function tegentoets(browser, baseUrl) {
  for (const [naam, html] of [
    ['contourlijnen-op-zwart', TEGENTOETS_LIJNEN],
    ['vlak-donker-vlak', TEGENTOETS_VLAK],
  ]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const m = meet(await page.screenshot(), LAT.opening);
    await schiet(page, 'tegentoets-' + naam);
    oordeel(!m.goed, 'tegentoets ' + naam + ' wordt afgekeurd: ' + cijfers(m, LAT.opening));
    await context.close();
  }

  // De wachttijd zelf: een pagina die pas donker wordt als het scrollen stil
  // staat, moet donker meten. En met de oude vaste wachttijd van 700 ms moet
  // dezelfde pagina fel meten; zonder dat tweede geval zegt het eerste niets.
  for (const [naam, vasteWacht, moetGoed] of [
    ['met wachten tot stilstand', null, true],
    ['met de oude vaste 700 ms', 700, false],
  ]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await page.setContent(CONTROLE_BEWEGING, { waitUntil: 'load' });
      if (vasteWacht === null) {
        await naarPodium(page, 1);
      } else {
        await page.evaluate(() => {
          const el = document.querySelector('[data-cinema]');
          const span = Math.max(0, el.getBoundingClientRect().height - window.innerHeight);
          window.scrollTo(0, span);
        });
        await page.waitForTimeout(vasteWacht);
      }
      // Hier telt het gemiddelde en niet de lat van de foto. Het vlak over deze
      // pagina is fel zolang er bewogen wordt en rustig daarna; de lat van
      // `LAT.eind` vraagt ook spreiding, en die haalt een effen vlak nooit. Het
      // gemiddelde scheidt de twee standen wel scherp: 101 tegen 241.
      const m = meet(await page.screenshot(), LAT.eind);
      await schiet(page, 'controle-beweging-' + (moetGoed ? 'wacht' : 'vast'));
      const donker = m.gemiddelde < 150;
      oordeel(
        moetGoed ? donker : !donker,
        'controle beweging ' + naam + ': ' + cijfers(m, LAT.eind),
      );
    } finally {
      await context.close();
    }
  }

  // De klacht op de echte pagina: de piek-scène zonder haar foto's moet FOUT geven.
  const context = await browser.newContext({ viewport: SCHERMEN[0][1] });
  const page = await context.newPage();
  try {
    await page.goto(baseUrl + '/', { waitUntil: 'load' });
    await page.addStyleTag({ content: ZONDER_FOTO });
    await naarScene(page, PIEK, 0.5);
    const m = meet(await podiumBeeld(page), LAT.eind);
    await schiet(page, 'tegentoets-piek-zonder-foto');
    oordeel(
      !m.goed,
      "tegentoets piek-scène zonder foto's op de echte pagina wordt afgekeurd: " + cijfers(m, LAT.eind),
    );
  } finally {
    await context.close();
  }
}

const browser = await openBrowser();
const server = await startStaticServer('dist');
try {
  await mkdir(UIT, { recursive: true });
  console.log('Schermkeuring op ' + server.baseUrl);
  console.log(
    'Lat: eerste scherm ' +
      LAT.scherm.gemiddelde +
      '/' +
      LAT.scherm.spreiding +
      ', hero-midden ' +
      LAT.scherm.gemiddelde +
      '/' +
      LAT.scherm.spreiding +
      ', tegentoets donker ' +
      LAT.opening.gemiddelde +
      '/' +
      LAT.opening.spreiding +
      ', piek-midden ' +
      LAT.eind.gemiddelde +
      '/' +
      LAT.eind.spreiding,
  );
  console.log('');
  console.log('Tegentoets (de nagemaakte gevallen moeten FOUT geven)');
  await tegentoets(browser, server.baseUrl);

  console.log('');
  console.log('De echte site');
  for (const [scherm, view] of SCHERMEN) {
    for (const route of ROUTES) {
      const context = await browser.newContext({ viewport: view, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const foutmeldingen = [];
      page.on('pageerror', (e) => foutmeldingen.push(String(e.message)));
      const kort = route === '/' ? 'tr' : route.slice(1, -1);
      try {
        await page.goto(server.baseUrl + route, { waitUntil: 'load' });
        // Het podium stelt zich in op de eerste rAF-tikken en staat daarna stil
        // tot de bezoeker scrollt. 1000 ms is ruim en maakt de meting herhaalbaar.
        await page.waitForTimeout(1000);

        const eerste = meet(await page.screenshot(), LAT.scherm);
        await schiet(page, scherm + '-' + kort + '-eerste-scherm');
        oordeel(
          eerste.goed,
          scherm + ' ' + route + ' eerste scherm: ' + cijfers(eerste, LAT.scherm),
          [
            'afbeelding: ' + UIT + '/' + scherm + '-' + kort + '-eerste-scherm.png',
            ...(foutmeldingen.length ? ['fout in de pagina: ' + foutmeldingen.join(' | ')] : []),
          ],
        );

        await naarScene(page, HERO, 0.5);
        const hero = meet(await podiumBeeld(page), LAT.scherm);
        await schiet(page, scherm + '-' + kort + '-hero-midden');
        oordeel(hero.goed, scherm + ' ' + route + ' hero-midden: ' + cijfers(hero, LAT.scherm), [
          'afbeelding: ' + UIT + '/' + scherm + '-' + kort + '-hero-midden.png',
        ]);

        await naarScene(page, PIEK, 0.5);
        const piek = meet(await podiumBeeld(page), LAT.eind);
        await schiet(page, scherm + '-' + kort + '-piek-midden');
        oordeel(piek.goed, scherm + ' ' + route + ' piek-midden: ' + cijfers(piek, LAT.eind), [
          'afbeelding: ' + UIT + '/' + scherm + '-' + kort + '-piek-midden.png',
        ]);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await server.close();
}

console.log('');
console.log('Schermafbeeldingen: ' + UIT);
if (fouten > 0) {
  console.log('verify-eerste-scherm: ' + fouten + ' fout(en)');
  process.exit(1);
}
console.log('verify-eerste-scherm: elk scherm is een beeld, geen leeg vlak');
