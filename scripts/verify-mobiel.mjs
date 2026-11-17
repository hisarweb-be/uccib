/**
 * De mobiele poort. `npm run verify:mobiel`.
 *
 * Aanleiding: de pagina-voor-pagina-keuring keurt op een bureaubladvenster met
 * een muis. Alles wat alleen op een telefoon misgaat kwam daar dus nooit uit:
 * een tikdoel van 19 px hoog, een menu dat buiten het scherm valt, een
 * scroll-verhaal dat met een vinger niet op gang komt. Deze poort doet hetzelfde
 * werk met een echte vinger: een telefoonvenster met aanraking, en scrollen met
 * losse aanraakpunten (`Input.dispatchTouchEvent`) in plaats van een muiswiel.
 *
 * Waarom niet `Input.synthesizeScrollGesture`: die zet met een telefooncontext de
 * pagina niet in beweging. Gemeten op 17-11 op de voorpagina: na die aanroep
 * stond scrollY nog op 0, waardoor de drie cinema-metingen allemaal 0,00 lazen en
 * de poort zijn eigen fout niet kon onderscheiden van een stilstaande site. Een
 * reeks losse aanraakpunten bracht dezelfde pagina wel van 0 naar 497 px.
 *
 * Elke meting heeft een tegentoets: eerst een nagemaakte pagina die MOET
 * afkeuren, dan pas de site. Zonder dat eerste geval bewijst een groene regel
 * niets (zelfde opzet als `verify-server.mjs`).
 *
 * Wat gemeten wordt, per punt:
 *   1. tikdoelen       elk zelfstandig tikbaar element minimaal 44 x 44
 *   2. overloop        geen horizontale overloop op 390 px en op 320 px
 *   3. menu            elk menu-item is met een vinger aan te tikken en komt aan
 *   4. sponsoren       tik op de doneerknop en daarna op een bedrag tot bij Mollie
 *   5. scroll-cinema   de lagen bouwen zich op onder een vingerbeweging
 *   6. reduced motion  met minder beweging staat alles stil op de eindfoto
 *
 * Draait met `npm run verify:mobiel`. Exitcode 1 bij elke afwijking.
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import {
  ACTIVE_SLUGS,
  LOCALES,
  openBrowser,
  pagePath,
  startStaticServer,
} from './lib/keuring.mjs';

/** Onze eigen lat. WCAG vraagt 24 px (2.5.8); 44 px is de maat waar een duim op mikt. */
const MIN_TIK = 44;
/** Onder deze waarde is een pagina niet meer fatsoenlijk leesbaar op een telefoon. */
const FPS_VLOER = 30;

const DIST = resolve('dist');
const PROEF = 'D:/tmp/win/uccib-mobiel/proef';
const TELEFOON = { width: 390, height: 844 };
const KLEIN = { width: 320, height: 640 };

let fouten = 0;
function oordeel(goed, regel, details = []) {
  console.log((goed ? 'OK   ' : 'FOUT ') + regel);
  for (const detail of details.slice(0, 8)) console.log('       ' + detail);
  if (details.length > 8) console.log('       ... en nog ' + (details.length - 8));
  if (!goed) fouten += 1;
}

/* ── De metingen, gedeeld tussen tegentoets en site ── */

/**
 * Meet elk zelfstandig tikbaar element. Een link midden in lopende tekst telt
 * niet mee: die is zo groot als de regel zelf en wordt door WCAG 2.5.8
 * uitgezonderd. Zonder die uitzondering zou elke alinea één lange foutregel zijn.
 */
function meetTikdoelen(min) {
  const keuze =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"]';
  const uit = [];
  for (const el of document.querySelectorAll(keuze)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
    // Buiten beeld links of rechts (de skip-link staat op -9999 px): geen tikdoel.
    if (r.right <= 0 || r.left >= document.documentElement.clientWidth) continue;
    if (el.closest('.sr-only')) continue;

    const inTekst = cs.display === 'inline' && el.closest('p, dd, li, td, figcaption');
    if (inTekst) {
      uit.push({ tekst: (el.textContent ?? '').trim().slice(0, 34), w: 0, h: 0, inTekst: true });
      continue;
    }
    // Eén maat voor de vergelijking én het verslag. Anders meldt de poort een
    // doel van 44 x 44 als fout, omdat het vóór het afronden 43,5 px was.
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    if (w >= min && h >= min) continue;
    uit.push({
      tekst:
        (el.textContent ?? '').trim().slice(0, 34) ||
        el.getAttribute('aria-label') ||
        el.tagName.toLowerCase(),
      w,
      h,
      inTekst: false,
    });
  }
  return uit;
}

