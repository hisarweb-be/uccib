/**
 * Helderheid van een schermafbeelding, zonder beeldbibliotheek.
 *
 * Waarom dit bestaat: de scroll-cinema-poort keek tot 17-11 alleen naar de
 * CSS-opacity van de lagen. Daarmee kwam hij groen door een openingsbeeld dat
 * niets dan witte contourlijnen op zwart was: alle lagen stonden "goed" en toch
 * was het eerste scherm een bouwtekening in plaats van een foto. De klacht die
 * dat opleverde is de reden dat deze meter er is: opacity vertelt wat de browser
 * denkt, niet wat de bezoeker ziet.
 *
 * Playwright levert 8-bits RGBA-PNG's zonder interlace; die ontleden we hier
 * zelf (chunk voor chunk, dan inflate, dan de vijf PNG-filters). Zo blijft de
 * keten zonder extra afhankelijkheid en zonder native beeldbibliotheek.
 */
import { inflateSync } from 'node:zlib';

const KANAAL = { 0: 1, 2: 3, 4: 2, 6: 4 };

/** Leest kop, chunklijst en pixeldata uit een PNG-buffer. */
function ontleed(png) {
  const handtekening = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < handtekening.length; i += 1) {
    if (png[i] !== handtekening[i]) throw new Error('geen PNG: handtekening klopt niet');
  }
  let kop = null;
  const stukken = [];
  let p = 8;
  while (p < png.length) {
    const lengte = png.readUInt32BE(p);
    const soort = png.toString('latin1', p + 4, p + 8);
    const data = png.subarray(p + 8, p + 8 + lengte);
    if (soort === 'IHDR') {
      kop = {
        breedte: data.readUInt32BE(0),
        hoogte: data.readUInt32BE(4),
        diepte: data[8],
        kleur: data[9],
        interlace: data[12],
      };
    } else if (soort === 'IDAT') {
      stukken.push(data);
    } else if (soort === 'IEND') {
      break;
    }
    p += 12 + lengte;
  }
  if (!kop) throw new Error('PNG zonder IHDR');
  if (kop.diepte !== 8) throw new Error('PNG met bitdiepte ' + kop.diepte + ', deze meter leest alleen 8 bits');
  if (kop.interlace !== 0) throw new Error('PNG met interlace, deze meter leest alleen niet-geinterlaced');
  const kanalen = KANAAL[kop.kleur];
  if (!kanalen) throw new Error('PNG met kleurtype ' + kop.kleur + ', deze meter kent dat type niet');
  return { ...kop, kanalen, ruw: inflateSync(Buffer.concat(stukken)) };
}

/** Draait de vijf PNG-filters terug naar kale pixelrijen. */
function ontfilter(beeld) {
  const { breedte, hoogte, kanalen, ruw } = beeld;
  const perRij = breedte * kanalen;
  const uit = Buffer.alloc(perRij * hoogte);
  let vorige = Buffer.alloc(perRij);
  let q = 0;
  for (let y = 0; y < hoogte; y += 1) {
    const filter = ruw[q];
    q += 1;
    const rij = Buffer.from(ruw.subarray(q, q + perRij));
    q += perRij;
    for (let i = 0; i < perRij; i += 1) {
      const links = i >= kanalen ? rij[i - kanalen] : 0;
      const boven = vorige[i];
      const linksboven = i >= kanalen ? vorige[i - kanalen] : 0;
      let waarde = rij[i];
      if (filter === 1) waarde += links;
      else if (filter === 2) waarde += boven;
      else if (filter === 3) waarde += (links + boven) >> 1;
      else if (filter === 4) {
        const p0 = links + boven - linksboven;
        const dL = Math.abs(p0 - links);
        const dB = Math.abs(p0 - boven);
        const dLB = Math.abs(p0 - linksboven);
        waarde += dL <= dB && dL <= dLB ? links : dB <= dLB ? boven : linksboven;
      } else if (filter !== 0) throw new Error('onbekend PNG-filter ' + filter);
      rij[i] = waarde & 0xff;
    }
    rij.copy(uit, y * perRij);
    vorige = rij;
  }
  return uit;
}

/**
 * Gemiddelde helderheid (0-255, Rec. 709-luma) en standaardafwijking daarvan.
 * De spreiding is de tweede meting die telt: een vlak zwart veld en een donkere
 * foto kunnen dezelfde gemiddelde helderheid hebben, maar niet dezelfde
 * spreiding.
 */
export function helderheid(png) {
  const beeld = ontleed(png);
  const pixels = ontfilter(beeld);
  const { kanalen } = beeld;
  const aantal = beeld.breedte * beeld.hoogte;
  let som = 0;
  let somKwadraat = 0;
  let stap = 1;
  // Bij grote schermen elke zoveelste pixel: het gemiddelde verandert daar niet
  // van en de poort blijft snel. Alleen hele pixels overslaan, anders leest de
  // loop midden in een pixel en schuift het kanaal op.
  while (aantal / stap > 400000) stap += 1;
  let geteld = 0;
  for (let i = 0; i + kanalen <= pixels.length; i += kanalen * stap) {
    const y = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    som += y;
    somKwadraat += y * y;
    geteld += 1;
  }
  const gemiddelde = som / geteld;
  const variantie = Math.max(0, somKwadraat / geteld - gemiddelde * gemiddelde);
  return { gemiddelde, spreiding: Math.sqrt(variantie), pixels: geteld };
}

/**
 * Welk deel van het scherm licht is (DESIGNSYSTEEM, "geen scherm bijna zwart":
 * minstens 60 % papier, wit of beeld boven 35 % helderheid). Het beeld wordt in
 * vakken van `tegel` pixels gedeeld; een vak telt als licht als zijn gemiddelde
 * helderheid minstens `drempel` is (0 tot 255). Uitkomst: aandeel lichte vakken.
 */
export function lichtAandeel(png, { tegel = 16, drempel = 0.35 * 255 } = {}) {
  const beeld = ontleed(png);
  const pixels = ontfilter(beeld);
  const { breedte, hoogte, kanalen } = beeld;
  let licht = 0;
  let totaal = 0;
  for (let ty = 0; ty < hoogte; ty += tegel) {
    for (let tx = 0; tx < breedte; tx += tegel) {
      let som = 0;
      let n = 0;
      for (let y = ty; y < Math.min(hoogte, ty + tegel); y += 2) {
        for (let x = tx; x < Math.min(breedte, tx + tegel); x += 2) {
          const i = (y * breedte + x) * kanalen;
          som += 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
          n += 1;
        }
      }
      totaal += 1;
      if (som / n >= drempel) licht += 1;
    }
  }
  return licht / totaal;
}
