// Toets public/media/wow/ tegen src/data/media-manifest.json (CONTRACT.md 2.1, 2.3, 3, 9.2).
// Gebruik: node scripts/verify-media.mjs [--map <pad>] [--manifest <pad>] [--dist <pad>] [--leeg-toegestaan]
// --dist: de bouw bij dit manifest (standaard dist/ als het manifest het standaardmanifest is).
// Eén regel per toets (OK of FOUT), eindtelling, exitcode 0 alleen als alles OK is.
// Niet gedekt (heeft de bronbeelden nodig): SSIM van frame 0 (9.2) en de visuele keuring.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const optie = (naam, standaard) => {
  const i = args.indexOf(naam);
  return i >= 0 && args[i + 1] ? resolve(args[i + 1]) : standaard;
};
const mapDir = optie('--map', join(root, 'public/media/wow'));
const manifestPad = optie('--manifest', join(root, 'src/data/media-manifest.json'));
const leegToegestaan = args.includes('--leeg-toegestaan');
const distDir = optie('--dist', manifestPad === join(root, 'src/data/media-manifest.json') ? join(root, 'dist') : null);
const f3Pad = join(root, 'src/i18n/f3.ts');

const KB = 1000;
const MB = 1000 * 1000;
const MAX = { poster: 120 * KB, frame0: 120 * KB, eind: 120 * KB, reeksD: 1800 * KB, reeksM: 900 * KB, piek: 4 * MB };
const SHOTS = ['h1', 'p1', 'p2', 'p3', 'p4', 'r1', 'r2'];
const SECTIE = (s) => (s === 'h1' ? 'hero-unie' : 'piek-ruimtes');
const STATUS = ['geleverd', 'vervallen', 'terugval'];
const EIND_SHOTS = ['p3', 'p4', 'r1'];
const VERMELDING = { tr: 'Film: yapay zekâ ile üretildi', nl: 'Film: AI-gegenereerd', fr: 'Film : généré par IA' };
const PREFIX = '/media/wow/';
const NAAM = /^(?:[a-z0-9]+-[dm](?:\.mp4|-poster\.webp|-poster\.avif|-frame0\.webp|-eind(?:-v\d+)?\.webp)|[a-z0-9]+-[dm]\/f-\d{4}\.webp)$/;

const resultaten = [];
const toets = async (naam, fn) => {
  let fouten;
  try { fouten = await fn(); } catch (e) { fouten = [`uitzondering: ${e.message}`]; }
  resultaten.push({ naam, fouten });
  const tekst = fouten.length ? `FOUT ${naam}: ${fouten.slice(0, 5).join('; ')}${fouten.length > 5 ? ` (+${fouten.length - 5} meer)` : ''}` : `OK   ${naam}`;
  console.log(tekst);
};
const klaar = () => {
  const fout = resultaten.filter((r) => r.fouten.length).length;
  console.log(`\n${resultaten.length - fout} van ${resultaten.length} toetsen OK, ${fout} FOUT`);
  process.exit(fout ? 1 : 0);
};

// Alle bestanden onder de mediamap, relatief met / (dotbestanden zoals .gitkeep tellen niet mee).
const lijst = (dir, voorvoegsel = '') => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.name.startsWith('.') ? [] : d.isDirectory() ? lijst(join(dir, d.name), `${voorvoegsel}${d.name}/`) : [`${voorvoegsel}${d.name}`]);
};
const opSchijf = lijst(mapDir);
const naarSchijf = (pad) => join(mapDir, pad.slice(PREFIX.length));
const ffprobe = (a) => execFileSync('ffprobe', ['-v', 'error', ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });

// 1. Aanwezigheid van manifest en media
if (!existsSync(manifestPad) || opSchijf.length === 0) {
  const tekst = `${existsSync(manifestPad) ? '' : `manifest ontbreekt (${manifestPad}). `}${opSchijf.length ? '' : `mediamap leeg of afwezig (${mapDir}).`}`;
  if (leegToegestaan && !existsSync(manifestPad) && opSchijf.length === 0) {
    console.log(`OK   leeg toegestaan (--leeg-toegestaan): ${tekst}`);
    process.exit(0);
  }
  await toets('manifest en media aanwezig', () => [tekst.trim()]);
  if (!existsSync(manifestPad)) klaar();
}