/** Alles wat breder is dan het venster, plus de documentbreedte zelf. */
function meetOverloop() {
  const breed = document.documentElement.clientWidth;
  const uit = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    // Alleen rechts telt: de skip-link staat bewust op left:-9999 en maakt de
    // pagina niet breder. Wat links buiten beeld hangt, is geen overloop.
    if (r.right <= breed + 0.5) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' && cs.visibility === 'hidden') continue;
    uit.push({
      element: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
      links: Math.round(r.left),
      rechts: Math.round(r.right),
    });
  }
  return { breed, scroll: document.documentElement.scrollWidth, uit };
}

/* ── Tegelefoon ── */

function maakContext(browser, viewport, opties = {}) {
  return browser.newContext({
    viewport,
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    reducedMotion: opties.reducedMotion ?? 'no-preference',
    ...opties,
  });
}

/**
 * Eén vingerbeweging omhoog, zoals een duim die de pagina naar boven duwt.
 *
 * Per beweging hooguit driekwart scherm; een grotere afstand wordt in meerdere
 * halen afgelegd. Vóór het loslaten blijft de vinger 120 ms op dezelfde plek
 * staan: zonder dat wordt de beweging een fling en schiet de pagina voorbij de
 * plek waar gemeten moet worden.
 */
async function veeg(cdp, afstand) {
  const x = Math.round(TELEFOON.width / 2);
  const startY = Math.round(TELEFOON.height * 0.8);
  const hoogte = Math.round(TELEFOON.height * 0.6);
  let rest = Math.max(1, Math.round(afstand));

  while (rest > 0) {
    const stuk = Math.min(rest, hoogte);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y: startY }],
    });
    for (let i = 1; i <= 20; i += 1) {
      const y = Math.round(startY - (stuk * i) / 20);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
      await new Promise((klaar) => setTimeout(klaar, 8));
    }
    // Even stilhouden op de laatste plek, dan pas loslaten.
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: startY - stuk }],
    });
    await new Promise((klaar) => setTimeout(klaar, 120));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await new Promise((klaar) => setTimeout(klaar, 100));
    rest -= stuk;
  }
}

/**
 * Eén tik met een vinger, in losse aanraakpunten. Bewust niet `click()`: die
 * rekent zelf het midden uit en omzeilt zo een element dat eroverheen ligt.
 */
