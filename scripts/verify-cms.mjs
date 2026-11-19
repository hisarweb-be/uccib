#!/usr/bin/env node
/**
 * De poort voor het inlogsysteem van het bewerkscherm. `npm run verify:cms`.
 *
 * Wat hier bewezen wordt, en waarom het een eigen script is: het bewerkscherm
 * hangt aan twee dingen buiten de repo, de cdn die Sveltia levert en de
 * authenticator op Cloudflare. Gaat daar iets mis, dan merkt `npm run verify`
 * dat niet, want die kijkt naar de site zelf. Dit script meet ze wel.
 *
 * Zonder netwerk is het een gewone leescontrole op `dist/`: vaste versie,
 * integrity-hash, noindex en een `base_url`. Met `--levend` erbij komt de
 * Worker erbij: hij moet antwoorden, een vreemd domein weigeren en het eigen
 * domein doorlaten tot aan de GitHub-login.
 *
 * Gebruik:
 *   node scripts/verify-cms.mjs           # leest dist/, geen netwerk
 *   node scripts/verify-cms.mjs --levend  # plus de Worker en de cdn
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const levend = process.argv.includes('--levend');
const distDir = resolve('dist');
const fouten = [];
let gemeten = 0;

async function meld(ok, wat, bewijs = '') {
  gemeten += 1;
  if (ok) console.log(`OK   ${wat}${bewijs ? ` (${bewijs})` : ''}`);
  else {
    console.log(`FOUT ${wat}${bewijs ? ` (${bewijs})` : ''}`);
    fouten.push(wat);
  }
}

const html = await readFile(resolve(distDir, 'admin/index.html'), 'utf8').catch(() => null);
const yml = await readFile(resolve(distDir, 'admin/config.yml'), 'utf8').catch(() => null);

if (!html || !yml) {
  console.error('dist/admin ontbreekt: draai eerst npm run build.');
  process.exit(1);
}

// 1. Vaste versie en integrity. Een script van een cdn zonder integrity is een
//    open deur: wie de cdn overneemt, draait code in het scherm van dhr. Omer.
const versie = html.match(/@sveltia\/cms@(\d+\.\d+\.\d+)\//)?.[1];
await meld(!!versie, 'beheer laadt een vaste Sveltia-versie', versie ?? 'geen versienummer in de src');

const integrity = html.match(/integrity="(sha384-[A-Za-z0-9+/=]+)"/)?.[1];
await meld(!!integrity, 'beheer laadt Sveltia met een integrity-hash', integrity ? 'sha384 aanwezig' : 'ontbreekt');

await meld(/rel="?noindex|name="robots"\s+content="[^"]*noindex/i.test(html), 'beheer vraagt geen indexering');

// 2. De authenticator. Zonder base_url toont Sveltia weer het tokenveld, en dat
//    is precies de situatie die we voor dhr. Omer weghalen.
const baseUrl = yml.match(/^\s*base_url:\s*(\S+)\s*$/m)?.[1];
await meld(!!baseUrl, 'config.yml wijst naar de authenticator', baseUrl ?? 'base_url ontbreekt');
if (baseUrl) {
  await meld(/^https:\/\/[a-z0-9.-]+\.workers\.dev$/.test(baseUrl), 'base_url is een https-workers.dev-adres', baseUrl);
}
await meld(/name:\s*github/.test(yml) && /repo:\s*hisarweb-be\/uccib/.test(yml), 'backend is GitHub op hisarweb-be/uccib');

// 3. Alleen met --levend: de cdn levert echt wat we verwachten, en de Worker
//    doet wat hij moet doen. Het tweede is de belangrijkste meting: een Worker
//    die elk domein doorlaat, geeft tokens uit aan elke website die hem vindt.
if (levend && versie && integrity) {
  const cdnUrl = `https://unpkg.com/@sveltia/cms@${versie}/dist/sveltia-cms.js`;
  const antwoord = await fetch(cdnUrl).catch(() => null);
  await meld(antwoord?.status === 200, 'cdn levert de vastgezette Sveltia', `${cdnUrl} → ${antwoord?.status ?? 'geen antwoord'}`);
  if (antwoord?.ok) {
    const echt = `sha384-${createHash('sha384').update(Buffer.from(await antwoord.arrayBuffer())).digest('base64')}`;
    await meld(echt === integrity, 'integrity-hash past bij wat de cdn nu levert', echt === integrity ? 'gelijk' : `cdn ${echt}`);
  }
}

if (levend && baseUrl) {
  const domein = baseUrl.replace(/^https:\/\//, '');
  const vraag = async (pad, params) => {
    const url = `${baseUrl}${pad}?${new URLSearchParams(params)}`;
    const antwoord = await fetch(url, { redirect: 'manual' }).catch(() => null);
    return { status: antwoord?.status ?? 0, tekst: antwoord ? await antwoord.text().catch(() => '') : '' };
  };

  // Het eigen domein: hoort door te laten tot de GitHub-login. Zonder geheimen
  // stopt hij met een nette melding, met geheimen geeft hij een 302. Beide is
  // goed; een 5xx of een weigering is fout.
  const eigen = await vraag('/auth', { provider: 'github', site_id: 'uccib.pages.dev' });
  await meld(
    eigen.status === 302 || /MISCONFIGURED_CLIENT/.test(eigen.tekst),
    'Worker laat het eigen domein toe tot de GitHub-login',
    `status ${eigen.status}${/MISCONFIGURED_CLIENT/.test(eigen.tekst) ? ', wacht op de twee geheimen' : ''}`,
  );

  const vreemd = await vraag('/auth', { provider: 'github', site_id: 'example.com' });
  await meld(
    /UNSUPPORTED_DOMAIN/.test(vreemd.tekst),
    'Worker weigert een vreemd domein',
    `status ${vreemd.status}`,
  );

  const geenProvider = await fetch(`${baseUrl}/auth`).catch(() => null);
  await meld(
    (geenProvider?.status ?? 0) < 500,
    'Worker antwoordt zonder verzoek om een token',
    `status ${geenProvider?.status ?? 'geen antwoord'}`,
  );

  const worker = await fetch(`https://${domein}/`).catch(() => null);
  await meld((worker?.status ?? 0) === 404, 'Worker heeft geen openbare startpagina', `status ${worker?.status ?? 'geen antwoord'}`);
}

if (fouten.length) {
  console.log(`\n${fouten.length} van ${gemeten} metingen fout.`);
  process.exit(1);
}
console.log(`\n${gemeten} metingen, alle ${gemeten} ok${levend ? ' (met netwerk)' : ' (zonder netwerk)'}.`);
