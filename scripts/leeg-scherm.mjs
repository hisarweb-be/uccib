/**
 * Geen leeg of bijna zwart scherm, op welke scrollpositie ook.
 * `npm run verify:leeg` of `node scripts/leeg-scherm.mjs [basis-url]`.
 *
 * Aanleiding: de oude scroll-cinema gaf bij het scrollen schermen die voor 60 tot
 * 100 % bijna zwart waren, of helemaal leeg (BRIEF d-01, d-02, m-01). Een keuring
 * van één beginscherm vangt dat niet: het lege scherm zat halverwege de scroll.
 * Deze poort loopt daarom de hele voorpagina af in drie talen, op vaste posities
 * (CONTRACT: 12 op 1440 x 900, 8 op 390 x 844; daarnaast 10 op 768 en 8 op 375),
 * in vier varianten:
 *
 *   film          gewoon, met JavaScript en beweging
 *   plaatshouder  de frame-reeksen (`f-0001.webp` ...) worden tegengehouden, zodat
 *                 alleen posters overblijven: zo ziet een bezoeker de pagina als de
 *                 film niet laadt (CONTRACT: ook met de plaatshouder groen)
 *   stil          `prefers-reduced-motion: reduce`
 *   zonder-js     JavaScript uit
 *
 * Per positie, gemeten op wat de bezoeker ziet (schermafbeelding), niet op CSS:
 *   1. licht: minstens 60 % van het scherm is papier, wit of beeld boven 35 %
 *      helderheid (DESIGNSYSTEEM, "geen scherm bijna zwart"), in vakken van 16 px;
 *   2. niet leeg: er staat tekst of beeld in het venster (buiten de vaste kop en de
 *      WhatsApp-knop) en het beeld heeft spreiding, dus geen effen vlak;
 *   3. knopzone: in de 88 x 88 px rechtsonder staat geen tekst (DESIGNSYSTEEM,
 *      WhatsApp-knop), de knop zelf uitgezonderd. Tekst die gewoon onder de
 *      zwevende knop door scrolt, telt niet; wel tekst die daar vast staat (in een
 *      fixed of sticky laag, zoals een vastgezette scène of een vermelding) en
 *      alles op de laatste positie, waar de bezoeker niet verder kan scrollen.
 *
 * Tegentoetsen vooraf bewijzen dat de poort een zwart, een leeg en een bezette
 * knopzone kan afkeuren.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { helderheid, lichtAandeel } from './lib/beeldhelderheid.mjs';
import { LOCALES, openBrowser, pagePath, startStaticServer } from './lib/keuring.mjs';

/** DESIGNSYSTEEM: minstens 60 % licht, licht is boven 35 % helderheid. */
const MIN_LICHT = 0.6;
/** Onder deze spreiding is het scherm een effen vlak (gemeten: papier met één kop haalt ruim 15). */
const MIN_SPREIDING = 6;
/** Gereserveerde zone van de WhatsApp-knop, rechtsonder. */
const KNOPZONE = 88;

const SCHERMEN = [
  ['1440', { width: 1440, height: 900 }, 12],
  ['768', { width: 768, height: 1024 }, 10],
  ['390', { width: 390, height: 844 }, 8],
  ['375', { width: 375, height: 812 }, 8],
];
const VARIANTEN = ['film', 'plaatshouder', 'stil', 'zonder-js'];
const FRAMES = /\/media\/wow\/[^?]*\/f-\d+\.(webp|avif)(\?|$)/;

const UIT =
  process.env.UCCIB_BEELD !== undefined
    ? join(process.env.UCCIB_BEELD, 'leeg-scherm')
    : process.platform === 'win32'
      ? 'D:/tmp/win/uccib-leeg-scherm'
      : join(tmpdir(), 'uccib-leeg-scherm');

let fouten = 0;
function oordeel(goed, regel, details = []) {
  console.log((goed ? 'OK   ' : 'FOUT ') + regel);
  for (const d of details.slice(0, 12)) console.log('       ' + d);
  if (details.length > 12) console.log('       ... en nog ' + (details.length - 12));
  if (!goed) fouten += 1;
}