async function tikMetVinger(cdp, x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

const opacity = (page, laag) =>
  page.evaluate(
    (naam) => {
      const el = document.querySelector('[data-laag="' + naam + '"]');
      return el ? Number(getComputedStyle(el).opacity) : -1;
    },
    laag,
  );

/* ── 0. Tegentoetsen: de poort moet zelf kunnen afkeuren ── */

async function tegentoets(browser) {
  const map = join(PROEF, 'tegen');
  await mkdir(map, { recursive: true });
  await writeFile(
    join(map, 'index.html'),
    `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1"></head><body>
     <a href="/" style="display:inline-block;width:20px;height:20px;background:#333">klein</a>
     <a href="/" style="display:inline-block;width:44px;height:44px;background:#333">goed</a>
     <div style="width:600px;height:10px;background:#ccc"></div>
     </body></html>`,
    'utf8',
  );
  const server = await startStaticServer(map);
  const context = await maakContext(browser, TELEFOON);
  const page = await context.newPage();
  try {
    await page.goto(server.baseUrl + '/', { waitUntil: 'load' });
    const tik = await page.evaluate(meetTikdoelen, 44);
    const kleinGemeld = tik.some((t) => t.tekst === 'klein');
    const goedGemeld = tik.some((t) => t.tekst === 'goed');
    oordeel(kleinGemeld, 'tegentoets tikdoel: een link van 20 x 20 wordt afgekeurd');
    oordeel(!goedGemeld, 'tegentoets tikdoel: een link van 44 x 44 wordt niet genoemd');

    const over = await page.evaluate(meetOverloop);
    oordeel(over.scroll > over.breed, 'tegentoets overloop: 600 px in een venster van ' + over.breed + ' px wordt gezien');
  } finally {
    await context.close();
    await server.close();
  }
}

/* ── 1 t/m 3: alle pagina's op een telefoon ── */

async function keurPaginas(browser, baseUrl) {
  const routes = [];
  for (const locale of LOCALES) for (const slug of ACTIVE_SLUGS) routes.push(pagePath(locale, slug));
  routes.push('/404.html');

  const context = await maakContext(browser, TELEFOON);
  const page = await context.newPage();

  const tikFout = [];
  const overFout = [];
  const menuFout = [];
  let tikUitgezonderd = 0;
  let gemeten = 0;

  try {
    for (const route of routes) {
      const antwoord = await page.goto(baseUrl + route, { waitUntil: 'load' });
      gemeten += 1;
      const label = route + ' (' + (antwoord ? antwoord.status() : '?') + ')';

      // 1. tikdoelen
      const tik = await page.evaluate(meetTikdoelen, MIN_TIK);
      tikUitgezonderd += tik.filter((t) => t.inTekst).length;
      const teKlein = tik.filter((t) => !t.inTekst);
      if (teKlein.length > 0) {
        tikFout.push(
          label +
            ': ' +
            teKlein.map((t) => '`' + t.tekst + '` ' + t.w + 'x' + t.h).join(', '),
        );
      }

      // 2. overloop op 390 px
      const over = await page.evaluate(meetOverloop);
      if (over.scroll > over.breed + 1) {
        overFout.push(
          label +
            ' op 390: document ' +
            over.scroll +
            ' px breed (' +
            over.uit.map((o) => o.element + ' ' + o.links + '..' + o.rechts).slice(0, 4).join(', ') +
            ')',
        );
      }

      // 3. menu: elk item is zichtbaar, niet bedekt en binnen het venster
      const menu = await page.evaluate(() => {
        const nav = document.querySelector('header nav ul');
        if (!nav) return { aantal: 0, fout: ['geen hoofdmenu gevonden'] };
        const fout = [];
        const items = Array.from(nav.querySelectorAll('a'));
        for (const a of items) {
          const r = a.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) {
            fout.push('onzichtbaar: ' + a.textContent.trim());
            continue;
          }
          if (r.left < 0 || r.right > document.documentElement.clientWidth) {
            fout.push('buiten het venster: ' + a.textContent.trim());
            continue;
          }
          const midden = document.elementFromPoint(
            Math.min(document.documentElement.clientWidth - 1, r.left + r.width / 2),
            Math.min(window.innerHeight - 1, Math.max(1, r.top + r.height / 2)),
          );
          if (midden && !a.contains(midden) && midden !== a) {
            fout.push('bedekt door ' + midden.tagName.toLowerCase() + ': ' + a.textContent.trim());
          }
        }
        return { aantal: items.length, fout };
      });
      if (menu.aantal === 0 || menu.fout.length > 0) {
        menuFout.push(label + ': ' + (menu.fout.join('; ') || 'geen items'));
      }
    }
  } finally {
    await context.close();
  }

  oordeel(
    tikFout.length === 0,
    'tikdoelen: ' + gemeten + " pagina's op 390 px, elk zelfstandig doel minstens " + MIN_TIK + ' x ' + MIN_TIK,
    tikFout,
  );
  oordeel(overFout.length === 0, "overloop op 390 px: geen enkele pagina breder dan het venster", overFout);

  // Hetzelfde op 320 px, de smalste telefoon die nog rondgaat.
  const smal = await maakContext(browser, KLEIN);
  const smalPage = await smal.newPage();
  const smalFout = [];
  try {
    for (const route of routes) {
      await smalPage.goto(baseUrl + route, { waitUntil: 'load' });
      const over = await smalPage.evaluate(meetOverloop);
      if (over.scroll > over.breed + 1) {
        smalFout.push(
          route +
            ': ' +
            over.scroll +
            ' px (' +
            over.uit.map((o) => o.element).slice(0, 3).join(', ') +
            ')',
        );
      }
    }
  } finally {
    await smal.close();
  }
  oordeel(smalFout.length === 0, "overloop op 320 px: geen enkele pagina breder dan het venster", smalFout);
  oordeel(menuFout.length === 0, 'menu: alle items zichtbaar, onbedekt en binnen het venster op 390 px', menuFout);

  return tikUitgezonderd;
}