let manifest;
await toets('manifest is geldige JSON', () => {
  manifest = JSON.parse(readFileSync(manifestPad, 'utf8'));
  return [];
});
if (!manifest) klaar();

// 2. Schema
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isTekst = (v) => typeof v === 'string' && v.trim() !== '';
const isGetal = (v) => typeof v === 'number' && Number.isFinite(v);
const shots = Array.isArray(manifest.shots) ? manifest.shots : [];
const BESTAND_SLEUTELS = ['film', 'reeks', 'poster', 'frame0', 'eind'];

await toets('schema (velden, types, status, paden)', () => {
  const f = [];
  if (manifest.versie !== 2) f.push(`versie is ${manifest.versie}, moet 2 zijn`);
  if (!Array.isArray(manifest.shots) || (!shots.length && !leegToegestaan)) f.push('shots ontbreekt of is leeg');
  const gezien = new Set();
  for (const s of shots) {
    const w = `${s.shot}`;
    if (!SHOTS.includes(s.shot)) f.push(`${w}: onbekende shot`);
    if (gezien.has(s.shot)) f.push(`${w}: dubbel`);
    gezien.add(s.shot);
    if (s.sectie !== SECTIE(s.shot)) f.push(`${w}: sectie moet ${SECTIE(s.shot)} zijn`);
    if (s.rol !== 'scrub' && s.rol !== 'lus') f.push(`${w}: rol`);
    if (s.vorm !== (s.shot === 'h1' ? 'frames' : 'video')) f.push(`${w}: vorm moet ${s.shot === 'h1' ? 'frames' : 'video'} zijn`);
    if (!isTekst(s.bron)) f.push(`${w}: bron`);
    if (typeof s.bewerkt !== 'boolean') f.push(`${w}: bewerkt is geen boolean`);
    if (!Array.isArray(s.retouche)) f.push(`${w}: retouche is geen lijst`);
    if (typeof s.aiFilm !== 'boolean') f.push(`${w}: aiFilm is geen boolean`);
    if (!(s.model === null || isTekst(s.model))) f.push(`${w}: model`);
    if (!isObj(s.startUitsnede) || !['x', 'y', 'breedte', 'hoogte'].every((k) => isGetal(s.startUitsnede[k]))) f.push(`${w}: startUitsnede`);
    if (!isObj(s.uitsnede)) f.push(`${w}: uitsnede`);
    if (!isObj(s.anker) || !isTekst(s.anker.d) || !isTekst(s.anker.m)) f.push(`${w}: anker d en m`);
    if (!isObj(s.ankers) || !Array.isArray(s.ankers.d) || !Array.isArray(s.ankers.m)) f.push(`${w}: ankers d en m`);
    const variabele = s.shot === 'h1' ? '--hero-p' : '--piek-p';
    if (!isObj(s.fase) || !isGetal(s.fase.van) || !isGetal(s.fase.tot) || s.fase.variabele !== variabele) f.push(`${w}: fase {van,tot,variabele ${variabele}}`);
    if (!isObj(s.alt) || !['tr', 'nl', 'fr'].every((t) => isTekst(s.alt[t]))) f.push(`${w}: alt tr, nl en fr mogen niet leeg zijn`);
    if (s.shot === 'h1' && !(s.alt?.tr ?? '').includes('solda beyaz bir sütun')) f.push('h1: alt.tr moet "solda beyaz bir sütun" bevatten');
    if (!STATUS.includes(s.status)) f.push(`${w}: status`);
    for (const bp of ['d', 'm']) {
      const b = s.bestanden?.[bp];
      if (!isObj(b)) { f.push(`${w}: bestanden.${bp} ontbreekt`); continue; }
      for (const k of BESTAND_SLEUTELS) if (!(k in b)) f.push(`${w}.${bp}: sleutel ${k} ontbreekt`);
      if (Object.keys(b).some((k) => !BESTAND_SLEUTELS.includes(k))) f.push(`${w}.${bp}: onbekende sleutel`);
      if (!isObj(b.poster)) f.push(`${w}.${bp}: poster ontbreekt (elk shot heeft een poster)`);
      for (const k of ['film', 'poster', 'frame0', 'eind']) {
        const o = b[k];
        if (!o) continue;
        if (!isTekst(o.pad) || !o.pad.startsWith(PREFIX)) f.push(`${w}.${bp}.${k}: pad moet met ${PREFIX} beginnen`);
        for (const v of ['breedte', 'hoogte', 'gewicht']) if (!isGetal(o[v])) f.push(`${w}.${bp}.${k}: ${v}`);
      }
      if (b.film) for (const v of ['fps', 'frames', 'duur']) if (!isGetal(b.film[v])) f.push(`${w}.${bp}.film: ${v}`);
      if (b.poster && !(b.poster.avif === null || (isTekst(b.poster.avif) && b.poster.avif.startsWith(PREFIX)))) f.push(`${w}.${bp}.poster.avif`);
      if (b.reeks && !(isTekst(b.reeks.map) && b.reeks.map.startsWith(PREFIX) && b.reeks.map.endsWith('/') && b.reeks.patroon === 'f-%04d.webp' && ['aantal', 'breedte', 'hoogte', 'fps', 'duur', 'gewicht'].every((v) => isGetal(b.reeks[v])))) f.push(`${w}.${bp}.reeks: map, patroon of getallen`);
    }
  }
  return f;
});

