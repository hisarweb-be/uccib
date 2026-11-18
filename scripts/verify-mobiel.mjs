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
 *   5. scènes          hero-unie en piek-ruimtes volgen een vingerbeweging, nooit leeg
 *   6. reduced motion  met minder beweging staat het verhaal er als sleutelbeelden
 *
 * Draait met `npm run verify:mobiel`. Exitcode 1 bij elke afwijking.
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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
/** Zelfde regel als bij `verify:scherm`: op de laptop `D:/tmp/win`, elders de tijdmap. */
const PROEF =
  process.env.UCCIB_BEELD !== undefined
    ? join(process.env.UCCIB_BEELD, 'mobiel', 'proef')
    : process.platform === 'win32'
      ? 'D:/tmp/win/uccib-mobiel/proef'
      : join(tmpdir(), 'uccib-mobiel', 'proef');
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

/**
 * Woorden die midden in breken (F2b PR4): op 390 px brak "Hakkımızda" in een
 * smal vak over twee regels, omdat `overflow-wrap: anywhere` elk woord mocht
 * knippen. Per tekstnode wordt elk woord van vier of meer tekens (gesplitst op
 * spatie, koppelteken en schuine streep, waar afbreken wel mag) als bereik gemeten;
 * staan de stukken van één woord op meer dan één regelhoogte, dan is het gebroken.
 */
