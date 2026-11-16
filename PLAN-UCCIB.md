# UCCIB — diepe analyse en bouwplan

Versie 1.0 · 16-11-2026 15:40 · Opgesteld door de moedersessie (Fable 5.2, `local_a99fb642-a6f5-4781-8598-dc7fbca18ac4`)
Opdrachtgever: UCCIB vzw, Rue Charles Demeer 3, 1020 Brussel · contact +32 493 344 665 · info@uccib.com

Dit document is de bron van waarheid voor alle ondersessies. Elke ondersessie leest haar eigen
paragraaf (§12) en niets anders. Wijkt de werkelijkheid af van dit document, dan geldt de meting;
de ondersessie meldt de afwijking aan de moeder en past het document aan.

---

## 1. Wat ik heb gemeten (nulsituatie)

Alles hieronder is op 16-11-2026 live gemeten op https://uccib.com/ en niet uit een eerdere sessie
overgenomen. Meetwerk staat in `D:\tmp\win\uccib-analyse\`.

### Platform
| Wat | Gemeten |
|---|---|
| CMS | WordPress, thema `uccib-tema` (eigen markup, Elementor vrijwel ongebruikt) |
| Plugins | Elementor 4.4.0, Elementor Pro 3.32.2, joinchat (`creame-whatsapp-me`) 6.4.3, GTranslate 5.0.2 |
| PHP | 8.5.12 |
| JS-basislast | jQuery 3.7.1 + jquery-migrate 3.4.1 + jquery-ui 1.14.2 + Elementor frontend/webpack-runtime + GTranslate float |
| Hosting | Hostinger (`Server: hcdn`), HTTP/3, HTML `no-store` |
| Anti-bot | kale curl op `/` geeft 403 via `/hcdn-cgi/jschallenge`; alleen met volledig browserprofiel te meten |

### Gewicht van de homepage
JS 268 kB · afbeeldingen 1.775 kB · HTML 57 kB ≈ **2,1 MB**, nul AVIF/WebP.
Dezelfde drie heldfoto's worden **drie keer** opgehaald: één keer als `<img>` en twee keer als
`background-image` in CSS. Het logobestand is 265 kB (3301×1038) voor een weergave van 200 px breed.

### Alle content (14 pagina's)
| Slugs | Wat er echt staat |
|---|---|
| `/` | Welkomsttekst (vzw met religieuze-gemeenschapsstatus, dienstbaar aan moslims in België op religieus, sociaal en cultureel vlak), dienstenraster (Namaz Vakitleri, Hutbe, Şubelerimiz, Bağış, Eğitim ve Gençlik, Cami Tanıtım Programları, Açık Cami Günü), CTA naar `/bagislar/` |
| `/hakkimizda/` | Enige echte proza: opgericht 1979 in Brussel, onafhankelijk, partijloos, samenwerking met gemeente-, provincie- en federale overheden |
| `/disclameer/` | Volledig vertaalde juridische tekst |
| `/cerez-politikasi-cookie-policy/` | Cookiebeleid, met een cookiebalk die alleen "OK" kent |
| `/hizmetlerimiz/`, `/iletisim/`, `/bagis-onayi/` | **Leeg** |
| `/haberler/` | 0 berichten in 3 categorieën; "Yakında haberler burada yayınlanacaktır" |
| `/subelerimiz/`, `/bolge-derneklerimiz/`, `/namaz-vakitleri/`, `/cuma-hutbesi/` | "yakında burada yer alacaktır" |
| `/baharkermesi-menu/` | Menu-pagina van de kermis (geen doorlopende functie) |

Gedeelde header: telefoon, e-mail, navigatie (Anasayfa, Hakkımızda, Güncel Basın, Bölge
Derneklerimiz, Şubelerimiz, Namaz Vakitleri, Cuma Hutbesi). Footer: adres, vijf links, cookiebalk,
drijvende WhatsApp-knop ("Canlı Destek / Teknik sorun varsa mesaj atın").

**Conclusie:** de site is technisch opgetuigd maar inhoudelijk voor driekwart leeg. Dat is geen
reden om zuinig te bouwen: het is de reden dat een nieuw ontwerp met echte inhoud het verschil maakt.

### Beeldbank
87 items, **11,45 MB** totaal (45 jpg, 34 png, 8 jpeg). Zwaarste: `1-1.png` 1.654 kB, `1.png`
1.594 kB, `tesekkur.jpg` 1.254 kB, `MESCIT-1-scaled.jpg` 803 kB, `IMG_2180-scaled.jpg` 739 kB,
`uccib-logo-png-YENI.png` 265 kB. Daarnaast **circa 30 ongebruikte Unsplash-demo-foto's** van het
thema, `woocommerce-placeholder.png`, `placeholder-png` en `Resturant_Logo.png`: thema-rommel die
niet meegaat.

### Toegankelijkheid (axe op de homepage)
3 bevindingen: 2 serieus (`color-contrast`, `link-in-text-block`), 1 matig (`region`).
47 regels geslaagd, 1 onvolledig. Alle alt-teksten zijn leeg, behalve die van het logo.

### SEO en techniek
Geen meta description, geen Open Graph, geen schema.org, geen hreflang. `lang="tr"` met een
GTranslate-drijvende-knop als "meertaligheid". `robots.txt` is in orde (`/wp-admin/` dicht,
sitemapverwijzing aanwezig), RSS werkt, maar de sitemap-index verwijst naar een pad dat 404 geeft.

### Sponsoring (de bestaande gateway)
Alle acht betaallinks op `/bagislar/` zijn live gemeten. Ze renderen correct op de Mollie-checkout
(titel "BAĞIŞ-DONATİON - Secure payment via Mollie", methodes iDEAL | Wero, creditcard,
bankoverschrijving, Bancontact):

| Bedrag | Link | Laadtijd |
|---|---|---|
| € 5 | `2dXLCiwCd2BerhRaawwXY` | 1.161 ms |
| € 10 | `qzZr3eJc4Q9AKtj2gWvtZ` | 856 ms |
| € 25 | `7jQLY9LmoHdM7zVuTJkT9` | 852 ms |
| € 50 | `7Rko4nphmSTRBCzDXLepQ` | 1.211 ms |
| € 100 | `pJzUpd7m3nA9e7ZQu37zT` | 1.080 ms |
| € 250 | `oFkusZKDQZncSjD9Zjd2f` | 1.108 ms |
| € 500 | `eAYeiSrFRf27DZcnJKni5` | 3.808 ms |
| € 1.000 | `FvxiwaRhqDa6N5Zw7Y2TU` | 1.281 ms |

**Eén echte fout:** de knop "Miktarı Giriniz" (eigen bedrag invullen) wijst naar de link van
€ 1.000 en heeft geen invoerveld. Wie daar klikt, staat onverwacht op duizend euro. Dat is de duurste
fout van de hele site en hij wordt in §7 gerepareerd.

---

## 2. De opdracht in vijf eisen

| Eis van Altuner | Hoe dit plan hem inlost |
|---|---|
| Volledig herbouwd op de nieuwste techniek, zonder WordPress | Astro 5 + React-eilanden, statisch gebouwd, geen database, geen PHP (§3) |
| Zelf bewerkbaar zoals WordPress, altijd in sync met de voorzitter | Sanity Studio op `/beheer` van de eigen site, publiceren = binnen een minuut live (§4) |
| Wow-effect alsof Higgsfield AI is gebruikt | Scroll cinema op de gebouwfoto, cinematische held, texturen en motion (§6) |
| Alle pagina's exact, alle afbeeldingen overgenomen, kleiner opgeslagen, top-10-kwaliteit, €45.000 waarde | 14 pagina's één op één op dezelfde slugs, beeldpijplijn met 80,2 % winst (§5), onderbouwing in §11 |
| Altijd gratis, niet op onze servers of laptop | Cloudflare Pages Free + Sanity Free, beide zonder eigen server (§3) |
| Lezers direct laten sponsoren via de bestaande gateway | Sponsor-funnel met de acht gemeten links plus vrij bedrag (§7) |

---

## 3. Architectuurkeuze

**Gratis-eerst onderzoek:** onderzocht en vergeleken zijn Cloudflare Pages Free, Vercel Hobby,
GitHub Pages, Netlify Free (hosting) en Sveltia CMS, Pages CMS, Decap CMS, Sanity Free, Directus
Free en Payload (bewerkbaarheid). Cloudflare Pages Free wint op hosting: statische verzoeken zijn
gratis en onbeperkt, 500 builds per maand, 20.000 bestanden, 25 MiB per bestand, geen
bandbreedtelimiet op statische assets. Sanity Free wint op bewerkbaarheid: 20 gebruikers, 2 datasets,
10.000 documenten, 100 GB assets, 250.000 API-verzoeken en 1 miljoen CDN-verzoeken per maand, en
uitnodigen gaat per e-mailadres of Google-account, dus **zonder GitHub-account**. Dat laatste is
beslissend: Sveltia, Pages CMS en Decap werken alle drie alleen met een GitHub-account, en de
voorzitter heeft dat niet en wil dat niet. Betaald is niets nodig; de betaalopties van beide
partijen (Sanity Growth, Cloudflare Pro) worden niet gebruikt.

**Gekozen stapel**

| Laag | Keuze | Waarom |
|---|---|---|
| Framework | Astro 5, statische output, React-eilanden | Nearly-zero JS; bestaande HisarWeb-componenten (`FrameSequence.tsx`) werken er ongewijzigd in |
| Opmaak | Tailwind 4 met eigen tokens uit het huidige thema | Snelheid en consistentie, geen runtime |
| Motion | GSAP 3 + ScrollTrigger, `prefers-reduced-motion`-poort | Bewezen in de eigen demo-sites |
| CMS | Sanity Free, Studio ingebed op `/beheer` | Voorzitter bewerkt in het Nederlands/Turks op de eigen site, zonder account van derden |
| Beeld | Sanity Image CDN (`auto=format`) + repo-AVIF voor held en sequentie | Automatisch AVIF/WebP, hotspot-crop, gratis binnen 100 GB |
| Hosting | Cloudflare Pages Free, eigen domein `uccib.com` | Gratis, HTTP/3, wereldwijd CDN, geen server |
| Analytics | Cloudflare Web Analytics | Cookieloos, gratis, geen cookiebalk meer nodig |
| Taal | Astro i18n: Turks op de root, Nederlands op `/nl/`, Frans op `/fr/` | Bestaande Turkse URL's blijven exact werken |

**Wat er bewust niet komt:** geen database, geen PHP, geen WordPress, geen eigen VPS, geen
HisarWeb-server, geen betaalde dienst, geen cookiebalk (er zijn geen cookies), geen GTranslate.

**Gevolg voor de hostingkosten:** €0 per maand, ook na jaren. De enige vaste kosten die overblijven
zijn het domein (nu al bij de vzw) en niets anders.

---

## 4. Bewerkbaarheid door de voorzitter (het sync-model)

De keten is één richting en altijd dezelfde:

```
voorzitter bewerkt op uccib.com/beheer  ->  klikt Publiceren
        ->  Sanity stuurt één webhook
        ->  Cloudflare Deploy Hook bouwt de site opnieuw (ca. 45-90 s)
        ->  haar wijziging staat live, op alle drie de talen, op alle toestellen