// 3. Status, vorm en aanwezigheid per soort
await toets('status en bestandssoorten per shot', () => {
  const f = [];
  for (const s of shots) {
    for (const bp of ['d', 'm']) {
      const b = s.bestanden?.[bp];
      if (!isObj(b)) continue;
      const w = `${s.shot}.${bp}`;
      if (s.status === 'geleverd') {
        if (s.vorm === 'video' && (!b.film || b.reeks)) f.push(`${w}: video wil film en geen reeks`);
        if (s.vorm === 'frames' && (!b.reeks || b.film)) f.push(`${w}: frames wil reeks en geen film`);
        if (!b.frame0) f.push(`${w}: frame0 ontbreekt`);
        if (EIND_SHOTS.includes(s.shot) && !b.eind) f.push(`${w}: eind ontbreekt`);
        if (!EIND_SHOTS.includes(s.shot) && b.eind) f.push(`${w}: eind hoort alleen bij p3, p4, r1`);
      } else if (b.film || b.reeks || b.frame0 || b.eind) f.push(`${w}: status ${s.status} mag alleen een poster hebben`);
    }
  }
  return f;
});

// 4. aiFilm en vermelding
let f3Tekst = null;
if (existsSync(f3Pad)) {
  const t = readFileSync(f3Pad, 'utf8');
  // Alleen de waarderegels (`mediaAi: '...'`), niet de typedefinitie die eerder in het bestand staat.
  if (t.includes('mediaAi')) f3Tekst = t.split('\n').filter((r) => /mediaAi:\s*['"`]/.test(r)).join('\n');
}
await toets(`aiFilm-vlaggen en vermelding (${f3Tekst ? 'gelijk aan f3.mediaAi' : 'f3.mediaAi nog niet aanwezig: vaste tekst uit CONTRACT 3.3'})`, () => {
  const f = [];
  for (const s of shots) {
    const heeftAi = ['d', 'm'].some((bp) => { const b = s.bestanden?.[bp]; return b && (b.film || b.reeks || b.frame0 || b.eind); });
    if (s.aiFilm !== heeftAi) f.push(`${s.shot}: aiFilm ${s.aiFilm} maar ${heeftAi ? 'er zijn AI-bestanden' : 'er zijn alleen echte posters'}`);
    if (s.aiFilm) {
      if (!isObj(s.vermelding)) f.push(`${s.shot}: vermelding ontbreekt bij aiFilm true`);
      else for (const t of ['tr', 'nl', 'fr']) {
        if (s.vermelding[t] !== VERMELDING[t]) f.push(`${s.shot}: vermelding.${t} wijkt af van de contracttekst`);
        if (f3Tekst && !f3Tekst.includes(s.vermelding[t])) f.push(`${s.shot}: vermelding.${t} staat niet in f3.mediaAi`);
      }
      if (!isTekst(s.model)) f.push(`${s.shot}: model ontbreekt bij aiFilm true`);
    } else {
      if (s.vermelding !== null) f.push(`${s.shot}: vermelding moet null zijn bij aiFilm false`);
      if (s.model !== null) f.push(`${s.shot}: model moet null zijn bij aiFilm false`);
    }
    // Optioneel per bestand (het contract kent alleen aiFilm per shot): poster false, rest true.
    for (const bp of ['d', 'm']) for (const k of BESTAND_SLEUTELS) {
      const o = s.bestanden?.[bp]?.[k];
      if (o && 'aiFilm' in o && o.aiFilm !== (k !== 'poster')) f.push(`${s.shot}.${bp}.${k}: aiFilm moet ${k !== 'poster'} zijn`);
    }
  }
  return f;
});

// 5. Bestanden: bestaan, namen, niets extra
const verwacht = new Set(); // relatieve paden die het manifest noemt
const reeksBestanden = new Map(); // reeks-object -> lijst bestanden op schijf
for (const s of shots) for (const bp of ['d', 'm']) {
  const b = s.bestanden?.[bp] ?? {};
  for (const o of [b.film, b.poster, b.frame0, b.eind]) if (o?.pad) verwacht.add(o.pad.slice(PREFIX.length));
  if (b.poster?.avif) verwacht.add(b.poster.avif.slice(PREFIX.length));
  if (b.reeks?.map) {
    const m = b.reeks.map.slice(PREFIX.length);
    const leden = opSchijf.filter((p) => p.startsWith(m));
    reeksBestanden.set(b.reeks, leden);
    leden.forEach((p) => verwacht.add(p));
  }
}
await toets('elk bestand in het manifest bestaat', () => {
  const f = [];
  for (const p of verwacht) if (!existsSync(join(mapDir, p))) f.push(`ontbreekt: ${p}`);
  for (const s of shots) for (const bp of ['d', 'm']) {
    const r = s.bestanden?.[bp]?.reeks;
    if (r && !(reeksBestanden.get(r)?.length)) f.push(`${s.shot}.${bp}: reeksmap leeg of afwezig`);
  }
  return f;
});
await toets('elk bestand in public/media/wow staat in het manifest', () => opSchijf.filter((p) => !verwacht.has(p)).map((p) => `niet in manifest: ${p}`));
await toets('naamregels en verboden formaten (geen gif, mov, webm, png, jpg)', () =>
  opSchijf.flatMap((p) => /\.(gif|mov|webm|png|jpe?g)$/i.test(p) ? [`verboden formaat: ${p}`] : NAAM.test(p) ? [] : [`naam voldoet niet: ${p}`]));

// 6. Beeldbestanden: bytes en afmetingen kloppen met schijf
const beeldMeta = async (pad, formaat) => {
  const m = await sharp(pad).metadata();
  const ok = formaat === 'avif' ? m.format === 'heif' : m.format === 'webp';
  return { breedte: m.width, hoogte: m.height, ok };
};
const beelden = []; // { w, soort, bp, obj, relpad }
for (const s of shots) for (const bp of ['d', 'm']) {
  const b = s.bestanden?.[bp] ?? {};
  for (const k of ['poster', 'frame0', 'eind']) if (b[k]) beelden.push({ w: `${s.shot}.${bp}.${k}`, soort: k, bp, obj: b[k], pad: b[k].pad });
}
await toets('beelden: formaat, bytes en afmetingen kloppen met schijf', async () => {
  const f = [];
  for (const x of beelden) {
    const schijf = naarSchijf(x.pad);
    if (!existsSync(schijf)) continue;
    const m = await beeldMeta(schijf, 'webp');
    if (!m.ok) f.push(`${x.w}: is geen webp`);
    if (statSync(schijf).size !== x.obj.gewicht) f.push(`${x.w}: gewicht ${x.obj.gewicht} tegen schijf ${statSync(schijf).size}`);
    if (m.breedte !== x.obj.breedte || m.hoogte !== x.obj.hoogte) f.push(`${x.w}: maat ${x.obj.breedte}x${x.obj.hoogte} tegen schijf ${m.breedte}x${m.hoogte}`);
    if (x.soort === 'poster' && x.obj.avif && existsSync(naarSchijf(x.obj.avif))) {
      const a = await beeldMeta(naarSchijf(x.obj.avif), 'avif');
      if (!a.ok) f.push(`${x.w}: avif is geen avif`);
      if (a.breedte !== x.obj.breedte || a.hoogte !== x.obj.hoogte) f.push(`${x.w}: avif maat ${a.breedte}x${a.hoogte}`);
    }
  }
  return f;
});

// 7. Films: ffprobe (maat, fps, frames, duur), geen geluid, elk frame een sleutelframe
const films = [];
for (const s of shots) for (const bp of ['d', 'm']) { const o = s.bestanden?.[bp]?.film; if (o) films.push({ w: `${s.shot}.${bp}.film`, bp, obj: o }); }
const filmFeiten = new Map();
await toets('films: bytes, maat, fps, frames, duur kloppen met ffprobe', () => {
  const f = [];
  for (const x of films) {
    const schijf = naarSchijf(x.obj.pad);
    if (!existsSync(schijf)) continue;
    if (statSync(schijf).size !== x.obj.gewicht) f.push(`${x.w}: gewicht ${x.obj.gewicht} tegen schijf ${statSync(schijf).size}`);
    const info = JSON.parse(ffprobe(['-show_streams', '-show_format', '-of', 'json', schijf]));
    const v = info.streams.find((t) => t.codec_type === 'video');
    const audio = info.streams.filter((t) => t.codec_type !== 'video');
    const typen = ffprobe(['-select_streams', 'v', '-show_entries', 'frame=pict_type', '-of', 'csv=p=0', schijf]).split(/\r?\n/).map((r) => r.trim().replace(/,$/, '')).filter(Boolean);
    const [n, d] = (v?.r_frame_rate ?? '0/1').split('/').map(Number);
    const fps = d ? n / d : 0;
    const duur = Number(info.format?.duration);
    filmFeiten.set(x.obj, { audio, typen, v });
    if (!v) { f.push(`${x.w}: geen videospoor`); continue; }
    if (v.codec_name !== 'h264') f.push(`${x.w}: codec ${v.codec_name}, moet h264 zijn`);
    if (v.width !== x.obj.breedte || v.height !== x.obj.hoogte) f.push(`${x.w}: maat ${x.obj.breedte}x${x.obj.hoogte} tegen ffprobe ${v.width}x${v.height}`);
    if (Math.abs(fps - x.obj.fps) > 0.01) f.push(`${x.w}: fps ${x.obj.fps} tegen ffprobe ${fps}`);
    if (typen.length !== x.obj.frames) f.push(`${x.w}: frames ${x.obj.frames} tegen ffprobe ${typen.length}`);
    if (Math.abs(duur - x.obj.duur) > 0.1) f.push(`${x.w}: duur ${x.obj.duur} tegen ffprobe ${duur.toFixed(2)}`);
    const verhouding = x.bp === 'd' ? 16 / 9 : 4 / 5;
    if (Math.abs(v.width / v.height - verhouding) > 0.01) f.push(`${x.w}: beeldverhouding ${v.width}x${v.height}, moet ${x.bp === 'd' ? '16:9' : '4:5'} zijn`);
  }
  return f;
});
await toets('films: geen geluidsspoor', () => films.flatMap((x) => (filmFeiten.get(x.obj)?.audio.length ? [`${x.w}: heeft ${filmFeiten.get(x.obj).audio.length} extra spoor(en)`] : [])));
await toets('films: elk frame een sleutelframe (I-frames = frames)', () =>
  films.flatMap((x) => {
    const t = filmFeiten.get(x.obj)?.typen;
    if (!t) return [];
    const i = t.filter((p) => p === 'I').length;
    return i === t.length && i > 0 ? [] : [`${x.w}: ${i} I-frames van ${t.length}`];
  }));

// 8. Frame-reeksen: compleet, doorlopend, maat, gewicht
await toets('frame-reeksen: doorlopend f-0001..f-NNNN, aantal, maat en gewicht kloppen', async () => {
  const f = [];
  for (const s of shots) for (const bp of ['d', 'm']) {
    const r = s.bestanden?.[bp]?.reeks;
    if (!r) continue;
    const w = `${s.shot}.${bp}.reeks`;
    const leden = reeksBestanden.get(r) ?? [];
    const nummers = leden.map((p) => /\/f-(\d{4})\.webp$/.exec(p)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
    if (nummers.length !== leden.length) f.push(`${w}: bestand dat niet f-%04d.webp heet`);
    if (nummers.some((n, i) => n !== i + 1)) f.push(`${w}: nummering niet doorlopend vanaf 0001`);
    if (nummers.length !== r.aantal) f.push(`${w}: aantal ${r.aantal} tegen schijf ${nummers.length}`);
    if (Math.abs(r.duur - r.aantal / r.fps) > 0.2) f.push(`${w}: duur ${r.duur} klopt niet met aantal/fps (${(r.aantal / r.fps).toFixed(2)})`);
    const eis = bp === 'd' ? 640 : 480;
    if (r.breedte !== eis || r.hoogte !== eis) f.push(`${w}: maat ${r.breedte}x${r.hoogte}, contract wil ${eis}x${eis}`);
    let som = 0;
    for (const p of leden) {
      const schijf = join(mapDir, p);
      som += statSync(schijf).size;
      const m = await beeldMeta(schijf, 'webp');
      if (!m.ok || m.breedte !== r.breedte || m.hoogte !== r.hoogte) f.push(`${w}: ${p} is geen webp van ${r.breedte}x${r.hoogte}`);
    }
    if (som !== r.gewicht) f.push(`${w}: gewicht ${r.gewicht} tegen som op schijf ${som}`);
  }
  return f;
});

// 9. Maat gelijk aan de film (of reeks) per breekpunt
await toets('poster, frame0 en eind hebben dezelfde maat als film of reeks', () => {
  const f = [];
  for (const s of shots) for (const bp of ['d', 'm']) {
    const b = s.bestanden?.[bp];
    const ref = b?.film ?? b?.reeks;
    if (!ref) continue;
    for (const k of ['poster', 'frame0', 'eind']) if (b[k] && (b[k].breedte !== ref.breedte || b[k].hoogte !== ref.hoogte)) f.push(`${s.shot}.${bp}.${k}: ${b[k].breedte}x${b[k].hoogte} tegen ${ref.breedte}x${ref.hoogte}`);
  }
  return f;
});

// 10. Gewichtsgrenzen (kB = 1000 bytes, MB = 1000 kB)
await toets('gewichtsgrenzen (poster/frame0/eind 120 kB, reeks d 1800 kB en m 900 kB, piek 4 MB per formaat)', () => {
  const f = [];
  for (const x of beelden) {
    const g = x.obj.gewicht;
    if (g > MAX[x.soort]) f.push(`${x.w}: ${g} bytes boven ${MAX[x.soort]}`);
    if (x.soort === 'poster' && x.obj.avif && existsSync(naarSchijf(x.obj.avif)) && statSync(naarSchijf(x.obj.avif)).size > MAX.poster) f.push(`${x.w}.avif: boven ${MAX.poster}`);
  }
  for (const s of shots) for (const bp of ['d', 'm']) {
    const r = s.bestanden?.[bp]?.reeks;
    const grens = bp === 'd' ? MAX.reeksD : MAX.reeksM;
    if (r && r.gewicht > grens) f.push(`${s.shot}.${bp}.reeks: ${r.gewicht} bytes boven ${grens}`);
  }
  for (const bp of ['d', 'm']) {
    // Reserve r2 vervangt p1, r1 vervangt p3 (CONTRACT 2.2); alleen shots met een film tellen.
    const film = (naam) => shots.find((s) => s.shot === naam)?.bestanden?.[bp]?.film?.gewicht ?? 0;
    const som = (film('p1') || film('r2')) + film('p2') + (film('p3') || film('r1')) + film('p4');
    if (som > MAX.piek) f.push(`piek ${bp}: ${som} bytes boven ${MAX.piek}`);
  }
  return f;
});

// 11. Ontbrekende shots in de piek (keuring F2b, herstelpunt 2): een shot dat het manifest
// niet levert, valt weg zoals p4 (geen laag, geen zin, geen sleutelrij, geen plaatshouder)
// en de scrollweg slaat zijn stuk over. Eerst het draaiboek voor elke manifestvorm, dan de bouw.
const { piekPlan, naarTijdlijn, PIEK_PIN } = await import(pathToFileURL(join(root, 'src/lib/piekplan.ts')).href);
const plaatshouder = JSON.parse(readFileSync(join(root, 'src/data/media-manifest.plaatshouder.json'), 'utf8'));
const PIEK = ['p1', 'p2', 'p3', 'p4'];
const faseVan = (naam) => (shots.find((s) => s.shot === naam) ?? plaatshouder.shots.find((s) => s.shot === naam)).fase;
const slotsVoor = (er) => PIEK.map((naam) => ({ naam, van: faseVan(naam).van, tot: faseVan(naam).tot, aanwezig: er.includes(naam) }));
const ZINNEN = 3;
const stijgend = (rij) => rij.every((x, i) => i === 0 || x > rij[i - 1]);
const toetsPlan = (er) => {
  const f = [];
  const label = er.join('+');
  const plan = piekPlan(slotsVoor(er), ZINNEN);
  const namen = plan.lagen.map((l) => l.naam);
  if (namen.join() !== er.join()) f.push(`${label}: lagen ${namen.join()} tegen aanwezig ${er.join()}`);
  if (plan.zinnen.map((z) => z.naam).join() !== er.filter((n) => n !== 'p4').join()) f.push(`${label}: zinnen ${plan.zinnen.map((z) => z.naam).join()}`);
  if (!stijgend(plan.lagen.map((l) => l.in))) f.push(`${label}: laagdrempels niet oplopend`);
  if (!stijgend(plan.zinnen.map((z) => z.in))) f.push(`${label}: zindrempels niet oplopend`);
  for (const z of plan.zinnen) if (z.uit <= z.in) f.push(`${label}: zin ${z.naam} gaat weg voor ze komt`);
  for (const l of plan.lagen) if (!(l.b > l.a) || l.plekUit <= l.plekIn) f.push(`${label}: laag ${l.naam} zonder eigen stuk`);
  if (!stijgend(plan.sprongen.flat())) f.push(`${label}: sprongen overlappen of staan niet op volgorde`);
  // Het stuk van elk ontbrekend shot ligt in een sprong; geen sprong snijdt in het stuk van een aanwezige laag.
  const inSprong = (x) => plan.sprongen.some(([van, tot]) => x > van - 1e-9 && x < tot + 1e-9);
  for (const naam of PIEK.filter((n) => !er.includes(n))) {
    const { van, tot } = faseVan(naam);
    if (!inSprong(van) || !inSprong(Math.min(tot, 0.86))) f.push(`${label}: stuk van ontbrekend ${naam} (${van}-${tot}) niet overgeslagen`);
  }
  for (const l of plan.lagen) {
    // De eerste laag staat al in de kern vóór haar eigen stuk; alleen haar eigen stuk telt.
    for (const [van, tot] of plan.sprongen) if (van < l.b - 1e-9 && tot > l.a + 1e-9) f.push(`${label}: sprong ${van}-${tot} snijdt in laag ${l.naam} (${l.a}-${l.b})`);
  }
  const gat = plan.sprongen.reduce((som, [van, tot]) => som + tot - van, 0);
  if (Math.abs(plan.lengte - PIEK_PIN * (1 - gat)) > 0.001 || plan.lengte <= 0) f.push(`${label}: pin ${plan.lengte} tegen ${PIEK_PIN * (1 - gat)}`);
  // De scrollweg: van 0 tot 1, nooit terug, nooit landen in een sprong.
  let vorige = -1;
  for (let i = 0; i <= 1000; i++) {
    const q = naarTijdlijn(i / 1000, plan.sprongen);
    if (q < vorige - 1e-9) { f.push(`${label}: tijdlijn loopt terug bij ${i / 1000}`); break; }
    if (plan.sprongen.some(([van, tot]) => q > van + 1e-6 && q < tot - 1e-6)) { f.push(`${label}: tijdlijn landt in een sprong (${q.toFixed(3)})`); break; }
    vorige = q;
  }
  if (Math.abs(naarTijdlijn(1, plan.sprongen) - 1) > 1e-6) f.push(`${label}: einde van de scrollweg is niet 1`);
  return { f, plan };
};
await toets('piek: elk ontbrekend shot valt weg zoals p4 (alle 15 vormen, o.a. zonder p2, p1, p3, p2+p4, alleen p1)', () => {
  const f = [];
  for (let m = 1; m < 16; m++) f.push(...toetsPlan(PIEK.filter((_, i) => m & (1 << i))).f);
  // Zonder p2 (verplichte variant): p1 en p3 blijven, het stuk 0,44 tot 0,6 valt weg.
  const zonderP2 = toetsPlan(['p1', 'p3']).plan;
  if (JSON.stringify(zonderP2.sprongen) !== '[[0.44,0.6],[0.78,0.86]]' || zonderP2.lagen.map((l) => l.naam).join() !== 'p1,p3' || zonderP2.zinnen.map((z) => z.tekst).join() !== '0,2') f.push(`zonder p2: ${JSON.stringify(zonderP2)}`);
  // Het huidige draaiboek (p1 tot p3, geen p4) houdt de drempels van F2b.
  const nu = toetsPlan(['p1', 'p2', 'p3']).plan;
  if (nu.lagen.map((l) => l.in).join() !== '-1,0.435,0.595' || nu.zinnen.map((z) => z.uit).join() !== '0.42,0.58,2' || JSON.stringify(nu.sprongen) !== '[[0.78,0.86]]' || nu.lengte !== 4.6) f.push(`p1-p3: drempels wijken af van F2b (${JSON.stringify(nu)})`);
  return f;
});

// De bouw: alleen wat dit manifest levert staat in de piek, en nooit een plaatshouderbeeld.
const piekGeleverd = shots.some((s) => s.sectie === 'piek-ruimtes');
const erNu = PIEK.filter((n) => shots.some((s) => s.shot === n) || !piekGeleverd);
const bouwPaginas = distDir ? ['index.html', 'nl/index.html', 'fr/index.html'].map((p) => join(distDir, p)).filter(existsSync) : [];
if (distDir && args.includes('--dist') && bouwPaginas.length === 0) await toets('bouw voor --dist aanwezig', () => [`geen pagina's in ${distDir}`]);
if (bouwPaginas.length) await toets(`piek in de bouw volgt het manifest (aanwezig: ${erNu.join(', ')})`, () => {
  const f = [];
  const { plan } = toetsPlan(erNu);
  const echtePaden = new Set(shots.flatMap((s) => ['d', 'm'].flatMap((bp) => [s.bestanden?.[bp]?.poster?.pad, s.bestanden?.[bp]?.poster?.avif])));
  const plaatshouderPaden = piekGeleverd
    ? plaatshouder.shots.flatMap((s) => ['d', 'm'].map((bp) => s.bestanden[bp].poster?.pad)).filter((p) => p && !echtePaden.has(p))
    : [];
  for (const pagina of bouwPaginas) {
    const html = readFileSync(pagina, 'utf8');
    const begin = html.indexOf('id="piek-ruimtes"');
    const w = pagina.slice(distDir.length + 1).replaceAll('\\', '/');
    if (begin < 0) { f.push(`${w}: geen piek`); continue; }
    const sectie = html.slice(html.lastIndexOf('<section', begin), html.indexOf('</section>', begin));
    const lagen = [...sectie.matchAll(/class="piek-laag"[^>]*?data-laag="(\d)"/g)].map((m) => `p${m[1]}`);
    if (lagen.join() !== erNu.join()) f.push(`${w}: lagen ${lagen.join()} tegen ${erNu.join()}`);
    const plekken = [...sectie.matchAll(/class="piek-plek"[^>]*?data-laag="(\d)"/g)].map((m) => `p${m[1]}`);
    if (plekken.join() !== erNu.join()) f.push(`${w}: vermeldingen ${plekken.join()}`);
    const rijen = (sectie.match(/class="sleutelrij"/g) ?? []).length;
    if (rijen !== plan.zinnen.length) f.push(`${w}: ${rijen} sleutelrijen tegen ${plan.zinnen.length}`);
    const sprongen = (/data-sprongen="([^"]*)"/.exec(sectie)?.[1] ?? '[]').replaceAll('&quot;', '"');
    if (sprongen !== JSON.stringify(plan.sprongen)) f.push(`${w}: data-sprongen ${sprongen} tegen ${JSON.stringify(plan.sprongen)}`);
    if (!sectie.includes(`data-lengte="${plan.lengte}"`)) f.push(`${w}: pin is niet ${plan.lengte}`);
    for (const pad of plaatshouderPaden) if (sectie.includes(pad)) f.push(`${w}: plaatshouderbeeld ${pad} in de piek`);
  }
  return f;
});

klaar();
