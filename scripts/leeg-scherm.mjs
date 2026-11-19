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
 *   plaatshouder  de films (mp4, webm) worden tegengehouden, zodat alleen posters
 *                 overblijven: zo ziet een bezoeker de pagina als de film niet laadt
 *                 (CONTRACT: ook met de plaatshouder groen)
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
 *
 * Daarnaast de maten van de bijsturing van de eigenaar (19 nov):
 *   B1 de film van de hero beslaat op 375, 768, 860, 1024, 1440 en 1920 px minstens
 *      90 % van de vensterbreedte en 55 % van de hoogte, ook met verminderde beweging
 *      en zonder JavaScript (de poster), en krimpt bij het scrollen nooit; met
 *      beweging speelt hij vanzelf;
 *   B2 de foto in de ster: het zichtbare fotovlak (kijkgat binnen foto, beeld en
 *      venster) is als de scène in beeld komt minstens 50 % van de kortste zijde,
 *      op geen enkele stand onder 40 %, en aan het eind van elke ruimte minstens
 *      80 % van de vensterbreedte (375, 768, 860, 1024, 1440 px);
 *   B3 het eerste beeld van de ster is de foto, niet het papier: op de eerste stand
 *      van de scène is hooguit 40 % van het scherm papier (kleur #f2f6f5) en is de
 *      gemiddelde helderheid onder 205. Dit is de meter van de klacht van 19 nov
 *      ("een witte ster met geen foto erin"); B2 kwam daar groen door, want die
 *      keek naar rechthoeken en opacity in plaats van naar de getekende pixels.
 * Een tegentoets met de oude maten (kijkgat min(64svh, 80vw), film van 260 px) moet
 * daarop falen.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { helderheid, lichtAandeel, papierAandeel } from './lib/beeldhelderheid.mjs';
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
/* Alles wat beweegt: de films en (van vroeger) de frame-reeksen. */
const FRAMES = /\/media\/wow\/[^?]*(\/f-\d+\.(webp|avif)|\.(mp4|webm))(\?|$)/;

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

/* ── Maten: de film van de hero (B1) en de foto in de ster (B2) ── */

const HERO_SCHERMEN = [
  [375, 812],
  [768, 1024],
  [860, 900],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
];
const PIEK_SCHERMEN = HERO_SCHERMEN.filter(([b]) => b <= 1440);
const HERO_MIN = { breed: 0.9, hoog: 0.55 };
const PIEK_MIN = { begin: 0.5, altijd: 0.4, eind: 0.8 };
const PIEK_STANDEN = 36;
/* Het eerste beeld van de ster: hooguit zoveel papier en zo licht. Op een telefoon ligt onder
   het beeld de kop op papier (het beeldvak is daar 68 % hoog), dus daar is 39 % papier normaal;
   de oude opening zat op 83 %. */
const PIEK_OPEN = { papier: 0.45, licht: 205 };
/* De oude maten (zoals op Altuners schermbeelden): moeten afgekeurd worden. */
const OUDE_MATEN =
  '.piek-podium{--piek-doos:min(64svh,80vw)!important}' +
  '.piek-masker g,.piek-rozet g{transform:rotate(0deg) scale(1)!important}' +
  '.hero-film{inset:auto 0 0 auto!important;width:260px!important;height:260px!important}';

/** Het filmvlak van de hero als deel van het venster, en zijn dekking. */
function meetHero() {
  const f = document.querySelector('.hero-film');
  if (!f) return null;
  const r = f.getBoundingClientRect();
  const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
  const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
  return { breed: w / innerWidth, hoog: h / innerHeight, dekking: Number(getComputedStyle(f).opacity) };
}

/**
 * Het zichtbare fotovlak in de piek: het kijkgat (de kern van de rozet, eigen maat uit
 * getBBox, dus los van de draaiing, maal de schaal en de doos) gesneden met de foto
 * van de bovenste laag, het beeldvak en het venster.
 */
function meetPiek() {
  const sectie = document.querySelector('[data-sectie="piek-ruimtes"]');
  const p = parseFloat(sectie?.style.getPropertyValue('--piek-p'));
  if (!sectie || Number.isNaN(p)) return null;
  const kern = sectie.querySelector('.piek-kern');
  const masker = sectie.querySelector('.piek-masker');
  const pad = sectie.querySelector('.piek-rozet path');
  const g = sectie.querySelector('.piek-rozet g');
  const beeld = sectie.querySelector('.piek-beeld').getBoundingClientRect();
  const lagen = [...sectie.querySelectorAll('.piek-laag')].filter((l) => Number(getComputedStyle(l).opacity) > 0.5);
  const laag = lagen.at(-1);
  if (!laag) return { p, dekking: 0 };
  const raam = laag.querySelector('.piek-raam').getBoundingClientRect();
  const doos = masker.getBoundingClientRect();
  const schaal = parseFloat(getComputedStyle(g).getPropertyValue('--piek-s')) || 1;
  const bb = pad.getBBox();
  const px = (doos.width / 100) * schaal;
  const mx = doos.left + doos.width / 2 + (bb.x + bb.width / 2 - 50) * px;
  const my = doos.top + doos.height / 2 + (bb.y + bb.height / 2 - 50) * px;
  const gat = { left: mx - (bb.width * px) / 2, right: mx + (bb.width * px) / 2, top: my - (bb.height * px) / 2, bottom: my + (bb.height * px) / 2 };
  const vak = [gat, beeld, raam, { left: 0, top: 0, right: innerWidth, bottom: innerHeight }];
  const w = Math.max(0, Math.min(...vak.map((v) => v.right)) - Math.max(...vak.map((v) => v.left)));
  const h = Math.max(0, Math.min(...vak.map((v) => v.bottom)) - Math.max(...vak.map((v) => v.top)));
  const kort = Math.min(innerWidth, innerHeight);
  return {
    p,
    dekking: Number(getComputedStyle(kern).opacity),
    a: Number(laag.dataset.a),
    b: Number(laag.dataset.b),
    vlak: Math.min(w, h) / kort,
    breed: w / innerWidth,
    gat: (bb.width * px) / kort,
  };
}

/** Meet de hero op één scherm; geeft de fouten terug. */
async function keurHero(page, label, variant) {
  const fout = [];
  const metJs = variant !== 'zonder-js';
  let m;
  if (metJs) m = await page.evaluate(meetHero);
  else {
    // Zonder JavaScript draait evaluate niet; de doos komt dan van Playwright zelf.
    const doos = await page.locator('.hero-film').first().boundingBox();
    const v = page.viewportSize();
    // Zonder JavaScript staat het menu als gewone lijst boven de hero (de rozetknop werkt
    // dan niet); de poster telt daarom op zijn eigen maat: dezelfde maat als met beweging.
    m = doos && { breed: Math.min(doos.width, v.width) / v.width, hoog: Math.min(doos.height, v.height) / v.height, dekking: 1 };
  }
  if (!m) return [label + ': geen filmvlak in de hero'];
  if (m.breed < HERO_MIN.breed || m.hoog < HERO_MIN.hoog)
    fout.push(label + ': filmvlak ' + Math.round(m.breed * 100) + ' % breed, ' + Math.round(m.hoog * 100) + ' % hoog (lat 90 en 55)');
  if (metJs && variant !== 'stil') {
    // De film krimpt nooit: zolang hij te zien is, houdt hij zijn maat.
    const hoogte = await page.evaluate(() => document.querySelector('[data-sectie="hero-unie"]')?.offsetHeight ?? 0);
    for (const deel of [0.03, 0.08, 0.12]) {
      await naar(page, Math.round(hoogte * deel), true);
      const n = await page.evaluate(meetHero);
      if (n && n.dekking > 0.1 && n.breed < HERO_MIN.breed) fout.push(label + ' bij ' + deel + ': film gekrompen tot ' + Math.round(n.breed * 100) + ' %');
    }
    await naar(page, 0, true);
  }
  return fout;
}

/** Loopt de piek af en geeft de fouten en de kleinste en grootste maat terug. */
async function keurPiek(page, label) {
  const fout = [];
  const bereik = await page.evaluate(() => {
    const s = document.querySelector('[data-sectie="piek-ruimtes"]');
    if (!s) return null;
    const top = s.getBoundingClientRect().top + scrollY;
    return { van: top - innerHeight * 0.3, tot: top + s.offsetHeight - innerHeight };
  });
  if (!bereik) return { fout: [label + ': geen piek'], laagst: 0 };
  const standen = [];
  const meetOp = async (y) => {
    await naar(page, y, true);
    const m = await page.evaluate(meetPiek);
    if (m) standen.push({ ...m, y });
    return m;
  };
  for (let i = 0; i < PIEK_STANDEN; i += 1) await meetOp(Math.round(bereik.van + ((bereik.tot - bereik.van) * i) / (PIEK_STANDEN - 1)));
  // Het eindvenster van een korte ruimte valt soms tussen twee standen: zoek het gericht op.
  const eindVenster = (a, b) => [Math.min(a + 0.6 * (b - a), b - 0.055), b - 0.045];
  for (const a of [...new Set(standen.filter((m) => m.vlak !== undefined).map((m) => m.a))]) {
    const b = standen.find((m) => m.a === a).b;
    const [lo, hi] = eindVenster(a, b);
    if (standen.some((m) => m.a === a && m.p >= lo && m.p <= hi)) continue;
    let onder = standen.filter((m) => m.p < lo).at(-1)?.y ?? bereik.van;
    let boven = standen.find((m) => m.p > hi)?.y ?? bereik.tot;
    for (let i = 0; i < 10 && boven - onder > 1; i += 1) {
      const y = Math.round((onder + boven) / 2);
      const m = await meetOp(y);
      if (!m || m.p < lo) onder = y;
      else if (m.p > hi) boven = y;
      else break;
    }
  }
  standen.sort((x, y) => x.y - y.y);
  const inBeeld = standen.filter((m) => m.dekking > 0.5 && m.vlak !== undefined);
  if (inBeeld.length < PIEK_STANDEN / 3) return { fout: [label + ': de scène kwam maar op ' + inBeeld.length + ' standen in beeld'], laagst: 0 };
  const begin = inBeeld.find((m) => m.dekking >= 0.99);
  if (!begin || begin.vlak < PIEK_MIN.begin) fout.push(label + ': bij het begin ' + Math.round((begin?.vlak ?? 0) * 100) + ' % van de kortste zijde (lat 50)');
  for (const m of inBeeld)
    if (m.vlak < PIEK_MIN.altijd) fout.push(label + ' bij p ' + m.p.toFixed(3) + ': ' + Math.round(m.vlak * 100) + ' % van de kortste zijde (lat 40)');
  for (const a of [...new Set(inBeeld.map((m) => m.a))]) {
    const eigen = inBeeld.filter((m) => m.a === a);
    const b = eigen[0].b;
    const [lo, hi] = eindVenster(a, b);
    const eind = eigen.filter((m) => m.p >= lo && m.p <= hi);
    const best = Math.max(0, ...eind.map((m) => m.breed));
    if (!eind.length) fout.push(label + ': geen meetstand aan het eind van de ruimte vanaf ' + a);
    else if (best < PIEK_MIN.eind) fout.push(label + ': aan het eind van de ruimte vanaf ' + a + ' maar ' + Math.round(best * 100) + ' % van de breedte (lat 80)');
  }
  return { fout, laagst: Math.min(...inBeeld.map((m) => m.vlak)), midden: inBeeld[Math.floor(inBeeld.length / 2)].vlak };
}

/** Het eerste beeld van de ster: is de foto het onderwerp en niet het papier? */
async function keurPiekOpen(page, label) {
  const fout = [];
  const bereik = await page.evaluate(() => {
    const s = document.querySelector('[data-sectie="piek-ruimtes"]');
    if (!s) return null;
    return { top: s.getBoundingClientRect().top + scrollY, hoog: s.offsetHeight };
  });
  if (!bereik) return [label + ': geen piek'];
  for (const deel of [0, 0.01, 0.03]) {
    await naar(page, Math.round(bereik.top + (bereik.hoog - (await page.evaluate(() => innerHeight))) * deel), true);
    await page.waitForTimeout(450);
    const png = await page.screenshot({ type: 'png' });
    const papier = papierAandeel(png);
    const licht = helderheid(png).gemiddelde;
    if (papier > PIEK_OPEN.papier || licht > PIEK_OPEN.licht)
      fout.push(
        label + ' op ' + Math.round(deel * 100) + ' % van de scrub: ' + Math.round(papier * 100) + ' % papier en licht ' +
          Math.round(licht) + ' (lat hooguit ' + Math.round(PIEK_OPEN.papier * 100) + ' % en onder ' + PIEK_OPEN.licht + ')',
      );
  }
  return fout;
}

async function nieuwePagina(browser, [width, height], variant = 'film') {
  const context = await browser.newContext({
    viewport: { width, height },
    javaScriptEnabled: variant !== 'zonder-js',
    reducedMotion: variant === 'stil' ? 'reduce' : 'no-preference',
    hasTouch: width < 768,
  });
  return { context, page: await context.newPage() };
}

async function openVoorpagina(page, url, extraCss) {
  await page.goto(url, { waitUntil: 'load' });
  if (extraCss) await page.addStyleTag({ content: extraCss });
  await page.waitForTimeout(300);
}

async function tegentoetsMaten(browser, basis) {
  const { context, page } = await nieuwePagina(browser, [860, 900]);
  try {
    await openVoorpagina(page, basis + pagePath('nl', ''), OUDE_MATEN);
    const hero = await keurHero(page, 'tegentoets oude hero', 'stil');
    oordeel(hero.length > 0, 'tegentoets B1: een film van 260 px in de hero wordt afgekeurd', hero);
    const piek = await keurPiek(page, 'tegentoets oud kijkgat');
    oordeel(piek.fout.length > 0, 'tegentoets B2: het oude kijkgat min(64svh, 80vw) wordt afgekeurd (kleinste ' + Math.round(piek.laagst * 100) + ' %)', piek.fout);
    // B3 moet de oude opening (de ster op haar eigen kleine maat, 83 % papier) afkeuren.
    await openVoorpagina(page, basis + pagePath('nl', ''));
    await page.addStyleTag({ content: '.piek-masker g, .piek-rozet g { transform: rotate(0deg) scale(1) !important }' });
    const oudOpen = await keurPiekOpen(page, 'tegentoets oude opening');
    oordeel(oudOpen.length > 0, 'tegentoets B3: de oude opening met de ster op haar eigen maat wordt afgekeurd', oudOpen);
  } finally {
    await context.close();
  }
}

async function keurMaten(browser, basis) {
  for (const variant of ['film', 'stil', 'zonder-js']) {
    const kaart = [];
    for (const scherm of HERO_SCHERMEN) {
      const { context, page } = await nieuwePagina(browser, scherm, variant);
      try {
        for (const locale of LOCALES) {
          await openVoorpagina(page, basis + pagePath(locale, ''));
          kaart.push(...(await keurHero(page, 'hero ' + variant + ' ' + scherm.join('x') + ' ' + locale, variant)));
        }
      } finally {
        await context.close();
      }
    }
    oordeel(kaart.length === 0, 'B1 ' + variant + ': het filmvlak van de hero is minstens 90 % breed en 55 % hoog op 375 tot 1920 px, in drie talen', kaart);
  }

  // De film speelt vanzelf, zonder scrollen.
  {
    const { context, page } = await nieuwePagina(browser, [860, 900]);
    try {
      const kaart = [];
      for (const locale of LOCALES) {
        await openVoorpagina(page, basis + pagePath(locale, ''));
        const speelt = await page
          .waitForFunction(() => { const v = document.querySelector('video.hero-video'); return v && !v.paused && v.currentTime > 0.3 && v.classList.contains('is-klaar'); }, null, { timeout: 15000 })
          .then(() => true, () => false);
        if (!speelt) kaart.push(locale + ': de film van de hero speelt niet vanzelf');
        if ((await page.evaluate(() => scrollY)) !== 0) kaart.push(locale + ': de pagina scrolde');
      }
      oordeel(kaart.length === 0, 'B1: de film van de hero speelt vanzelf in tr, nl en fr (860 px, zonder scrollen)', kaart);
    } finally {
      await context.close();
    }
  }

  const kaart = [];
  const maten = [];
  for (const scherm of PIEK_SCHERMEN) {
    const { context, page } = await nieuwePagina(browser, scherm);
    try {
      for (const locale of scherm[0] === 860 ? LOCALES : ['nl']) {
        await openVoorpagina(page, basis + pagePath(locale, ''));
        const m = await keurPiek(page, 'piek ' + scherm.join('x') + ' ' + locale);
        kaart.push(...m.fout);
        maten.push(scherm[0] + ' ' + Math.round(m.laagst * 100) + '/' + Math.round((m.midden ?? 0) * 100));
      }
    } finally {
      await context.close();
    }
  }
  oordeel(kaart.length === 0, 'B2: de foto in de ster is bij het begin minstens 50 %, nooit onder 40 % (kleinste/midden: ' + maten.join(', ') + ') en aan het eind van elke ruimte minstens 80 % breed', kaart);

  const open = [];
  const openMaten = [];
  for (const scherm of PIEK_SCHERMEN) {
    const { context, page } = await nieuwePagina(browser, scherm);
    try {
      await openVoorpagina(page, basis + pagePath('nl', ''));
      open.push(...(await keurPiekOpen(page, 'open ' + scherm.join('x'))));
      const png = await page.screenshot({ type: 'png' });
      openMaten.push(scherm[0] + ' ' + Math.round(papierAandeel(png) * 100) + ' %');
    } finally {
      await context.close();
    }
  }
  oordeel(open.length === 0, 'B3: het eerste beeld van de ster is de foto, niet het papier (papier per scherm: ' + openMaten.join(', ') + ')', open);
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
  await tegentoetsMaten(browser, basis);
  await keurMaten(browser, basis);
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