/**
 * In de pagina: is er inhoud in het venster, en staat er tekst in de knopzone?
 * Tekst telt via de rechthoeken van tekstnodes; beeld via img, svg, video en
 * canvas. Wat volledig doorzichtig is (opacity 0 ergens in de keten) of
 * `visibility: hidden` heeft, telt niet.
 */
function meetDom({ zone, eind }) {
  const breed = document.documentElement.clientWidth;
  const hoog = window.innerHeight;
  const zichtbaar = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    }
    return true;
  };
  const vastGezet = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const p = getComputedStyle(e).position;
      if (p === 'fixed' || p === 'sticky') return true;
    }
    return false;
  };
  const buitenRand = (el) => el.closest('header, .wa-wrap, .skip-link, dialog:not([open])');
  const inVenster = (r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < hoog && r.right > 0 && r.left < breed;
  let inhoud = 0;
  const inZone = [];
  const bereik = document.createRange();
  const loper = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = loper.nextNode(); n; n = loper.nextNode()) {
    if (!n.textContent.trim()) continue;
    const ouder = n.parentElement;
    if (!ouder || ouder.closest('script, style, noscript, template')) continue;
    bereik.selectNodeContents(n);
    const rects = [...bereik.getClientRects()].filter(inVenster);
    if (rects.length === 0 || !zichtbaar(ouder)) continue;
    if (!buitenRand(ouder)) inhoud += 1;
    if (ouder.closest('.wa-wrap')) continue;
    const raakt = rects.some((r) => r.right > breed - zone && r.bottom > hoog - zone && r.left < breed && r.top < hoog);
    if (raakt && (eind || vastGezet(ouder))) inZone.push(n.textContent.trim().slice(0, 30));
  }
  for (const el of document.querySelectorAll('img, svg, video, canvas, picture')) {
    if (buitenRand(el)) continue;
    if (inVenster(el.getBoundingClientRect()) && zichtbaar(el)) inhoud += 1;
  }
  return { inhoud, inZone };
}

/** Scrollt zonder uitloop naar y en wacht tot de pagina en de beelden in beeld stil staan. */
async function naar(page, y, metJs) {
  if (metJs) {
    await page.evaluate((doel) => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, doel);
    }, y);
  } else {
    // Zonder JavaScript draait page.evaluate niet in de pagina; de muis scrollt wel.
    const nu = await page.evaluate(() => window.scrollY).catch(() => null);
    await page.mouse.wheel(0, y - (nu ?? 0));
  }
  await page.waitForTimeout(450);
  await page
    .waitForFunction(
      () =>
        [...document.images].every((img) => {
          const r = img.getBoundingClientRect();
          const inBeeld = r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
          return !inBeeld || img.complete;
        }),
      null,
      { timeout: 5000 },
    )
    .catch(() => {});
  await page.waitForTimeout(150);
}

async function keurScherm(page, label, kaart, eind = true) {
  const png = await page.screenshot();
  const { spreiding } = helderheid(png);
  const licht = lichtAandeel(png);
  const dom = await page.evaluate(meetDom, { zone: KNOPZONE, eind });
  const fout = [];
  if (licht < MIN_LICHT) fout.push('bijna zwart: ' + Math.round(licht * 100) + ' % licht (lat ' + MIN_LICHT * 100 + ')');
  if (dom.inhoud === 0 || spreiding < MIN_SPREIDING) fout.push('leeg: ' + dom.inhoud + ' delen inhoud, spreiding ' + spreiding.toFixed(1));
  if (dom.inZone.length > 0) fout.push('tekst in de knopzone: ' + dom.inZone.slice(0, 3).join(' | '));
  if (fout.length > 0) {
    const pad = join(UIT, label.replace(/[^\w.-]+/g, '_') + '.png');
    await writeFile(pad, png);
    kaart.push(label + ': ' + fout.join('; ') + ' (' + pad + ')');
  }
  return { licht, spreiding };
}

/* ── Tegentoetsen ── */