function meetGebrokenWoorden() {
  const uit = [];
  const loper = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const bereik = document.createRange();
  for (let node = loper.nextNode(); node; node = loper.nextNode()) {
    const ouder = node.parentElement;
    if (!ouder || ouder.closest('script, style, noscript, template, dialog:not([open])')) continue;
    const tekst = node.textContent;
    for (const woord of tekst.matchAll(/[^\s\-\/\u2010-\u2014]{4,}/gu)) {
      bereik.setStart(node, woord.index);
      bereik.setEnd(node, woord.index + woord[0].length);
      const rects = [...bereik.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      if (rects.length < 2) continue;
      const toppen = new Set(rects.map((r) => Math.round(r.top)));
      if (toppen.size > 1) uit.push(woord[0]);
    }
  }
  return uit;
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

/**
 * Het menu staat sinds F2b PR2 in een modale dialog achter de rozetknop
 * (DESIGNSYSTEEM 7.3): eerst openen, dan pas meten of tikken. De knop zelf is een
 * gewoon tikdoel en wordt in stap 1 al op 44 px gekeurd. Zonder JavaScript is
 * er geen knop en staat de lijst al open; dan doet deze stap niets.
 */
async function openMenu(page) {
  const knop = page.locator('[data-menu-open]').first();
  if ((await knop.count()) === 0 || !(await knop.isVisible())) return;
  await knop.click();
  await page.waitForSelector('dialog#rozetmenu[open]', { timeout: 5000 });
}

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
     <p style="width:60px;overflow-wrap:anywhere;font-size:20px">Hakkımızda</p>
     <p style="width:300px;overflow-wrap:break-word;font-size:20px">Bize ulaşın vandaag</p>
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

    const gebroken = await page.evaluate(meetGebrokenWoorden);
    oordeel(gebroken.includes('Hakkımızda'), 'tegentoets woordbreuk: een woord dat in een vak van 60 px over twee regels valt, wordt gezien');
    oordeel(!gebroken.includes('ulaşın') && !gebroken.includes('vandaag'), 'tegentoets woordbreuk: heel gebleven woorden worden niet genoemd');
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
  const woordFout = [];
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

      // 2b. geen woord dat midden in breekt
      const gebroken = await page.evaluate(meetGebrokenWoorden);
      if (gebroken.length > 0) woordFout.push(label + ': ' + [...new Set(gebroken)].slice(0, 6).join(', '));

      // 3. menu: elk item is zichtbaar, niet bedekt en binnen het venster (na openen)
      await openMenu(page);
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
  oordeel(woordFout.length === 0, 'woorden op 390 px: geen woord breekt midden in over twee regels', woordFout);

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
    await openMenu(page);
    const items = await page.$$eval('header nav ul a', (as) =>
      as.map((a) => ({ tekst: a.textContent.trim(), href: a.getAttribute('href') })),
    );
    for (const item of items) {
      await page.goto(baseUrl + '/hakkimizda/', { waitUntil: 'load' });
      await openMenu(page);
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
    await openMenu(page);
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

/* ── 4b. Steunkeuze op de voorpagina: bedrag kiezen, dan doneren ── */

/**
 * De oude bedragtegels op de voorpagina zijn vervangen door de steunkeuze
 * (STORYBOARD D21, DESIGNSYSTEEM 7.5): een rij keuzerondjes en één knop. Met een
 * vinger in elke taal: tik een ander bedrag dan het voorgekozen, het getoonde
 * bedrag volgt, en de knop opent precies de betaallink van dat bedrag bij Mollie.
 */
async function tikSteun(browser, baseUrl) {
  const foutenLijst = [];
  for (const locale of LOCALES) {
    const context = await maakContext(browser, TELEFOON);
    const gevraagd = [];
    await context.route('https://payment-links.mollie.com/**', async (route) => {
      gevraagd.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!DOCTYPE html><title>Mollie</title>' });
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    try {
      await page.goto(baseUrl + pagePath(locale, ''), { waitUntil: 'load' });
      const rondjes = page.locator('#steun input[type="radio"]');
      const aantal = await rondjes.count();
      if (aantal < 2) {
        foutenLijst.push(locale + ': ' + aantal + ' bedragen in de steunkeuze, verwacht minstens 2');
        continue;
      }
      const voor = await rondjes.evaluateAll((els) => els.findIndex((e) => e.checked));
      const doel = voor === 0 ? 1 : 0;
      const label = page.locator('#steun label').nth(doel);
      await label.scrollIntoViewIfNeeded();
      const lb = await label.boundingBox();
      if (!lb || lb.width < MIN_TIK || lb.height < MIN_TIK) {
        foutenLijst.push(locale + ': bedragvak ' + (lb ? Math.round(lb.width) + 'x' + Math.round(lb.height) : 'onzichtbaar'));
        continue;
      }
      await tikMetVinger(cdp, lb.x + lb.width / 2, lb.y + lb.height / 2);
      await page.waitForTimeout(100);
      const stand = await page.evaluate((i) => {
        const r = document.querySelectorAll('#steun input[type="radio"]')[i];
        return {
          gekozen: r.checked,
          link: r.value,
          bedrag: r.dataset.bedrag,
          getoond: document.querySelector('#steun .steun-bedrag')?.textContent ?? '',
          knop: document.querySelector('#steun [data-steun-knop]')?.getAttribute('href') ?? '',
        };
      }, doel);
      if (!stand.gekozen) foutenLijst.push(locale + ': tik op het bedragvak kiest het bedrag niet');
      if (stand.getoond.trim() !== stand.bedrag) foutenLijst.push(locale + ': getoond "' + stand.getoond + '" volgt het gekozen bedrag ' + stand.bedrag + ' niet');
      if (stand.knop !== stand.link) foutenLijst.push(locale + ': de knop wijst naar ' + stand.knop + ' in plaats van de link van het gekozen bedrag');
      const knop = page.locator('#steun [data-steun-knop]');
      await knop.scrollIntoViewIfNeeded();
      const kb = await knop.boundingBox();
      if (!kb) {
        foutenLijst.push(locale + ': geen doneerknop in de steunkeuze');
        continue;
      }
      await tikMetVinger(cdp, kb.x + kb.width / 2, kb.y + kb.height / 2);
      for (let i = 0; i < 80 && gevraagd.length === 0; i += 1) await page.waitForTimeout(100);
      const ok = gevraagd.length === 1 && gevraagd[0] === stand.link;
      if (!ok) foutenLijst.push(locale + ': Mollie-aanvraag ' + (gevraagd.join(' | ') || 'geen') + ', verwacht ' + stand.link);
    } finally {
      await context.close();
    }
  }
  oordeel(
    foutenLijst.length === 0,
    'steunkeuze: in drie talen een bedrag met een vinger gekozen en met de knop precies die betaallink bij Mollie geopend',
    foutenLijst,
  );
}

/* ── 5. De twee scènes onder een vinger ── */

/**
 * Sinds F2b PR3 is de donkere gebouw-cinema weg (`[data-cinema]`, de lagen
 * kontour, massa en foto). Ervoor in de plaats staan twee scènes die met
 * `position: sticky` vastgepind zijn: `hero-unie` (drie schermhoogten) en
 * `piek-ruimtes` (vijf, of minder als een shot ontbreekt). De eisen zijn
 * dezelfde gebleven, alleen de namen niet: het verhaal begint met een beeld en
 * niet met een leeg vlak, de voortgang volgt de vinger, het beeld staat nooit
 * leeg, en het blijft vloeiend.
 */
const sceneStand = (page) =>
  page.evaluate(() => {
    const hero = document.querySelector('[data-sectie="hero-unie"]');
    const piek = document.querySelector('[data-sectie="piek-ruimtes"]');
    const getal = (el, naam) => (el ? Number(getComputedStyle(el).getPropertyValue(naam)) || 0 : -1);
    const dekking = (el) => (el ? Number(getComputedStyle(el).opacity) : -1);
    const knoppen = document.querySelector('[data-hero-knoppen="slot"]');
    const kr = knoppen ? knoppen.getBoundingClientRect() : null;
    return {
      hero: getal(hero, '--hero-p'),
      stand: hero ? (hero.dataset.stand ?? '') : '',
      piek: getal(piek, '--piek-p'),
      kern: dekking(document.querySelector('.piek-kern')),
      lagen: [...document.querySelectorAll('.piek-laag')].map((el) => dekking(el)),
      slotKnoppen: Boolean(knoppen && !knoppen.inert && kr && kr.top >= 0 && kr.bottom <= window.innerHeight),
    };
  });

async function keurScenes(browser, baseUrl) {
  const context = await maakContext(browser, TELEFOON);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  try {
    await page.goto(baseUrl + '/', { waitUntil: 'load' });
    const secties = await page.locator('[data-sectie="hero-unie"], [data-sectie="piek-ruimtes"]').count();
    if (secties < 2) {
      oordeel(false, 'scènes: hero-unie en piek-ruimtes staan niet allebei op de voorpagina (' + secties + ')');
      return;
    }
    // De bewegingslaag komt pas na `load` binnen (GSAP zit niet in de eerste bundel).
    const geladen = await page
      .waitForFunction(() => document.querySelector('[data-sectie="hero-unie"]')?.dataset.stand === 'eerste', null, {
        timeout: 8000,
      })
      .then(() => true)
      .catch(() => false);
    oordeel(geladen, 'scènes: de bewegingslaag is na het laden actief (stand "eerste")');
    if (!geladen) return;

    const begin = await page.evaluate(() => {
      const foto = document.querySelector('[data-shot="h1"]');
      if (!foto) return { geladen: false, inBeeld: false };
      const r = foto.getBoundingClientRect();
      return {
        geladen: foto.complete && foto.naturalWidth > 0,
        inBeeld: r.width >= 80 && r.height >= 80 && r.top >= 0 && r.top < window.innerHeight,
      };
    });
    oordeel(
      begin.geladen && begin.inBeeld,
      'scènes: het verhaal begint met een beeld en niet met een leeg vlak (foto h1 geladen en in het eerste scherm)',
    );

    await page.evaluate(() => {
      Reflect.set(globalThis, '__frames', 0);
      Reflect.set(globalThis, '__t0', performance.now());
      const loop = () => {
        Reflect.set(globalThis, '__frames', Reflect.get(globalThis, '__frames') + 1);
        Reflect.set(globalThis, '__raf', requestAnimationFrame(loop));
      };
      Reflect.set(globalThis, '__raf', requestAnimationFrame(loop));
    });

    // De hero is drie schermhoogten lang: halen van een kwart scherm, zodat de
    // poort de opbouw ziet en niet in één haal van begin naar eind springt.
    const heroVerloop = [];
    for (let i = 0; i < 15; i += 1) {
      await veeg(cdp, Math.round(TELEFOON.height * 0.25));
      await page.waitForTimeout(350);
      heroVerloop.push(await sceneStand(page));
    }
    const standen = new Set(heroVerloop.map((s) => s.stand));
    const terug = heroVerloop.some((s, i) => i > 0 && s.hero < heroVerloop[i - 1].hero - 0.02);
    const heroEind = Math.max(...heroVerloop.map((s) => s.hero));
    oordeel(
      heroEind >= 0.99 && !terug,
      'hero-unie: de voortgang volgt de vinger van 0 naar 1 zonder terugval (hoogste ' + heroEind.toFixed(2) + ')',
    );
    oordeel(
      standen.has('fasen') && standen.has('slot'),
      'hero-unie: het verhaal loopt door de fasen naar het slot (' + [...standen].join(', ') + ')',
    );
    oordeel(
      heroVerloop.some((s) => s.stand === 'slot' && s.slotKnoppen),
      'hero-unie: in het slot staan de twee knoppen in beeld en zijn ze bedienbaar',
    );

    // Door naar de piek en er in halen van een kwart scherm doorheen.
    const afstand = await page.evaluate(() => {
      const el = document.querySelector('[data-sectie="piek-ruimtes"]');
      const kop = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      return el ? el.getBoundingClientRect().top - kop : 0;
    });
    if (afstand > 0) await veeg(cdp, Math.round(afstand));
    const lengte = await page.evaluate(
      () => Number(document.querySelector('[data-sectie="piek-ruimtes"]')?.dataset.lengte) || 5,
    );
    const piekVerloop = [];
    for (let i = 0; i < Math.ceil(lengte * 4) + 4; i += 1) {
      await veeg(cdp, Math.round(TELEFOON.height * 0.25));
      await page.waitForTimeout(350);
      piekVerloop.push(await sceneStand(page));
    }
    const fps = await page.evaluate(() => {
      cancelAnimationFrame(Reflect.get(globalThis, '__raf'));
      const ms = performance.now() - Reflect.get(globalThis, '__t0');
      return Math.round((Reflect.get(globalThis, '__frames') / ms) * 1000);
    });

    const piekEind = Math.max(...piekVerloop.map((s) => s.piek));
    oordeel(piekEind >= 0.99, 'piek-ruimtes: de voortgang loopt tot het einde (hoogste ' + piekEind.toFixed(2) + ')');
    // Tussen het openen van de kern en het papier dat eroverheen schuift staat er
    // altijd een foto: de kern is dicht en de onderste laag ligt er vol onder.
    const midden = piekVerloop.filter((s) => s.piek >= 0.12 && s.piek <= 0.9);
    const leeg = midden.filter((s) => s.kern < 0.99 || (s.lagen[0] ?? 0) < 0.99);
    oordeel(
      midden.length >= 6 && leeg.length === 0,
      'piek-ruimtes: tijdens de scène staat er altijd een foto, nooit een leeg podium (' +
        midden.length +
        ' metingen, ' +
        leeg.length +
        ' leeg)',
    );
    const aantalLagen = piekVerloop[0]?.lagen.length ?? 0;
    const gezien = Array.from({ length: aantalLagen }, (_, i) => piekVerloop.some((s) => (s.lagen[i] ?? 0) >= 0.9));
    oordeel(
      aantalLagen >= 2 && gezien.every(Boolean),
      'piek-ruimtes: elk van de ' + aantalLagen + ' beelden komt vol in beeld (' + gezien.map((g) => (g ? 'ja' : 'nee')).join(', ') + ')',
    );
    oordeel(
      fps >= FPS_VLOER,
      'scènes: ' + fps + ' beelden per seconde tijdens het vegen (vloer ' + FPS_VLOER + ')',
    );
    console.log('       hero: ' + heroVerloop.map((v) => v.hero.toFixed(2)).join(' '));
    console.log('       piek: ' + piekVerloop.map((v) => v.piek.toFixed(2)).join(' '));
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
    await page.waitForTimeout(600);
    const stand = await page.evaluate(() => {
      const zichtbaar = (el) => Boolean(el && el.getClientRects().length > 0);
      const meet = (naam, podiumKlasse) => {
        const sectie = document.querySelector('[data-sectie="' + naam + '"]');
        const podium = sectie?.querySelector(podiumKlasse);
        return {
          vast: podium ? getComputedStyle(podium).position === 'sticky' : true,
          sectie: sectie ? Math.round(sectie.getBoundingClientRect().height) : 0,
          podium: podium ? Math.round(podium.getBoundingClientRect().height) : -1,
        };
      };
      const foto = document.querySelector('[data-shot="h1"]');
      return {
        aan: document.documentElement.classList.contains('beweging-aan'),
        hero: meet('hero-unie', '.hero-podium'),
        piek: meet('piek-ruimtes', '.piek-podium'),
        foto: foto && zichtbaar(foto) ? Number(getComputedStyle(foto).opacity) : -1,
        heroBeelden: [...document.querySelectorAll('.hero-sleutels img, .hero-sleutels svg')].filter(zichtbaar).length,
        piekBeelden: [...document.querySelectorAll('.piek-stil img')].filter(zichtbaar).length,
        bewegend: [...document.querySelectorAll('.alleen-beweging')].filter(zichtbaar).length,
      };
    });
    oordeel(!stand.aan, 'reduced motion: de bewegingslaag staat uit op een telefoon');
    oordeel(stand.foto >= 0.99, 'reduced motion: de foto van het eerste scherm staat direct vol in beeld (' + stand.foto.toFixed(2) + ')');
    oordeel(
      !stand.hero.vast && !stand.piek.vast && stand.hero.sectie - stand.hero.podium <= 2 && stand.piek.sectie - stand.piek.podium <= 2,
      'reduced motion: geen lege vastgepinde ruimte (hero ' +
        stand.hero.sectie +
        '/' +
        stand.hero.podium +
        ' px, piek ' +
        stand.piek.sectie +
        '/' +
        stand.piek.podium +
        ' px: sectie en inhoud even hoog)',
    );
    oordeel(
      stand.heroBeelden > 0 && stand.piekBeelden > 0 && stand.bewegend === 0,
      'reduced motion: het verhaal staat er als sleutelbeelden (hero ' +
        stand.heroBeelden +
        ', piek ' +
        stand.piekBeelden +
        ', bewegende delen zichtbaar: ' +
        stand.bewegend +
        ')',
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
  await tikSteun(browser, server.baseUrl);
  await keurScenes(browser, server.baseUrl);
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
