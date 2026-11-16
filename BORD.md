# UCCIB — bord (moeder houdt dit bij)

Moedersessie: `local_a99fb642-a6f5-4781-8598-dc7fbca18ac4` ("UCCIB", Fable 5.2, Opus 5.5 · high · bypass)
Plan: `D:\project\project\uccib\planning\PLAN-UCCIB.md`
Werkmap website: `D:\project\project\uccib\website` (eigen git-repo, wordt `hisarweb-be/uccib`)
Verslagen van ondersessies: `D:\project\project\uccib\voortgang\<sessie>.md`

## Stand per ondersessie

| Sessie | Model · effort | Status | Sessie-id | Verslag | Open punten |
|---|---|---|---|---|---|
| F0 Fundament | Sonnet 5.5 · hoog (bijgesteld vanaf 16-11 16:12) | loopt (gestart 16-11 15:53) | `local_235055c2-3c63-4e6a-9cb7-269411a4046b` | `voortgang/F0.md` | geen |
| F1 Beeldpijplijn | Sonnet 5.5 · gemiddeld (bijgesteld vanaf 16-11 16:12) | loopt (gestart 16-11 15:54) | `local_8c654466-8c4f-4f5e-82e6-398311f0a4c6` | `voortgang/F1.md` | geen |
| F2 Contentmodel en CMS | Sonnet 5.5 · hoog | wacht op F0 | | `voortgang/F2.md` | Sanity-account |
| F3 Pagina's | Sonnet 5.5 · hoog | wacht op F2 en F1 | | `voortgang/F3.md` | |
| F4 Scroll cinema | Opus 5.5 · hoog | wacht op F0 en F1 | | `voortgang/F4.md` | |
| F5 Sponsor-funnel | Sonnet 5.5 · gemiddeld | wacht op F0 | | `voortgang/F5.md` | Mollie-sleutel voor vrij bedrag |
| F6 Oplevering | Sonnet 5.5 · gemiddeld | wacht op F3, F4, F5 | | `voortgang/F6.md` | DNS-toegang Hostinger |
| F7 Overdracht | Sonnet 5.5 · laag | wacht op F6 | | `voortgang/F7.md` | |

## Fasen

- **A** (loopt): F0 en F1 samen.
- **B**: F2 zodra F0 groen is.
- **C**: F3, F4 en F5 samen zodra F1 en F2 groen zijn.
- **D**: F6 zodra F3, F4 en F5 groen zijn.
- **E**: F7 zodra F6 groen is.

## Hoe een ondersessie terugmeldt

Eén `send_message` naar `local_a99fb642-a6f5-4781-8598-dc7fbca18ac4` vóór haar slotbeurt, met:
resultaat in twee zinnen, verslagpad, open punten met eigenaar. Mislukt dat: dezelfde tekst als
bestand in `C:\Users\husey\.claude\state\terugmelding\local_a99fb642-a6f5-4781-8598-dc7fbca18ac4\<naam>.md`
en stoppen.

## Regels die voor elke ondersessie gelden

