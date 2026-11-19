# CMS-authenticator (`cms-auth/`)

Dit mapje is de kleine Cloudflare Worker die dhr. Omer laat inloggen met de knop
**"Sign In with GitHub"** op `/admin/`, zonder persoonlijk toegangstoken. Hij
klikt één keer, autoriseert zijn eigen GitHub-account, en daarna is hij binnen.
Zes maanden niet gebruiken betekent opnieuw inloggen; tussendoor gaat het
vanzelf.

Deze map hoort **niet** bij de site. `npm run build` in de bovenliggende map
negeert hem; Cloudflare Pages ziet hem nooit. De Worker staat apart bij
Cloudflare en draait op het gratis plan.

## Wat er in staat

| Bestand | Wat het is |
|---|---|
| `src/index.js` | De Worker zelf, één bestand, ongewijzigd overgenomen. |
| `LICENSE.txt` | De MIT-licentie van de maker. Die hoort erbij, ook al bewerken we niets. |
| `wrangler.toml` | Naam, begincode en compatibiliteitsdatum. Geen KV, geen D1, geen cron. |
| `.gitignore` | Houdt `.dev.vars` en `.wrangler/` buiten de repo. |

Bron: <https://github.com/sveltia/sveltia-cms-auth>, commit `26b168a`
(18 november 2026). Overgenomen in plaats van als pakket geïnstalleerd, zodat de
versie vastligt en de moeder precies kan zien wat er draait. Bijwerken is bewust
handwerk: nieuwe bron ophalen, hier neerzetten, uitrollen, nameten.

Waarom niet netjes uit de losse pols geschreven: dit is beveiligingscode. De
CSRF-controle, de controle op toegestane domeinen en de foutcodes waar Sveltia
op rekent, zijn in deze bovenstroom getest. Zelf overschrijven zou betekenen dat
we die toetsen zelf moeten maken voor een inlogsysteem dat één gebruiker heeft.

## Wat de Worker doet

Twee routes, verder niets:

- `GET /auth?provider=github&site_domain=uccib.pages.dev` stuurt de browser naar
  GitHub met een CSRF-cookie. Staat het domein niet in `ALLOWED_DOMAINS`, dan
  komt er een nette foutmelding in het popupje en géén doorverwijzing.
- `GET /callback?code=...&state=...` controleert de CSRF-cookie, wisselt de code
  bij GitHub in voor een toegangstoken en stuurt dat via `postMessage` terug
  naar het bewerkscherm. Alleen naar een venster op een domein uit
  `ALLOWED_DOMAINS`.
- `POST /auth` ververst een verlopen token. Alleen voor een herkomst uit
  `ALLOWED_DOMAINS`.

Er wordt niets bewaard: geen database, geen KV, geen log van tokens. De sessie
leeft in de browser van dhr. Omer.

## Uitrollen

Eenmalig, vanaf deze map:

```bash
npx wrangler@4.97.0 deploy
```

Daarna de twee waarden van de GitHub-app als geheim zetten. Die twee staan nooit
in een bestand, nooit in een commit en nooit in een verslag:

```bash
npx wrangler@4.97.0 secret put GITHUB_CLIENT_ID
npx wrangler@4.97.0 secret put GITHUB_CLIENT_SECRET
```

En het domein dat de Worker mag bedienen (geen geheim, gewone variabele):

```bash
npx wrangler@4.97.0 secret put ALLOWED_DOMAINS
# invoeren: uccib.pages.dev, uccib.com, www.uccib.com, *.uccib.pages.dev, localhost
```

`localhost` staat erbij zodat het bewerkscherm ook lokaal werkt; Sveltia stuurt
dan `cms.netlify.com` als domein mee, dat hoeft niet in de lijst.

Na het uitrollen:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://uccib-cms-auth.hisarweb.workers.dev/auth
```

Verwacht: `200` met een leesbare foutmelding ("client ID or secret is not
configured") zolang de twee geheimen nog niet gezet zijn, en een `302` naar
GitHub zodra ze er zijn.

## Wat er in de site bijhoort

In `public/admin/config.yml` staat onder `backend` één regel:

```yaml
base_url: https://uccib-cms-auth.hisarweb.workers.dev
```

Meer is het niet. Sveltia ziet die regel en toont de knop "Sign In with GitHub"
in plaats van het tokenveld. Zonder die regel valt het scherm terug op het
tokenveld, wat precies is wat we willen vermijden.

## Later: eigen adres

Zodra `cms-auth.uccib.com` bestaat (een CNAME naar de Worker, `uccib.com` moet
dan wel bij Cloudflare staan), verhuist de `base_url` mee en gaat het oude adres
uit. Tot die tijd is `uccib-cms-auth.hisarweb.workers.dev` het adres; dat staat
in de briefing voor dhr. Omer eerlijk vermeld.