async function tegentoets(browser) {
  const gevallen = [
    ['zwart scherm', '<body style="margin:0;background:#0b0f0f;color:#fff"><h1>Kop</h1></body>', true],
    ['leeg papier', '<body style="margin:0;background:#f2f6f5"><div style="height:3000px"></div></body>', true],
    [
      'vaste tekst in de knopzone, midden in de scroll',
      '<body style="margin:0;background:#f2f6f5"><h1>Kop</h1><p style="position:fixed;right:10px;bottom:10px;margin:0">vermelding</p></body>',
      true,
      false,
    ],
    ['gewone pagina', '<body style="margin:0;background:#f2f6f5;font:20px sans-serif"><h1>Kop</h1><p>Een regel tekst.</p></body>', false],
    [
      'doorlopende tekst onder de knop, midden in de scroll',
      '<body style="margin:0;background:#f2f6f5;font:20px sans-serif"><h1>Kop</h1><p style="margin-top:700px;text-align:right">tekst die voorbij scrolt</p></body>',
      false,
      false,
    ],
    [
      'dezelfde tekst op de laatste positie',
      '<body style="margin:0;background:#f2f6f5;font:20px sans-serif"><h1>Kop</h1><p style="margin-top:700px;text-align:right">tekst die voorbij scrolt</p></body>',
      true,
    ],
  ];
  for (const [naam, body, moetFout, eind = true] of gevallen) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head>' + body + '</html>');
      const kaart = [];
      await keurScherm(page, 'tegentoets-' + naam, kaart, eind);
      oordeel(moetFout ? kaart.length > 0 : kaart.length === 0, 'tegentoets ' + naam + (moetFout ? ' wordt afgekeurd' : ' gaat door'), kaart);
    } finally {
      await context.close();
    }
  }
}

/* ── De voorpagina ── */

async function keurVoorpagina(browser, basis) {
  for (const variant of VARIANTEN) {
    const kaart = [];
    let telling = 0;
    let laagsteLicht = 1;
    for (const [naam, viewport, posities] of SCHERMEN) {
      const context = await browser.newContext({
        viewport,
        javaScriptEnabled: variant !== 'zonder-js',
        reducedMotion: variant === 'stil' ? 'reduce' : 'no-preference',
        hasTouch: viewport.width < 768,
      });
      if (variant === 'plaatshouder') await context.route(FRAMES, (route) => route.abort());
      const page = await context.newPage();
      try {
        for (const locale of LOCALES) {
          await page.goto(basis + pagePath(locale, ''), { waitUntil: 'load' });
          await page.waitForTimeout(300);
          const hoogte = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
          for (let i = 0; i < posities; i += 1) {
            const y = Math.round((hoogte * i) / (posities - 1));
            await naar(page, y, variant !== 'zonder-js');
            const m = await keurScherm(page, variant + '-' + naam + '-' + locale + '-' + i + '-y' + y, kaart, i === posities - 1);
            laagsteLicht = Math.min(laagsteLicht, m.licht);
            telling += 1;
          }
        }
      } finally {
        await context.close();
      }
    }
    oordeel(
      kaart.length === 0,
      variant + ': ' + telling + ' schermen (1440/768/390/375, drie talen) zonder leeg of bijna zwart scherm en met een vrije knopzone (laagste licht ' +
        Math.round(laagsteLicht * 100) +
        ' %)',
      kaart,
    );
  }
}

/* ── Uitvoeren ── */

await mkdir(UIT, { recursive: true });
const opgegeven = process.argv.slice(2).find((a) => /^https?:\/\//.test(a));
const server = opgegeven ? null : await startStaticServer(resolve('dist'));
const basis = (opgegeven ?? server.baseUrl).replace(/\/$/, '');
const browser = await openBrowser();
try {
  console.log('Leeg-scherm-keuring op ' + basis);
  await tegentoets(browser);
  await keurVoorpagina(browser, basis);
} finally {
  await browser.close();
  await server?.close();
}
if (fouten > 0) {
  console.log('leeg-scherm: ' + fouten + ' fout(en); beelden in ' + UIT);
  process.exit(1);
}
console.log('leeg-scherm: alles klopt');