/* ── 3b. Echt tikken op het menu ── */

async function tikMenu(browser, baseUrl) {
  const context = await maakContext(browser, TELEFOON);
  const page = await context.newPage();
  const foutenLijst = [];
  try {
    await page.goto(baseUrl + '/hakkimizda/', { waitUntil: 'load' });
    const items = await page.$$eval('header nav ul a', (as) =>
      as.map((a) => ({ tekst: a.textContent.trim(), href: a.getAttribute('href') })),
    );
    for (const item of items) {
      await page.goto(baseUrl + '/hakkimizda/', { waitUntil: 'load' });
      // De vinger tikt in het midden van het item; geen `click()` die zelf het
      // midden uitrekent en daarmee een bedekking zou omzeilen.
      const box = await page.locator('header nav ul a', { hasText: item.tekst }).first().boundingBox();
      if (!box) {
        foutenLijst.push(item.tekst + ': geen kader om op te tikken');
        continue;
      }
      await Promise.all([
        page.waitForURL((url) => url.pathname !== '/hakkimizda/', { timeout: 5000 }).catch(() => {}),
        page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2),
      ]);
      await page.waitForLoadState('load');
      const pad = new URL(page.url()).pathname;
      if (pad !== item.href) foutenLijst.push(item.tekst + ': tik kwam op ' + pad + ', verwacht ' + item.href);
    }
  } finally {
    await context.close();
  }
  oordeel(foutenLijst.length === 0, 'menu: elk item met een vinger aangetikt en op de juiste pagina aangekomen', foutenLijst);
}

/* ── 4. Sponsoren met een vinger, tot bij Mollie ── */

async function tikSponsor(browser, baseUrl) {
  const context = await maakContext(browser, TELEFOON);
  // Mollie wordt niet echt bezocht: het verzoek wordt tegengehouden en de URL
  // die de browser zou opvragen is het bewijs. Zo kost deze toets niets en
  // raakt hij de betaalomgeving niet aan.
  const gevraagd = [];
  await context.route('https://payment-links.mollie.com/**', async (route) => {
    gevraagd.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: '<!DOCTYPE html><meta charset="utf-8"><title>Mollie (nagebootst)</title><h1>Mollie</h1>',
    });
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const foutenLijst = [];
  try {
    await page.goto(baseUrl + '/', { waitUntil: 'load' });
    const doneer = page.locator('a.donate').first();
    const box = await doneer.boundingBox();
    if (!box) {
      foutenLijst.push('geen doneerknop in de kop op een telefoon');
    } else {
      // Wachten op de bestemming zelf, niet op "iets anders dan de vorige
      // pagina": op de voorpagina was die voorwaarde meteen waar en las de
      // poort de oude URL.
      await Promise.all([
        page.waitForURL((url) => url.pathname.endsWith('/bagislar/'), { timeout: 8000 }).catch(() => {}),
        tikMetVinger(cdp, box.x + box.width / 2, box.y + box.height / 2),
      ]);
      await page.waitForLoadState('load');
      const pad = new URL(page.url()).pathname;
      if (!pad.endsWith('/bagislar/')) foutenLijst.push('doneerknop kwam op ' + pad + ', verwacht .../bagislar/');

      const tegels = page.locator('a.tegel');
      const aantal = await tegels.count();
      if (aantal < 8) foutenLijst.push('op de sponsorpagina staan ' + aantal + ' bedragtegels, verwacht 8 of meer');
      const tegel = tegels.first();
      const tegelBox = await tegel.boundingBox();
      if (!tegelBox) {
        foutenLijst.push('geen bedragtegel om op te tikken');
      } else {
        await Promise.all([
          page.waitForURL(/payment-links\.mollie\.com/, { timeout: 10000 }).catch(() => {}),
          tikMetVinger(cdp, tegelBox.x + tegelBox.width / 2, tegelBox.y + tegelBox.height / 2),
        ]);
      }
    }
  } finally {
    await context.close();
  }
  const mollieOk = gevraagd.length === 1 && /\/payment\//.test(gevraagd[0]) && /[?&]utm_/.test(gevraagd[0]);
  oordeel(
    foutenLijst.length === 0 && mollieOk,
    'sponsoren: twee tikken met een vinger van de voorpagina tot de betaallink bij Mollie',
    [...foutenLijst, ...(mollieOk ? [] : ['Mollie-aangifte: ' + (gevraagd[0] ?? 'geen verzoek gezien')])],
  );
}

