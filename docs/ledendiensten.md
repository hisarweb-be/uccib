# De vier ledendiensten

Vier pagina's op de site horen bij het werk van de vereniging zelf: de vestigingen,
de regionale verenigingen, de gebedstijden en het preekarchief. Die pagina's staan
vandaag dicht (`active: false`). Dit document legt uit hoe ze gevuld worden, zodat
niemand daarvoor in de code hoeft.

De pagina's zijn:

| Pagina | Adres | Wat er komt |
|---|---|---|
| Şubelerimiz | `/subelerimiz/` | de vestigingen met adres, telefoon en openingsuren |
| Bölge derneklerimiz | `/bolge-derneklerimiz/` | de regionale verenigingen met hun contactpersoon |
| Namaz vakitleri | `/namaz-vakitleri/` | één tijdstabel per maand |
| Cuma hutbeleri | `/cuma-hutbesi/` | het archief van de vrijdagpreek, met PDF |

## Wat er in de repo staat

Per dienst is er een map met Markdown-bestanden, elk met één regel op de pagina:

```
src/content/subeler/*.md      een vestiging per bestand
src/content/dernekler/*.md    een regionale vereniging per bestand
src/content/vakitler/*.md     een maand per bestand
src/content/hutbeler/*.md     een preek per bestand
```

De velden staan in `src/content.config.ts`; Astro keurt elk bestand daartegen bij de
bouw. Klopt een veld niet, dan stopt de bouw met de naam van het bestand erbij, in
plaats van dat er iets half op de site komt.

Bewerken kan op twee manieren, en beide werken op dezelfde bestanden:

1. In het bewerkscherm op `/admin/` (Sveltia CMS). Daar heten de vier onderdelen
   `Şubeler`, `Bölge dernekleri`, `Namaz vakitleri` en `Cuma hutbeleri`. Een regel
   toevoegen of verwijderen mag daar: dat is inhoud, geen ontwerp.
2. Rechtstreeks een `.md`-bestand toevoegen in de map hierboven.

## De velden

**Vestiging** (`subeler`): `name`, `street`, `postalCode`, `city`, `phone`, `email`,
`openingHours`, `photo`, `order`, `active`.

**Regionale vereniging** (`dernekler`): `name`, `region`, `description`, `contact`,
`phone`, `email`, `website`, `photo`, `order`, `active`.

**Maandtabel** (`vakitler`): `month` in de vorm `2026-11`, `place`, `source`, de tabel
zelf in de body als Markdown-tabel, `order`, `active`.

**Preek** (`hutbeler`): `title`, `date`, `imam`, `language`, `file` (PDF), de tekst in
de body, `order`, `active`.

`photo` en `file` verwijzen naar een bestand onder `public/beeld/`; in het bewerkscherm
kies je dat gewoon uit de mediakiezer. Laat je ze leeg, dan komt er geen foto of knop.
`active` op `false` verbergt één regel zonder hem te wissen.

## Wat er gebeurt zolang er niets staat

De vier pagina's blijven dicht tot de schakelaar omgaat. Zolang een pagina dicht is:

- staat hij niet in de sitemap en wijst geen enkele link ernaar;
- antwoordt hij met `noindex, nofollow` en toont hij de pagina "in aanbouw";
- toont hij de pagina "in aanbouw" in plaats van de dienst, ook als er al bestanden
  in de collectie staan. Er wordt geen voorbeeldtekst verzonnen.

De schakelaar is één regel in het Turkse paginabestand, bijvoorbeeld
`src/content/paginas/tr/subelerimiz.md`:

```yaml
active: true
```

Die ene regel geldt voor alle drie de talen. Omzetten doet de vereniging zelf, of
dhr. Omer in het bewerkscherm; de site bouwt daarna binnen twee minuten opnieuw.

## Wat de bouw controleert

`npm run build` en de keuringen (`verify`, `verify:links`, `verify:server`,
`verify:elke`, `verify:scherm`, `verify:mobiel`) blijven de bestaande keten volgen:
`src/lib/actief.ts` leest alleen het Turkse paginabestand, een dichte pagina mag geen
inkomende links hebben, en twee pagina's mogen nooit dezelfde titel krijgen. Aan die
keten is niets veranderd; de vier diensten hangen er alleen onder.
