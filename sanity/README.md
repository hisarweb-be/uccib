# Sanity Studio voor uccib.com

De site is bewerkbaar zoals WordPress, maar zonder WordPress: de inhoud staat in
een Sanity-dataset en de Studio draait op de eigen site onder `/beheer`. Gratis
laag, geen eigen server, geen creditcard (plan §3 en §4).

**Wat hier nog ontbreekt:** het Sanity-project zelf. Een project aanmaken is
inloggen op naam van Altuner en dat is een voorbehoud (§6 van de globale
instructie). Alles wat zonder account kan, is af en getest; hieronder staat
precies wat er nodig is om het laatste stuk aan te zetten.

---

## 1. Het project aanmaken (eenmalig, met Altuner)

1. Ga naar <https://sanity.io/manage> en log in met het e-mailadres of het
   Google-account van UCCIB. Dit is de stap die alleen Altuner kan doen.
2. **Create project** → naam `uccib` → **Create**.
3. De dataset heet `production` en staat op **public**. Dat is bewust: de site
   leest zonder token, en er komen nooit persoonsgegevens in Sanity (plan §13).
4. Kopieer het **project ID** (een korte lettercombinatie, bijvoorbeeld
   `a1b2c3d4`). Dat is geen geheim, maar het is ook geen sleutel: het is het
   adres van de dataset, vergelijkbaar met een gebruikersnaam.
5. Zet het op twee plekken, verder niets:

   | Waar | Waarde | Waarvoor |
   |---|---|---|
   | Cloudflare Pages → Settings → Environment variables | `PUBLIC_SANITY_PROJECT_ID` = het project-id | de site leest het CMS |
   | `sanity/.env` (lokaal, staat in `.gitignore`) | `SANITY_STUDIO_PROJECT_ID` = het project-id | de Studio weet waar hij moet schrijven |

   De dataset is overal `production`; die staat al als standaard in de code en
   hoeft alleen afgeweken te worden als je bewust een tweede dataset gebruikt.

6. De eerste vulling: zie §5.

Zonder deze stap bouwt de site volledig uit `src/data/cms-fallback.json` en
start de Studio niet. Dat is de bedoelde stand, geen fout.

---

## 2. Wat er in de Studio staat

Zes lijsten, in de volgorde van de site, plus Instellingen onderaan. Elke lijst
met taal geeft Turks, Nederlands en Frans als aparte sublijst, zodat de drie
talen nooit door elkaar staan.

| Lijst | Wat erin staat | Taal |
|---|---|---|
| Pagina's · Sayfalar | de veertien pagina's van plan §8 | per taal |
| Nieuws · Haberler | nieuwsberichten met datum, categorie en omslagbeeld | per taal |
| Afdelingen · Şubeler | de aangesloten centra met adres, foto en kaartcoördinaat | per taal |
| Regio's · Bölgeler | regio's met een gesleepte lijst afdelingen | per taal |
| Gebedstijden · Namaz vakitleri | datum, plaats en de zes tijden | geen: een uur is overal gelijk |
| Preken · Hutbeler | vrijdagpreken met tekst en eventueel een pdf | per taal |
| Sponsoring · Bağış | de negen doneerbedragen met hun betaallink | geen: een bedrag is overal gelijk |
| Instellingen · Ayarlar | sitenaam, logo, adres, telefoon, socials, noodtekst | één document |

Elk document heeft een vaste `_id`: `pagina.<slug>.<taal>`,
`nieuwsbericht.<slug>.<taal>`, en `instellingen` voor het singleton. Een tweede
document met dezelfde slug kan dus niet ontstaan; `cms:import` werkt bij in
plaats van te verdubbelen.

De labels staan in het Turks met het Nederlandse woord ernaast. De knoppen van
de Studio zelf zijn Turks, Nederlands of Frans: de voorzitter kiest dat in haar
gebruikersmenu.

---

## 3. De voorzitter uitnodigen