/* ── 5. Scroll-cinema onder een vinger ── */

async function keurCinema(browser, baseUrl) {
  const context = await maakContext(browser, TELEFOON);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  try {
    await page.goto(baseUrl + '/', { waitUntil: 'load' });
    const heeftPodium = await page.locator('[data-cinema]').count();
    if (heeftPodium === 0) {
      oordeel(false, 'scroll-cinema: geen podium op de voorpagina');
      return;
    }
    const start = {
      kontour: await opacity(page, 'kontour'),
      massa: await opacity(page, 'massa'),
      foto: await opacity(page, 'foto'),
    };

    // Frameteller aan, dan met de vinger door het verhaal heen.
    await page.evaluate(() => {
      Reflect.set(globalThis, '__frames', 0);
      Reflect.set(globalThis, '__t0', performance.now());
      const loop = () => {
        Reflect.set(globalThis, '__frames', Reflect.get(globalThis, '__frames') + 1);
        Reflect.set(globalThis, '__raf', requestAnimationFrame(loop));
      };
      Reflect.set(globalThis, '__raf', requestAnimationFrame(loop));
    });

    // Naar het podium toe, dan er dwars doorheen in stappen van een halve scherm.
    const top = await page.evaluate(() => {
      const el = document.querySelector('[data-cinema]');
      return el ? el.getBoundingClientRect().top + window.scrollY : 0;
    });
    await veeg(cdp, Math.max(400, Math.round(top - 200)));

    // Kleine halen van een tiende scherm: met een halve scherm per haal sloeg
    // de eerste meting meteen naar 1,0/1,0/1,0 en zag de poort de opbouw nooit.
    // Het podium is 200vh, dus de voortgang loopt één op één met de afgelegde
    // schermhoogte; 14 halen samen komen ruim over het einde heen.
    const verloop = [];
    let kontourPiek = 0;
    let kontourVoorFoto = false;
    let fotoZonderMassa = false;
    for (let i = 0; i < 14; i += 1) {
      await veeg(cdp, Math.round(TELEFOON.height * 0.1));
      const stand = {
        kontour: await opacity(page, 'kontour'),
        massa: await opacity(page, 'massa'),
        foto: await opacity(page, 'foto'),
      };
      verloop.push(stand);
      if (stand.kontour > kontourPiek) kontourPiek = stand.kontour;
      // De contour is een korte flits over de donkere foto, geen laag die blijft:
      // 0,5 is ruim boven wat er te zien is en ver onder de 0,95-piek, zodat de
      // eis niet op een halve tiende afronding stukloopt.
      if (stand.kontour >= 0.5 && stand.foto < 0.5) kontourVoorFoto = true;
      // De foto mag nooit zonder zijn donkere ondergrond in beeld staan. Dat was
      // precies de fout van 17-11: wel lijnen en foto, geen massa eronder.
      if (stand.foto >= 0.9 && stand.massa < 0.9) fotoZonderMassa = true;
    }
    const fps = await page.evaluate(() => {
      cancelAnimationFrame(Reflect.get(globalThis, '__raf'));
      const ms = performance.now() - Reflect.get(globalThis, '__t0');
      return Math.round((Reflect.get(globalThis, '__frames') / ms) * 1000);
    });

    const eind = verloop[verloop.length - 1];
    oordeel(
      start.foto <= 0.2,
      'scroll-cinema: het verhaal begint zonder de eindfoto (foto ' + start.foto.toFixed(2) + ')',
    );
    oordeel(
      eind.foto >= 0.95,
      'scroll-cinema: na het doorvegen staat de eindfoto vol in beeld (foto ' + eind.foto.toFixed(2) + ')',
    );
    oordeel(
      start.massa >= 0.9,
      'scroll-cinema: de donkere foto staat er vanaf de eerste scrollpixel (massa ' +
        start.massa.toFixed(2) +
        '), dus het verhaal begint met een beeld en niet met een leeg vlak',
    );
    oordeel(
      kontourVoorFoto,
      'scroll-cinema: de lijncontour flitst over de foto heen voordat de foto zelf staat (piek ' +
        kontourPiek.toFixed(2) +
        ')',
    );
    oordeel(
      !fotoZonderMassa,
      'scroll-cinema: de eindfoto staat nooit zonder zijn donkere ondergrond, dus geen bouwtekening',
    );
    oordeel(
      fps >= FPS_VLOER,
      'scroll-cinema: ' + fps + ' beelden per seconde tijdens het vegen (vloer ' + FPS_VLOER + ')',
    );
    console.log(
      '       verloop: ' +
        verloop.map((v) => v.kontour.toFixed(1) + '/' + v.massa.toFixed(1) + '/' + v.foto.toFixed(1)).join(' '),
    );
  } finally {
    await context.close();
  }
}

