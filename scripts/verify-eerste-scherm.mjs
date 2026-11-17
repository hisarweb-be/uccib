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
 *   2. de opening van de cinema (podium vastgepind op p=0): donker mag, want de
 *      foto komt uit het donker, maar het moet een foto zijn en geen vlak veld;
 *   3. het einde van de cinema (p=1): de eindfoto staat vol in beeld.
 *
 * Elke meting heeft een tegentoets, en de belangrijkste daarvan is de klacht zelf
 * op de echte pagina nagebootst: de oude stand van 17-11 (donkere foto uit,
 * contour vol) moet FOUT geven, ook al is de CSS dan "in orde". Zonder dat geval
 * bewijst groen niets (zelfde opzet als `verify-server.mjs`).
 *
 * De schermafbeeldingen blijven bewaard in `D:/tmp/win/uccib-scherm/`, zodat het
 * oordeel altijd met een verse afbeelding naast de cijfers te controleren is.
 */
import { mkdir } from 'node:fs/promises';

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
 */
const LAT = {
  scherm: { gemiddelde: 60, spreiding: 20 },
  opening: { gemiddelde: 20, spreiding: 12 },
  eind: { gemiddelde: 60, spreiding: 30 },
};

const UIT = 'D:/tmp/win/uccib-scherm';
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

/** De oude stand van 17-11: de donkere foto uit beeld, de contour vol. */
const OUDE_STAND = 'html.cinema-aan .cinema-laag[data-laag="massa"]{opacity:0!important}';

/** Scrollt naar het podium en zet de voortgang op `deel` (0 = opening, 1 = eind). */
async function naarPodium(page, deel) {
  await page.evaluate((d) => {
    const el = document.querySelector('[data-cinema]');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = Math.max(0, el.getBoundingClientRect().height - window.innerHeight);
    window.scrollTo(0, top + span * d);
  }, deel);
  await page.waitForTimeout(700);
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

  // De klacht op de echte pagina: de oude stand van 17-11 moet FOUT geven.
  const context = await browser.newContext({ viewport: SCHERMEN[0][1] });
  const page = await context.newPage();
  try {
    await page.goto(baseUrl + '/', { waitUntil: 'load' });
    await page.addStyleTag({ content: OUDE_STAND });
    await naarPodium(page, 0);
    const m = meet(await page.screenshot(), LAT.opening);
    await schiet(page, 'tegentoets-oude-stand');
    oordeel(
      !m.goed,
      'tegentoets oude stand van 17-11 op de echte pagina wordt afgekeurd: ' +
        cijfers(m, LAT.opening),
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
      ', cinema-opening ' +
      LAT.opening.gemiddelde +
      '/' +
      LAT.opening.spreiding +
      ', cinema-einde ' +
      LAT.eind.gemiddelde +
      '/' +
      LAT.eind.spreiding,
  );
  console.log('');
  console.log('Tegentoets (deze drie moeten FOUT geven)');
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

        await naarPodium(page, 0);
        const opening = meet(await page.screenshot(), LAT.opening);
        await schiet(page, scherm + '-' + kort + '-cinema-opening');
        oordeel(
          opening.goed,
          scherm + ' ' + route + ' cinema-opening: ' + cijfers(opening, LAT.opening),
          ['afbeelding: ' + UIT + '/' + scherm + '-' + kort + '-cinema-opening.png'],
        );

        await naarPodium(page, 1);
        const eind = meet(await page.screenshot(), LAT.eind);
        await schiet(page, scherm + '-' + kort + '-cinema-einde');
        oordeel(
          eind.goed,
          scherm + ' ' + route + ' cinema-einde: ' + cijfers(eind, LAT.eind),
          ['afbeelding: ' + UIT + '/' + scherm + '-' + kort + '-cinema-einde.png'],
        );
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