1. <https://sanity.io/manage> → project `uccib` → **Members** → **Invite member**.
2. E-mailadres van de voorzitter, rol **Editor**.
3. Zij krijgt een mail, klikt, maakt een wachtwoord aan (of logt met Google in).
   Geen GitHub, geen wachtwoordbeheer bij ons.
4. Stuur haar deze drie regels mee:
   - Ga naar <https://uccib.com/beheer> en log in.
   - Kies links de lijst, dan de taal, dan het document.
   - Rechts boven staat **Publish**. Zonder die klik ziet niemand de wijziging.

**Wat een Editor wel kan:** documenten aanmaken en wijzigen, publiceren,
afbeeldingen uploaden, haar eigen wachtwoord wijzigen.

**Wat zij niet kan:** leden uitnodigen of verwijderen, de dataset verwijderen of
verplaatsen, tokens maken, het schema wijzigen, een betaald plan aanzetten. Dat
zit allemaal achter de rol Administrator en die houden wij.

**Wat wij haar vragen:** geen persoonsgegevens van leden of donateurs in de
velden zetten (namen, adressen, bedragen per persoon). De dataset is openbaar
leesbaar; wat erin staat is wereldwijd op te vragen. Inhoud die niet openbaar
mag, hoort niet in het CMS maar in de mailbox.

---

## 4. Publiceren → binnen twee minuten live

```
voorzitter klikt Publish in de Studio
        ↓   Sanity-webhook (direct)
Cloudflare Deploy Hook
        ↓   bouw (ca. 45-90 s, npm run build bouwt ook de Studio)
nieuwe site, inclusief /beheer
```

### De webhook instellen (eenmalig)

1. Cloudflare → **Pages** → project `uccib` → **Settings** → **Builds & deployments**
   → **Deploy hooks** → **Add** → naam `sanity-publicatie` → **Save**.
   Kopieer de URL; die ziet eruit als
   `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/<lange-code>`.
   Die code is een geheim: hij start een bouw en hoort niet in de repo.
2. <https://sanity.io/manage> → project `uccib` → **API** → **Webhooks** → **Create webhook**.
   Vul exact dit in:

   | Veld | Waarde |
   |---|---|
   | Name | `Cloudflare deploy` |
   | URL | de Deploy Hook-URL uit stap 1 |
   | Dataset | `production` |
   | Trigger on | **Create, Update, Delete** |
   | Filter | `_type in ["pagina","nieuwsbericht","afdeling","regio","gebedstijd","preek","sponsorblok","instellingen"]` |
   | HTTP method | `POST` |
   | HTTP headers | geen (de URL is het geheim) |
   | API version | `2024-01-01` |
   | Projection | `{_id, _type}` |
   | Status | **Enabled** |

3. Toets: publiceer in de Studio één woordwijziging. Binnen twee minuten staat
   een nieuwe bouw in Cloudflare en daarna de wijziging op de site.

**Waarom een filter en geen alles:** een webhook zonder filter start ook een
bouw als iemand alleen een concept opslaat of een gebruiker wijzigt. Elke bouw
telt mee voor het quotum van 500 per maand (plan §13); de filter houdt het bij
wat de site raakt.

---

## 5. De veertien pagina's erin zetten

De inhoud staat één keer in de repo, in `scripts/content/paginas.tr.mjs`, en
wordt van daaruit twee kanten op gebruikt: naar de offline kopie en naar Sanity.
Zo kan de site nooit iets anders tonen dan wat er in het CMS staat.

```
npm run cms:fallback          # src/data/cms-fallback.json opnieuw maken
npm run cms:import            # droogloop: laat zien wat er geschreven wordt
SANITY_API_TOKEN=… npm run cms:import -- --apply   # echt schrijven
```

- Zonder `--apply` schrijft het script niets. Met `--apply` is een token nodig;
  dat token zet je alleen voor dat ene commando in de omgeving, nooit in een
  bestand en nooit in de repo. Het is te maken op
  <https://sanity.io/manage> → project `uccib` → **API** → **Tokens** →
  **Add API token**, rol **Editor**.