/* ── 6. Minder beweging op een telefoon ── */

async function keurStil(browser, baseUrl) {
  const context = await maakContext(browser, TELEFOON, { reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto(baseUrl + '/', { waitUntil: 'load' });
    const stand = await page.evaluate(() => {
      const el = document.querySelector('[data-cinema]');
      const foto = document.querySelector('[data-laag="foto"]');
      return {
        aan: document.documentElement.classList.contains('cinema-aan'),
        hoogte: el ? Math.round(el.getBoundingClientRect().height) : 0,
        foto: foto ? Number(getComputedStyle(foto).opacity) : -1,
      };
    });
    oordeel(!stand.aan, 'reduced motion: de bewegingslaag staat uit op een telefoon');
    oordeel(stand.foto >= 0.99, 'reduced motion: de eindfoto staat direct vol in beeld (' + stand.foto.toFixed(2) + ')');
    oordeel(
      stand.hoogte > 0 && stand.hoogte < TELEFOON.height,
      'reduced motion: geen lege vastgepinde ruimte (' + stand.hoogte + ' px hoog, venster ' + TELEFOON.height + ' px)',
    );
  } finally {
    await context.close();
  }
}

/* ── Uitvoeren ── */

await mkdir(PROEF, { recursive: true });
const server = await startStaticServer(DIST);
const browser = await openBrowser();
let uitgezonderd = 0;
try {
  console.log('Mobiele keuring op ' + server.baseUrl + ' (telefoon ' + TELEFOON.width + ' x ' + TELEFOON.height + ')');
  console.log('');
  await tegentoets(browser);
  console.log('');
  uitgezonderd = await keurPaginas(browser, server.baseUrl);
  console.log('');
  await tikMenu(browser, server.baseUrl);
  await tikSponsor(browser, server.baseUrl);
  await keurCinema(browser, server.baseUrl);
  await keurStil(browser, server.baseUrl);
} finally {
  await browser.close();
  await server.close();
  await rm(PROEF, { recursive: true, force: true }).catch(() => {});
}

console.log('');
console.log('Buiten de telling: ' + uitgezonderd + ' links midden in lopende tekst (uitgezonderd volgens WCAG 2.5.8).');
if (fouten > 0) {
  console.log('verify-mobiel: ' + fouten + ' fout(en)');
  process.exit(1);
}
console.log('verify-mobiel: alles klopt');