- Werkmap: `D:\project\project\uccib\website`, F1 werkt in `D:\project\project\uccib\beeld`. Eén sessie per map.
- Niets op C:, temp onder `D:\tmp\win\`.
- Geen betaalde dienst, geen eigen server, geen laptop als host.
- Eigen branch, eigen commit, pushen volgens de poort van het project.
- Afwijking van het plan: meten, melden aan de moeder, plan bijwerken.

## Logboek moeder

- 16-11 15:53 — F0 gestart (sessiebrug, taak `sessie-f0-fundament`, daarna uitgezet).
- 16-11 16:12 — model en effort van F0 (hoog) en F1 (gemiddeld) op Sonnet 5.5 gezet; ze startten op de standaard van de app.
- 16-11 15:54 — F1 gestart (sessiebrug, taak `sessie-f1-beeld`, daarna uitgezet).

## Notitie werkmap (16-11 16:20)

F0 en F1 zijn samen gestart en delen daarom dezelfde basis `D:\project\project\uccib`; ze raken elk
alleen hun eigen submap (`website` respectievelijk `beeld`). Vanaf F2 krijgt elke sessie een eigen
worktree, zodat twee sessies nooit in dezelfde map werken.

## Nameting 16-11 16:44 (moeder)

- **F0** draait nog. In `website/` staat nu een echt Astro-project: `astro.config.mjs`, `src`,
  `public`, `scripts`, `docs`, `.github` (CI), `tsconfig.json`, `.nvmrc`, `package.json`. Nog geen
  commit, nog geen verslag.
- **F1** draait nog. Alle **87 originelen** staan in `beeld/origineel/` en de conversiescripts in
  `beeld/scripts/`; `beeld/klaar/` is nog leeg. Nog geen verslag.
- Beide vensters leven (laatste activiteit 16:44) en hebben de bijgestelde Sonnet 5.5 met hoog
  respectievelijk gemiddeld effort.

## Nameting 16-11 17:15 (moeder)

- **F0** is in zijn afronding, niet vastgelopen. `npm run build` groen: 42 pagina's in 28,77 s.
  `npm run verify` groen: "OK 42 pagina's gekeurd: 14 slugs x 3 talen, nul fouten". Daarna startte
  F0 `verify:links` en `astro check`; om 17:21 schreef het `.github/workflows/ci.yml`,
  `docs/BESLUITEN.md` en `README-DEPLOY.md`. Nog geen commit en nog geen verslag.
- **F1** draait nog; het transcript groeit door. `beeld/klaar/` bevat nu acht mappen
  (dank-donatie, gebouw, interieur, logo, menukaart-bahar-kermesi, mescit, og) plus `manifest.json`.
- Beide vensters leven (transcript groeit), maar `last_activity_at` van de taken blijft op 16:19
  staan. Die tijdsregel is dus geen betrouwbare levensteken; het transcript is dat wel.

## Les sessierem, gemeten 16-11 17:25

Het `sessierem`-hook telt een `create_scheduled_task` **zonder `fireAt`** als terugkerende geplande
taak (grens 2 per 24 uur) en een **met `fireAt`** als sessiebrug (lusrem: 3x dezelfde naam met
dezelfde brief in 6 uur, anders 20 starts per uur). Vier nieuwe ondersessies werden geweigerd omdat
ze zonder `fireAt` waren aangemaakt. Regel vanaf nu: **een ondersessie start altijd met `fireAt`.**

De twee zonder `fireAt` aangemaakte taken (`sessie-f2-cms`, `sessie-f3-paginas`) zijn verwijderd; F2
loopt als `sessie-f2-cms-2` met `fireAt` 17:29:50. De map van een verwijderd taakId blijft bestaan,
dus een volgende start van dezelfde sessie gebruikt `<naam>-2`, `<naam>-3`.

Het model van een brugtaak is niet mee te geven bij het aanmaken. De moeder zet het meteen na de
eerste run met `set_session_model` (`claude-sonnet-5-5-max`; F4 op `claude-opus-5-5`) en
`set_session_effort`; de eerste beurt loopt op de standaard van de app (Opus thinking).

## Startrecept F3 tot en met F7

Elke fase pas als de vorige groen is. Nooit twee sessies in dezelfde map: F3, F4 en F5 hangen een
eigen worktree aan `D:\project\project\uccib\website`.

| Sessie | taskId | Brief | Model · effort |
|---|---|---|---|
| F3 Pagina's | `sessie-f3-paginas-2` | `opdrachten/F3-paginas.md` | Sonnet 5.5 · hoog |
| F4 Scroll cinema | `sessie-f4-scrollcinema` | `opdrachten/F4-scrollcinema.md` | Opus 5.5 · hoog |
| F5 Sponsor-funnel | `sessie-f5-sponsor` | `opdrachten/F5-sponsor.md` | Sonnet 5.5 · gemiddeld |
| F6 Oplevering | `sessie-f6-oplevering` | `opdrachten/F6-oplevering.md` | Sonnet 5.5 · gemiddeld |
| F7 Overdracht | `sessie-f7-overdracht` | `opdrachten/F7-overdracht.md` | Sonnet 5.5 · laag |

Elke brief begint met `change_directory` naar `D:\project\project\uccib\website` (F6 en F7 ook),
eindigt met `TERUGMELDEN-AAN-MOEDERSESSIE local_a99fb642-a6f5-4781-8598-dc7fbca18ac4`, en de taak
krijgt `fireAt` (nooit `cronExpression`), `notifyOnCompletion` true. Een fireAt-taak zet zichzelf na
zijn run uit; `enabled: false` is dan niet meer nodig.