- Het script schrijft 52 documenten: veertien slugs × drie talen, negen
  sponsorblokken en `instellingen`.
- Drie afbeeldingen worden één keer geüpload (dankbeeld, affiche, menukaart). Het
  asset-id wordt bewaard in `D:/tmp/win/uccib-f2/.sanity-assets.json`, buiten de
  repo; een tweede run uploadt ze niet opnieuw.
- **Let op:** `--apply` overschrijft wat de redactie daarna wijzigt. Het is voor
  de eerste vulling en voor een herstel, niet voor dagelijks gebruik.
- Nederlands en Frans krijgen hun eigen titel, h1 en beschrijving uit
  `src/i18n/*.json`; de body blijft Turks tot de redactie vertaalt. Dat is
  zichtbaar eerlijk en geen fout.

Controleren of alles compleet is:

```
npm run cms:verify:offline    # keurt de offline kopie, werkt altijd
npm run cms:verify            # keurt het echte CMS, vraagt het project-id
```

Beide geven exitcode 1 en één regel per gat als er een pagina ontbreekt.

---

## 6. Wat F3 ophaalt

`src/lib/sanity.ts` is de enige plek waar de site het CMS leest. Negen functies,
elk met acht seconden wachttijd en vijf minuten cache; bij elke fout of bij een
ontbrekend project valt de functie terug op `src/data/cms-fallback.json` en
gooit nooit een fout.

| Functie | Levert | Voor |
|---|---|---|
| `getPagina(locale, slug)` | één pagina, met terugval op de Turkse versie | elke route |
| `getPaginas(locale)` | alle pagina's van een taal, op `volgorde` | menu, sitemap |
| `getNieuws(locale)` | nieuwsberichten, nieuwste eerst | `/haberler` |
| `getAfdelingen(locale)` | aangesloten centra | `/subelerimiz` |
| `getRegios(locale)` | regio's met hun afdelingen erbij opgehaald | `/bolge-derneklerimiz` |
| `getGebedstijden()` | tijden vanaf vandaag | `/namaz-vakitleri` |
| `getPreken(locale)` | preken, nieuwste eerst | `/cuma-hutbesi` |
| `getSponsorblokken()` | actieve bedragen, op `volgorde` | `/bagislar` |
| `getInstellingen()` | adres, telefoon, socials, noodtekst | elke pagina |

De types staan in `src/lib/sanity-types.ts`, bewust niet in `sanity/`: de site
mag niet van het Studio-pakket afhangen. Afbeeldingen gaan via `beeldUrl(ref)`:
een Sanity-referentie wordt een CDN-adres op de gevraagde breedte, een pad uit
`public/` blijft zoals het is.

---

## 7. Lokaal werken

```
npm run sanity:dev            # Studio op http://localhost:3333
npm run sanity:build          # Studio naar public/beheer
npm run sanity:typecheck      # tsc --noEmit in sanity/
npm run check                 # astro check, inclusief src/lib
```

De Studio heeft een eigen `package-lock.json`; `npm run build` installeert die
één keer met `npm ci` als `sanity/node_modules` ontbreekt. Op Cloudflare gebeurt
dus hetzelfde als op een verse kloon.

---

## 8. Waar het project-id terechtkomt

| Plek | Variabele | In de repo? |
|---|---|---|
| `sanity/.env` | `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET` | nee, staat in `.gitignore` |
| Cloudflare Pages, environment variables | `PUBLIC_SANITY_PROJECT_ID` | nee |
| `sanity/project.ts` | leest beide, met een placeholder als geen van beide bestaat | ja, zonder waarde |

Een token staat nergens: niet in de repo, niet in dit bestand, niet in een
verslag. Wie `--apply` draait zet hem voor dat ene commando in de omgeving.
