/**
 * `GET /api/vakitler?stad=brussel` — de gebedstijden van één stad, als JSON.
 *
 * Waarom een functie en geen rechtstreekse oproep uit de browser: de bron
 * (`namaz-vakitleri.fazilettakvimi.com`) stuurt geen CORS-kop, dus een pagina op
 * uccib.com mag hem niet lezen. Deze functie haalt hem server-side op, waar geen
 * CORS geldt, en zet er zelf een kop op.
 *
 * Waarom op de rand van Cloudflare en niet in de repo: de tijden veranderen elke
 * dag. De pagina staat statisch in de repo met de tijden van de bouwdag (dan is er
 * altijd inhoud zonder JavaScript); deze functie houdt ze levend.
 *
 * Gratis: Cloudflare Pages Functions valt onder het gratis plan (100.000
 * verzoeken per dag). Elke uitvoer wordt 30 minuten op de rand bewaard en de
 * browser bewaart hem 5 minuten, dus de bron krijgt per stad hooguit ~48
 * verzoeken per dag in plaats van één per bezoeker.
 */
import { STAD_SLUGS, envelop, haalStad } from '../_lib/vakitler.js';

const CACHE_SECONDEN = 1800;

function antwoord(body, status, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=300, s-maxage=' + CACHE_SECONDEN,
      ...extra,
    },
  });
}

export async function onRequestGet({ request, waitUntil }) {
  const url = new URL(request.url);
  const stad = (url.searchParams.get('stad') || 'brussel').toLowerCase().trim();

  if (!STAD_SLUGS.has(stad)) {
    return antwoord({ success: false, fout: 'onbekende-stad', stad }, 400);
  }

  /*
   * De cacherand van Cloudflare doet het zware werk; deze sleutel is per stad
   * verschillend, zodat Brussel en Gent elkaar niet in de weg zitten. `caches`
   * bestaat niet in elke omgeving (en niet in `astro dev`); zonder rand werkt de
   * functie gewoon door, hij haalt de bron dan één keer per verzoek op.
   */
  const rand = typeof caches !== 'undefined' ? caches.default : null;
  const sleutel = rand ? new Request(`https://vakitler.intern/${stad}`, { method: 'GET' }) : null;
  if (rand && sleutel) {
    const bewaard = await rand.match(sleutel);
    if (bewaard) return bewaard;
  }

  const dagen = await haalStad(stad);
  if (dagen.length === 0) {
    /*
     * De bron hapert. We geven geen lege tabel maar een eerlijke fout met status
     * 503: de pagina houdt dan de tijden staan die zij al had (uit de bouw), in
     * plaats van "geen gebedstijden" te tonen aan iemand die wil bidden.
     */
    return antwoord({ success: false, fout: 'bron-onbereikbaar', stad }, 503, {
      'cache-control': 'public, max-age=60, s-maxage=60',
    });
  }

  const uit = antwoord(envelop(stad, dagen, new Date().toISOString()), 200);
  if (rand && sleutel) waitUntil(rand.put(sleutel, uit.clone()));
  return uit;
}
