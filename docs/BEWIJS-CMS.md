# Bewijs: inloggen op het bewerkscherm zonder token

Gemeten op 19 november 2026, op tak `claude/cms-auth`. Dit is de bewijslast
voor de opdracht "CMS-inloggen zonder token, voor dhr. Omer". Wat hier staat is
nagekeken met het commando dat erbij staat, niet ingevuld uit verwachting.

## Wat er is gebouwd

| Onderdeel | Waar | Status |
|---|---|---|
| Authenticator (Cloudflare Worker) | `cms-auth/`, live op `https://uccib-cms-auth.hisarweb-be.workers.dev` | draait |
| Versie-ID van de laatste uitrol | `418bd44d-5ed1-4914-8a2e-2bfc4df27f1c` | actief |
| Toegestane domeinen | `uccib.pages.dev`, `uccib.com`, `www.uccib.com`, `localhost`, `cms.netlify.com` | als gewone variabele in `wrangler.toml` |
| KV, D1, cron | geen van drie | niet nodig, er wordt niets bewaard |
| Koppeling in de site | `backend.base_url` in `public/admin/config.yml` | gezet |
| Sveltia-versie | vastgezet op `0.269.2` met `integrity`-hash | gezet |
| Poort | `scripts/verify-cms.mjs`, stap "Bewerkscherm en authenticator" in CI | groen |

De bron van de Worker is één op één overgenomen van
<https://github.com/sveltia/sveltia-cms-auth> op commit `26b168a`
(18 november 2026), met de MIT-licentie ernaast. Niets zelf herschreven: de
CSRF-controle en de domeincontrole zijn daar getest, en een eigen variant zou
die toetsen opnieuw moeten verdienen voor een scherm met één gebruiker.

## Wat er is gemeten

| Meting | Commando | Uitkomst |
|---|---|---|
| Site bouwt | `npm run build` | exit 0, 43 pagina's |
| Bewerkscherm in de uitrol | `ls dist/admin/` | `config.yml`, `index.html` |
| Typecontrole | `npm run check` | 0 fouten, 0 waarschuwingen |
| Inhoud en 404 | `npm run verify` | 24 pagina's, 18 concepten verborgen, 404 bestaat |
| Poort bewerkscherm | `npm run verify:cms` | 6 van 6 ok |
| Poort met netwerk | `npm run verify:cms:levend` | 12 van 12 ok |
| Eigen domein toegelaten | `curl ".../auth?provider=github&site_id=uccib.pages.dev"` | 200 met `MISCONFIGURED_CLIENT` (wacht op de geheimen) |
| Vreemd domein geweigerd | `curl ".../auth?provider=github&site_id=example.com"` | 200 met `UNSUPPORTED_DOMAIN` |
| Geen openbare startpagina | `curl ".../"` | 404 |
| Geen 5xx | alle drie de aanroepen hierboven | geen |
| Geen geheim in de repo | `git grep -iE "ghp_\|github_pat_\|client_secret\s*:" -- cms-auth public/admin` | niets |

De poort is ook omgekeerd getest: zonder `dist/admin/` geeft hij exit 1, zonder
`base_url` exit 1, en met een verkeerde integrity-hash exit 1 (die laatste alleen
met `--levend`, want zonder netwerk is er niets om de hash tegen te houden).

## Wat nog op Altuner wacht

De GitHub-app kan alleen in de browser worden aangemaakt; GitHub heeft daar geen
API voor. Zonder die app geeft de Worker een nette melding in plaats van een
login. De bundel staat in het eindverslag van de ondersessie en in
`cms-auth/README.md`. Kort: app aanmaken, Client ID en Client Secret doorgeven
per bericht, de moeder zet ze met `wrangler secret put`, daarna is de knop leven.

## Wat bewust niet is gedaan

- `uccib.com` en de DNS: die staan nog op de oude WordPress-site. Het beheer
  staat daarom voorlopig op `uccib.pages.dev/admin/`, en de uitleg aan dhr. Omer
  zegt dat eerlijk.
- Een eigen adres voor de Worker (`cms-auth.uccib.com`): kan pas als het domein
  bij Cloudflare staat. Tot dan is `uccib-cms-auth.hisarweb-be.workers.dev` het
  adres; het staat in `cms-auth/README.md` als latere stap.
- De inhoud, de collecties en de teksten van de site: onaangeroerd.