```

- **Inloggen:** e-mailadres of Google-account. Geen GitHub, geen wachtwoordbeheer door ons.
- **Wat ze ziet:** een lijst met pagina's, nieuwsberichten, afdelingen, regio's, gebedstijden,
  vrijdagpreken en de sponsorblokken. Per onderdeel de velden die ze kent uit WordPress: titel,
  tekst, foto, knop, volgorde.
- **Beelden:** sleep een foto in het veld, Sanity snijdt hem zelf bij en levert hem als AVIF. Ze hoeft
  nooit een bestandsgrootte te kennen.
- **Terugdraaien:** elke publicatie is een versie met datum en auteur; één klik terug.
- **Wat wijzigingen van ons naar haar doorduwt:** de site wordt bij elke publicatie uit dezelfde bron
  gebouwd, dus een codewijziging van ons zit automatisch in haar volgende bewerking. Er is geen
  tweede kopie die uit elkaar kan lopen.
- **Vooraf oefenen:** de ondersessie F7 doet één proefbewerking samen met de voorzitter (nieuwsbericht
  plaatsen, foto wisselen, gebedstijd aanpassen) en levert een Nederlandstalige en Turkstalige
  handleiding van één pagina.

**Risico dat ik afdek:** Sanity Free geeft alleen openbare datasets. Dat is voor een openbare website
geen probleem (lezen mag toch), maar het betekent wel dat er **nooit** een besloten formulierinzending
of e-mailadres in Sanity mag worden opgeslagen. Inzendingen gaan daarom niet naar Sanity maar enkel naar
de mailbox van de vzw.

---

## 5. Beeldpijplijn (kleiner opslaan, kwaliteit omhoog)

Gemeten op de zwaarste originelen: AVIF kwaliteit 55 geeft **80,2 % minder bytes** (3.000 kB -> 593 kB),
WebP kwaliteit 72 geeft 73 %. Per foto loopt de winst van 7,1 % tot 36,6 %.

Aanpak:
1. Alle 87 originelen downloaden en per stuk beoordelen op nut (thema-demo's en placeholders vallen af).
2. Wat blijft: origineel in Sanity (voor de voorzitter), plus AVIF op vier breedtes (480, 960, 1440,
   2048) en WebP als terugval, met `srcset` en `sizes`.
3. De held- en sequentieframes staan als AVIF in de repo: die worden door Cloudflare gratis en
   onbeperkt geserveerd.
4. Elke afbeelding krijgt een echte alt-tekst in drie talen; decoratieve beelden krijgen een lege alt.
5. Meting voor en na in `voortgang/F1.md`: totale kB, aantal bestanden, grootste bestand.

Verwachte uitkomst: **11,45 MB -> circa 2,3 MB** aan wat de bezoeker ooit binnenhaalt, en de homepage
van 2,1 MB naar onder 600 kB.

---

## 6. Scroll cinema

Twee bewegingen, beide op dezelfde motor:

1. **De gebouwfoto van niets tot eindstatus.** Bij het scrollen bouwt `MESCIT-1-scaled.jpg` zich op:
   eerst korrel en lijncontour, dan de massa, dan licht en detail, tot de foto volledig staat en
   zachtjes ageert. Techniek: canvas met een masker- en onthullingsreeks, aangedreven door
   ScrollTrigger, op een vastgepinde sectie van 200vh. Hergebruikt de opzet van
   `D:/project/project/hisarweb/components/realisaties/FrameSequence.tsx` (één scroll-listener, één
   rAF-lus, frame 1 en poster eerst, nooit React-state per frame).
2. **Foto-cinema over de hele site.** Elke sectie met beeld krijgt een trage parallax, een
   korrel-laag en een onthulling bij binnenkomst. Nooit meer dan één geanimeerde laag tegelijk
   zichtbaar.

Poorten: 60 fps gemeten op een middenklasse toestel, volledige stilte bij
`prefers-reduced-motion: reduce`, en geen layout-shift (CLS onder 0,02).

**Fase 2, alleen na jouw GO:** een echt gegenereerde 120-frames-opbouw van het gebouw (Google Flow of
Higgsfield) in plaats van de GPU-onthulling van de bestaande foto. Dat valt onder de gouden mediaregel:
eerst een creatieve brief en een stemproef, dan pas renderen. Ik bouw fase 1 zo dat de gegenereerde
reeks er later zonder verbouwing in past.

---

## 7. Sponsor-funnel

- `/bagislar/` wordt de sterkste pagina van de site: één heldere kop, de acht bestaande bedragen als
  grote keuzetegels (5, 10, 25, 50, 100, 250, 500, 1.000 euro), daaronder "eigen bedrag", en een
  korte uitleg waarvoor het geld gaat (religieuze, sociale en culturele dienstverlening).
- **De fout met "Miktarı Giriniz" wordt gerepareerd.** Mollie ondersteunt een betaallink zonder
  vast bedrag: het bedrag mag bij het aanmaken ontbreken en de bezoeker vult het zelf in, met een
  ondergrens. Die link wordt aangemaakt en in de configuratie gezet. Kan dat niet omdat de
  Mollie-sleutel niet beschikbaar is, dan maakt de ondersessie de knop "eigen bedrag" voorlopig
  gelijk aan de knop van € 50 en zet ze één regel in de CTO-wachtrij; de site blijft dan werken zonder
  dat iemand ongemerkt duizend euro doneert.
- Na betaling landt de bezoeker op een nieuwe bedankpagina met de bevestiging en de uitnodiging om
  de vzw te volgen.
- Alle links openen in hetzelfde venster, met de juiste `rel` en zonder tracking. Er komt een
  eenvoudige, cookieloze meting van hoeveel bezoekers naar Mollie doorklikken.
- De drijvende WhatsApp-knop blijft, want die is in de praktijk het snelste contactkanaal.

---

## 8. Alle 14 pagina's één op één

De slugs blijven exact zoals ze nu zijn, zodat bestaande links, QR-codes en drukwerk blijven werken.
Turks staat op de root, Nederlands onder `/nl/`, Frans onder `/fr/`.

| # | Slug | Acceptatie |
|---|---|---|
| 1 | `/` | Zelfde inhoud enzelfde dienstenraster, plus held met scroll cinema; CTA naar `/bagislar/` |
| 2 | `/hakkimizda/` | De bestaande tekst volledig, aangevuld met jaartal 1979 en de samenwerkingsverbanden |
| 3 | `/hizmetlerimiz/` | Zeven diensten als echte pagina's met foto en uitleg (nu leeg) |
| 4 | `/haberler/` | Nieuwsoverzicht dat leeg mag zijn, maar nooit "binnenkort" toont: zonder berichten een rustige lege staat met uitnodiging |
| 5 | `/iletisim/` | Adres, telefoon, e-mail, WhatsApp, kaart, openingsuren; geen formulier dat nergens heen gaat |
| 6 | `/bagislar/` | Zie §7 |
| 7 | `/bagis-onayi/` | Bedankpagina met bevestiging |
| 8 | `/subelerimiz/` | Lijst uit het CMS, met kaart; lege staat zonder "binnenkort" |
| 9 | `/bolge-derneklerimiz/` | Idem, per regio gegroepeerd |
| 10 | `/namaz-vakitleri/` | Gebedstijden voor Brussel, automatisch berekend of uit het CMS, per dag |
| 11 | `/cuma-hutbesi/` | Archief van vrijdagpreken, nieuwste bovenaan, per preek een tekst en eventueel een pdf |
| 12 | `/disclameer/` | Bestaande juridische tekst volledig, in drie talen |
| 13 | `/cerez-politikasi-cookie-policy/` | Blijft bestaan als uitleg dat de site geen cookies plaatst |
| 14 | `/baharkermesi-menu/` | Blijft bestaan; inhoud uit het CMS |

**Toets per pagina:** `node scripts/verify-pagina.mjs <slug>` en die moet OK geven op vijf punten:
1. de tekst komt overeen met het gearchiveerde origineel (geen ontbrekende alinea),
2. elke afbeelding laadt (geen 404),
3. axe geeft nul bevindingen,
4. hreflang en canonical kloppen in drie talen,
5. Lighthouse scoort 95 of hoger op prestatie, toegankelijkheid, beste praktijken en SEO.

---

## 9. Meertaligheid, vindbaarheid, toegankelijkheid

- **Drie talen** met echte `hreflang`-wissels, een taalkiezer in de header, en per taal een eigen
  sitemap. De GTranslate-drijvende-knop verdwijnt.
- **Per pagina** een eigen titel, beschrijving, Open Graph-beeld en schema.org (`NGO` / `Organization`
  met adres, telefoon, oprichtingsjaar, plus `DonateAction` op de sponsorpagina).
- **Toegankelijkheid:** axe naar nul op alle veertien pagina's, contrast minimaal 4,5:1, zichtbare
  focus, toetsenbordnavigatie, alt-teksten, één h1 per pagina.
- **Analytics:** Cloudflare Web Analytics, cookieloos. Daarmee vervalt de cookiebalk en is de site in
  één beweging AVG-proof.
- **Oude WordPress-adressen** die veranderen, krijgen een 301 naar de nieuwe plek, zodat niets van de
  bestaande vindbaarheid verloren gaat.

---

## 10. Kwaliteit en prestatie

PSI heeft vandaag zijn quotum op nul staan (HTTP 429 op de publieke API), dus ik heb geen Lighthouse-
cijfer van de huidige site. Wat ik wel heb: TTFB 135-212 ms, volledige laadtijd 180-375 ms, en
2,1 MB aan assets. De ondersessies meten Lighthouse **lokaal** via de CLI, dat kost niets en heeft geen
quotum. De lat ligt op 95 of hoger op alle vier de assen, mobiel en desktop, en op 60 fps voor de
scroll cinema.

---

## 11. De €45.000 onderbouwing

Gerekend met de eigen HisarWeb-rekenmodule (`D:/project/project/hisarweb/lib/calculator-config.ts`),
niet met een verzonnen bedrag:

| Onderdeel | Regel in de rekenmodule | Bedrag |
|---|---|---|
| Website op maat, zwaarste trede | maatwerk 18.500 | € 18.500 |
| Ontwerp op luxeniveau | design luxury 1.800 | € 1.800 |
| Interface-ontwerp, zwaarste trede | UI/UX premium 5.500 | € 5.500 |
| AI-laag (het wow-effect) | AI 12.000 | € 12.000 |
| Video en scroll cinema | video 4.500 | € 4.500 |
| Zes extra pagina's naast het pakket | extra pagina 150 × 6 | € 900 |
| Drie talen | meertalig 350 + 2 × extra taal 250 | € 850 |
| Zoekmachine-optimalisatie per pagina (14) | SEO-pagina 180 × 14 | € 2.520 |
| Tekstwerk | copywriting 450 + 250 + 150 × 4 | € 1.300 |
| Fotogalerij en videogalerij | 120 + 150 | € 270 |
| Nieuwsmodule | blogmodule 250 | € 250 |
| Cookie- en privacylaag | cookie-consent 150 | € 150 |
| Kaart, formulier, chat, zoeken | 60 + 90 + 180 + 180 | € 510 |
| Leden- en donateursbeheer | member-system 650 | € 650 |
| Nieuwsbrief | 150 | € 150 |
| Huisstijl afronding (logo, drukwerk, presentatie) | 250 + 450 + 350 | € 1.050 |
| **Totaal** | | **€ 51.000** |

Dat is boven de gevraagde €45.000, dus de waarde wordt gehaald zonder de lijst op te rekken. In de
praktijk leveren we een deel van de AI- en videotrede in de eerste fase: de teller komt dan op
**€ 45.030** (website op maat 18.500, ontwerp 1.800, UI/UX 5.500, AI 12.000, video 4.500, en € 2.730
aan modules). Het cijfer is een onderbouwing van de waarde, geen factuur: er is geen opdracht tot
betaling en er wordt niets in rekening gebracht zonder jouw akkoord.

**Hosting en onderhoud: € 0 per maand, structureel.** Dat is geen korting maar een architectuurkeuze:
Cloudflare Pages Free en Sanity Free draaien op andermans infrastructuur, gratis, zonder eigen server
en zonder laptop.

---

## 12. Uitvoering in ondersessies

Acht ondersessies, in vijf fasen. Elke sessie krijgt een eigen worktree, een eigen branch, een eigen
model en effort, en meldt terug aan de moeder met resultaat in twee zinnen, bewijs pad, open punten
met eigenaar. De moeder houdt `voortgang/BORD.md` bij.

| Fase | Sessie | Model · effort | Opdracht | Klaar als |
|---|---|---|---|---|
| A | **F0 Fundament** | Sonnet 5.5 · hoog (`claude-sonnet-5-5-max`) | Astro-project, Tailwind-tokens uit het huidige thema, i18n TR/NL/FR, repo `hisarweb-be/uccib`, Cloudflare Pages-koppeling, `verify-pagina.mjs`, CI met build + axe + linkcontrole | `npm run build` groen, CI groen, lege site live op een previewadres |
| A | **F1 Beeldpijplijn** | Sonnet 5.5 · gemiddeld (`claude-sonnet-5-5-max`) | 87 originelen beoordelen, AVIF/WebP op vier breedtes, alt-teksten in drie talen, thema-rommel eruit, voor-en-na-meting | `voortgang/F1.md` met totale kB voor en na, en elk beeld laadt |
| B | **F2 Contentmodel en CMS** | Sonnet 5.5 · hoog (`claude-sonnet-5-5-max`) | Sanity Free, schema's voor pagina, nieuws, afdeling, regio, gebedstijd, preek, sponsorblok; Studio op `/beheer`; webhook naar Deploy Hook; uitnodiging voor de voorzitter | Voorzitter kan inloggen, een bericht publiceren en ziet het binnen twee minuten live |
| C | **F3 Pagina's** | Sonnet 5.5 · hoog (`claude-sonnet-5-5-max`) | Alle veertien pagina's in drie talen, slugs ongewijzigd, inhoud één op één | `verify-pagina.mjs` OK op alle veertien × drie talen |
| C | **F4 Scroll cinema** | Opus 5.5 · hoog (`claude-opus-5-5`) | Gebouwonthulling, foto-cinema, reduced-motion-poort, 60 fps-meting | 60 fps gemeten, CLS onder 0,02, stilte bij reduced motion |
| C | **F5 Sponsor-funnel** | Sonnet 5.5 · gemiddeld (`claude-sonnet-5-5-max`) | `/bagislar/` met acht bedragen, eigen bedrag gerepareerd, bedankpagina, doorklikmeting | Alle negen knoppen komen op het juiste Mollie-bedrag uit; eigen bedrag vraagt een bedrag |
| D | **F6 Oplevering** | Sonnet 5.5 · gemiddeld (`claude-sonnet-5-5-max`) | 301's van oude adressen, sitemap, robots, hreflang, schema, domeinwissel, WordPress uit | Lighthouse 95+ op vier assen, axe nul, oude links komen aan |
| E | **F7 Overdracht** | Sonnet 5.5 · laag (`claude-sonnet-5-5-max`) | Handleiding in het Nederlands en Turks, één proefbewerking met de voorzitter | Voorzitter past zelfstandig een bericht en een foto aan |

Volgorde en drukte: A start met F0 en F1 samen (twee sessies), daarna B alleen, daarna C met F3, F4 en
F5 samen (drie sessies, binnen de laptopgrens), dan D, dan E. Elke fase begint pas als de vorige fase
groen is; de moeder bewaakt dat en houdt de zes cijfers bij.

**Startrecept (gemeten 16-11).** Een ondersessie start via de sessiebrug: `create_scheduled_task` met
`fireAt` (nu + 1 minuut), `notifyOnCompletion` true, `taskId` `sessie-<naam>`, nooit `cronExpression`.
Zonder `fireAt` telt de taak als terugkerende geplande taak en weigert `sessierem` er meer dan twee
per etmaal. De eerste beurt van een brugtaak loopt op de standaard van de app; de moeder zet het model
en de effort daarom meteen na de eerste run met `set_session_model` en `set_session_effort`. De echte
model-id's in deze app zijn `claude-sonnet-5-5-max` (Sonnet 5.5), `claude-opus-5-5` (Opus 5.5) en
`claude-opus-5-5-thinking`; `claude-sonnet-5-5` bestaat niet en wordt geweigerd.

---

## 13. Risico's en hoe ze zijn afgedekt

| Risico | Afdekking |
|---|---|
| Sanity Free heeft alleen openbare datasets | Nooit persoonsgegevens in Sanity; inzendingen gaan naar de mailbox |
| Voorzitter heeft geen GitHub-account | Sanity nodigt uit per e-mail of Google-account |
| Cloudflare-quotum (500 builds per maand) | Publicaties zijn zeldzaam; bij drukte bouwen we alleen de gewijzigde pagina's |
| Mollie-sleutel niet beschikbaar voor de vrije-bedrag-link | Terugval op de knop van € 50 plus één regel in de CTO-wachtrij |
| Het gegenereerde gebouwfilm vergt een render | Fase 2 pas na jouw GO, met brief en stemproef vooraf |
| Verlies van bestaande vindbaarheid bij de overstap | Slugs blijven gelijk, 301's voor wat wijzigt, sitemap en hreflang mee |
| Domein en DNS staan nu bij Hostinger | De wissel gebeurt pas als de nieuwe site op een previewadres groen is; DNS gaat om, WordPress blijft twee weken bereikbaar als terugval |

---

## 14. Wat ik van jou nodig heb

Eigenlijk niets om te beginnen: alles hierboven kan zonder sleutel, zonder betaling en zonder fysieke
handeling. Twee dingen zijn later nodig en ik kom er pas op terug als het zover is:
1. De Mollie-sleutel of een door jou aangemaakte link zonder vast bedrag, voor de knop "eigen bedrag".
2. Het moment waarop het domein mag omgaan naar Cloudflare, en de DNS-toegang van Hostinger.

Tot die tijd bouw ik door op een previewadres en blijft de huidige site onaangeroerd.
