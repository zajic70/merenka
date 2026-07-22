# Přesun Měřenky do B2B — podrobný plán

> **Stav: naplánováno, NEREALIZUJE SE.** Dokument vznikl 22. 7. 2026 jako podklad pro pozdější
> přesun. Do té doby Měřenka běží dál tady a na https://zajic70.github.io/merenka/.

---

## 1. Proč se Měřenka stěhuje

Měřenka je dnes **statická stránka bez backendu** (HTML + JS + CSS, nasazená na GitHub Pages).
Dvě věci si vynucují přesun do PHP aplikace:

1. **Míry se musí dostat do formuláře objednávky.** V B2B webu pro VAVI má být u položky
   objednávky tlačítko, které otevře Měřenku, a po dokončení se naměřené hodnoty přenesou
   do inputu formuláře. Viz `VAVIB2B/ZADANI.md` kap. 3 a `VAVIB2B/PLAN.md` „Úkol — Zadávání
   rozměrů s obrázkem-nápovědou".

2. **Editor má úpravy SVG grafiky ukládat.** Dnes editor úpravy jen vypíše do textarey
   (`editor.html:262`) a člověk je musí ručně vlepit do `index.html` a commitnout. GitHub Pages
   je statický a uložit nic neumí — ukládání potřebuje backend.

**Cílová aplikace:** `C:\_prg\B2B` — Nette 3.3 / Latte 3 / MSSQL (`sqlsrv`) / Bootstrap 5 + Vite,
IIS na `http://localhost/`. Má **vlastní `CLAUDE.md`** s konvencemi, které se musí dodržet
(PHPDoc česky u každé metody, zápisy do `docs/`, prefix `wtab` u tabulek, POST+CSRF u signálů).

---

## 2. Rozhodnutí

| Otázka | Volba | Poznámka |
|---|---|---|
| Cílová aplikace | **B2B** (`C:\_prg\B2B`) | modul objednávek zatím neexistuje (`objednavky.latte` je 3řádkový stub) |
| Rozsah okna u objednávky | **jedna položka** | ne celý košík — v B2B je košíkem objednávka |
| Forma v B2B | **Nette presenter + Latte** | iframe míří na routu, ne na statický soubor → za loginem, CSRF, data z DB |
| Uložení SVG | **DB + export do souborů** | vzor `wtabPreklady`: DB = zdroj pravdy pro editaci, runtime čte soubory |
| Staré repo | **po dokončení přesunu zaarchivovat** | Měřenka pak žije **jen** v B2B |

> ⚠️ **Protože se repo archivuje, musí být přesun úplný.** Všechno, co dnes umí demo, musí být
> v B2B **dřív**, než se repo zavře — jinak to nenávratně zmizí. Týká se to i věcí, které
> objednávka nepotřebuje, ale které `VAVIB2B/PLAN.md:235-236` vede jako **hotové a zákazníkovi
> předvedené**: *„Hotový tisk protokolu o měření v Měřence"* a *„Měřenka jako samostatný editor"*.
> Proto etapa 5 níže.

---

## 3. Inventura — co repo obsahuje a kam to půjde

| Z repa Merenka | Kam v B2B | Poznámka |
|---|---|---|
| `MIRY` — katalog rozměrů + min/max (`js/app.js:13`) | `App\Model\Merenka\MerenkaKatalog` (PHP) | **jediný zdroj pravdy**, do JS se předá z PHP |
| `ZKRATKY` (`js/app.js:6`) | `MerenkaKatalog` | zkratky do souhrnu „výš.182 krk.41" |
| `DEFAULTS` konfekční velikosti (`js/app.js:39`) | `MerenkaKatalog` | v embed režimu **se nepoužijí** (viz past níže), v samostatné měřence ano |
| 3× `<svg class="figure-svg">` (`index.html:194`, `:282`, `:330`) | DB `wtabMerenkaFigury` + `www/merenka/figury/*.svg` | přestává být HTML, stává se **daty** |
| logika měřenky (`js/app.js`) | `assets/merenka.js` | `kosikData`, `nactiDoTabulky`, `overRozsah`, `textZkratek`, `zobrazPohlavi` beze změny |
| tisk protokolu (`js/app.js:338–414` + `css/style.css:122–160`) | etapa 5 | **hotová věc předvedená zákazníkovi** — nesmí zmizet |
| styly (`css/style.css`) | `assets/merenka.scss` | |
| editor (`editor.html:61–273`) | `assets/merenka-editor.js` | Export → **Uložit** |
| `img/logo.svg` | `www/merenka/` nebo stávající `www/img/` | používá se v protokolu (`js/app.js:361`) |
| košík se 7 demo řádky (`index.html:23–109`) | — | embed = objednávka; samostatná měřenka = vlastní seznam |
| `beforeunload` (`js/app.js:417`) | — | v iframu by vyskakoval dotaz při zavření modálu |
| localStorage `merenka_vavi_kosik_v1` (`js/app.js:45`) | — | data drží formulář objednávky, resp. DB |
| CDN Bootstrap + ikony (`index.html:9–10`) | — | B2B si Bootstrap buildí přes Vite |
| `archiv/`, `postavy-precizni.svg`, `merenka.jpeg` | rozhodnout u etapy 6 | pracovní materiál, ne kód |

### Co se použije beze změny

Embed režim nebude přepisovat logiku — jen ji **jinak nastartuje**. Místo kliku na `.btn-mira`
v košíku (`js/app.js:258`) nastaví `aktivniRadek = 'embed'` a `aktivniPohlavi` ze zprávy `init`;
pak už funguje stávající mašinerie:

| Co | Kde | K čemu |
|---|---|---|
| `kosikData` — `{ idPolozky: { cisloMiry: hodnota } }` | `js/app.js:152` | datová struktura, kterou pošleme ven |
| živý zápis input → `kosikData` | `js/app.js:295` | funguje, jakmile je nastaven `aktivniRadek` |
| `nactiDoTabulky()` | `js/app.js:214` | naplnění tabulky z došlých dat |
| `overRozsah()` | `js/app.js:204` | oranžové zvýraznění míry mimo běžné rozmezí |
| `textZkratek()` | `js/app.js:174` | souhrn „výš.182 krk.41 …" → pošle se PHP jako `souhrn` |
| `zobrazPohlavi()` | `js/app.js:161` | přepnutí bloku muž/žena |
| `cisty()` | `editor.html:236` | očistí SVG od editorových úchytů před uložením |

---

## 4. Architektura v B2B

```
app/Presentation/Merenka/
    MerenkaPresenter.php        extends BasePresenter (login check)
        actionEmbed(string $pohlavi)   – holý layout, pro iframe v objednávce
        actionDefault()                – samostatná měřenka (etapa 5)
        actionEditor()                 – editor figur (admin layout)
        handleUlozFiguru(string $kod)  – POST + CSRF
    @merenka.latte              holý layout: bez railu, sidebaru a topbaru
    embed.latte, default.latte, editor.latte

app/Model/Merenka/
    MerenkaKatalog.php          MIRY + ZKRATKY + DEFAULTS jako PHP pole
    MerenkaFiguryRepository.php nactiProPohlavi() / uloz() / exportVse() / seedZeSouboru()

assets/
    merenka.js, merenka.scss            port js/app.js + css/style.css
    merenka-editor.js                   port editor.html

www/merenka/figury/{muz,muz-zad,zena}.svg    runtime zdroj postav
```

**Layout:** `BasePresenter::startup()` nastavuje `setLayout('admin')` (rail + sidebar + topbar).
Pro iframe to nechceme — `actionEmbed` přepne na `setLayout('merenka')`, holou stránku
jen s Bootstrapem a měřenkovými assety přes `{asset}`.

**Katalog do JS:** šablona vypíše `<script type="application/json" id="merenka-katalog">{$katalog|json}</script>`,
`merenka.js` si ho přečte. **Žádná duplicita mezi PHP a JS.**

### Databáze

Migrace `migrace/databaze/{mssql,mysql}/wtabMerenkaFigury.sql` — idempotentní, maticová forma
podle `B2B/docs/import-tabulky.md`, **spouští ručně uživatel**.

```sql
wtabMerenkaFigury (
    kod        NVARCHAR(20) PK,   -- muz | muz-zad | zena
    popis      NVARCHAR(100),     -- 'Muž – zepředu'
    pohlavi    NVARCHAR(4),       -- muz | zena
    poradi     INT,
    svg        NVARCHAR(MAX),
    svg_zaloha NVARCHAR(MAX),     -- předchozí verze = jednokrokové vrácení
    upraveno   DATETIME2
)
```

`svg_zaloha` je nad rámec vzoru překladů — levná pojistka, když se čára odtáhne špatně.

Pro etapu 4 (objednávka):

```sql
wtabObjednavkaMiry (
    id         PK,
    polozka_id FK,
    pohlavi    NVARCHAR(4),
    cislo_miry TINYINT,           -- 1..10 dle MerenkaKatalog
    hodnota    DECIMAL(5,1),      -- cm
    UNIQUE (polozka_id, cislo_miry)
)
```

Normalizovaně (ne JSON sloupec) kvůli exportu do Heliosu.

### Tok dat u figur (vzor `wtabPreklady`)

```
editor → Uložit → DB (wtabMerenkaFigury) → rovnou přepíše www/merenka/figury/<kod>.svg
                                            ↑
runtime (embed i samostatná měřenka) čte SOUBORY, ne DB

„Export všech"      DB → soubory     (obnova po deployi, který soubory přepsal)
seedZeSouboru()     soubory → DB     (prvotní naplnění, jen chybějící)
```

Uložení zapisuje do DB **i do souboru v jednom kroku** — nedá se zapomenout exportovat.

---

## 5. Bezpečnost

### ⚠️ SVG z editoru je XSS vektor

Uložené SVG se musí do stránky vypsat `|noescape`. Kdo smí editovat figury, může do SVG vložit
`<script>` nebo `onload=` a spustit JS všem uživatelům. `B2B/CLAUDE.md` má tvrdé pravidlo:
*„Nikdy `|noescape` na uživatelský/admin vstup."*

**Řešení — Latte filtr `|safesvg` po vzoru stávajícího `|safehtml`** (`App\Presentation\LatteExtension`):

- **whitelist tagů:** `svg, defs, marker, g, path, line, polyline, ellipse, circle, rect, text, tspan`
- **whitelist atributů:** geometrie (`d, x, y, x1, y1, x2, y2, cx, cy, rx, ry, width, height, points`),
  `class, transform, viewBox, fill, stroke, stroke-width, stroke-dasharray, marker-start,
  marker-end, id, data-mira, data-fig, aria-label`
- **zakázáno:** `script`, `foreignObject`, `use`, jakýkoli `on*` atribut, `href` / `xlink:href`
- sanitizace běží **při ukládání i při výpisu** (defense in depth)

### CSRF a oprávnění

- `handleUlozFiguru` mění stav → **`$this->requirePostWithCsrf()`** (405 bez POST, 403 bez tokenu).
  Formulář v Latte musí mít `<input type="hidden" name="_token" value="{$presenter->getCsrfToken()}">`.
- Nový **`Resource::Merenka`** + pravidla v `AuthorizationFactory` + řádek v `B2B/docs/prava.md`.
  Editor: `#[RequirePermission(Resource::Merenka, Privilege::Edit)]`.

---

## 6. Protokol postMessage (iframe ↔ objednávka)

Verze `v:1`. Iframe míří na Nette routu, ne na statický soubor.

```
iframe → host   { v:1, type:'merenka:ready' }
                  hned po načtení; host teprve TEĎ smí poslat init (jinak se ztratí)

host → iframe   { v:1, type:'merenka:init',
                  pohlavi:'muz'|'zena',
                  miry:{ 1:182, 3:100, … },      // dosud uložené, může být {}
                  opts:{ nazev:'Sako pánské', velikost:'50' } }

iframe → host   { v:1, type:'merenka:hotovo',
                  pohlavi:'muz',
                  miry:{ 1:182, … },
                  souhrn:'výš.182 krk.41 hrud.100 …' }   // z textZkratek()

iframe → host   { v:1, type:'merenka:zavrit' }   // uživatel dal Zrušit
```

**Bezpečnost zpráv:**

- `ready` se posílá s `targetOrigin='*'` — neobsahuje žádná data.
- Měřenka si z `init` zapamatuje `event.origin` a **odpovídá výhradně na něj**.
- Obě strany ověřují `event.source` (parent, resp. `iframe.contentWindow`).

**Časování:** host **nesmí** poslat `init` hned po vytvoření iframu — musí počkat na `ready`,
jinak se zpráva ztratí (iframe ještě nemá listener).

---

## 7. Etapy

### Etapa 1 — Datový model a katalog

1. Migrace `wtabMerenkaFigury.sql` (MSSQL + MySQL), spustí ručně uživatel.
2. `MerenkaFiguryRepository` — `nactiProPohlavi()`, `uloz()`, `exportVse()`, `seedZeSouboru()`
   (vzor `TranslationStorage::seedMissingFromFiles`).
3. Prvotní naplnění: dnešní 3 SVG vyjmout z `index.html` do
   `www/merenka/figury/{muz,muz-zad,zena}.svg`, pak `seedZeSouboru()`.
4. `MerenkaKatalog` — `MIRY` + `ZKRATKY` + `DEFAULTS` z `js/app.js` jako PHP pole.
5. `Resource::Merenka` + `AuthorizationFactory` + `docs/prava.md`.

### Etapa 2 — Měřenka jako Nette stránka

1. `MerenkaPresenter::actionEmbed(string $pohlavi)` + holý layout `@merenka.latte`.
2. `assets/merenka.js` — port `js/app.js`; katalog z PHP; **vypnout** `beforeunload`,
   localStorage i předvyplnění z `DEFAULTS`.
3. postMessage API dle kap. 6 + spodní lišta `[✓ Přenést míry do objednávky] [Zrušit]`.
4. `assets/merenka.scss` — port `css/style.css`.
5. `B2B/docs/merenka-embed-api.md` — popis protokolu.

### Etapa 3 — Editor s ukládáním

1. `MerenkaPresenter::actionEditor` (admin layout) + `handleUlozFiguru` s `requirePostWithCsrf()`.
2. `assets/merenka-editor.js` — port `editor.html:61–273`. **Klíčová změna:** postavy se
   **nečtou** přes `fetch('index.html')` (`editor.html:101`), ale dostane je vykreslené z PHP →
   tím zmizí dnešní vazba editoru na `index.html`.
3. Tlačítko **Export** → **Uložit**; před odesláním očistit SVG přes `cisty()`.
4. Filtr `|safesvg` + sanitizace při ukládání.
5. Tlačítko **„Export všech"** pro obnovu souborů po deployi.
6. Položka menu ve workspace `nastaveni` přes `$this->item(...)` v `menuDefinition()`.

### Etapa 4 — Napojení na objednávku

> Přijde až se samotným modulem objednávek, který zatím neexistuje.

Latte u položky:

```latte
<button type="button" class="btn btn-sm btn-outline-primary js-merenka"
        data-pohlavi="{$polozka->pohlavi}" data-cil="miry-{$polozka->id}">
    <i class="bi bi-rulers"></i> Měřenka
</button>
<input type="hidden" id="miry-{$polozka->id}" name="miry[{$polozka->id}]" value="{$polozka->miryJson}">
<span class="js-merenka-souhrn small text-muted"></span>
```

- `assets/main.js` — modál `modal-xl modal-fullscreen-lg-down`, iframe
  `src="{link :Merenka:embed}?pohlavi=…"`, výška `78vh`. Z-index modálu nad railem už
  `assets/main.scss` řeší (`.modal { z-index: 1600 }`).
- Uložení do `wtabObjednavkaMiry`.
- **Validace na serveru** proti `MerenkaKatalog`: číslo míry musí pro dané pohlaví existovat,
  hodnota číselná. **Mimo `min`–`max` je varování, ne chyba** — atypická postava je celý smysl
  Měřenky (klient to tak dělá už dnes, `js/app.js:204`).

### Etapa 5 — Samostatná měřenka + tisk protokolu (**podmínka archivace**)

Bez téhle etapy by se archivací ztratily dvě věci, které `VAVIB2B/PLAN.md:235-236` vede jako hotové:

1. **`Merenka:default`** — plná stránka pro člověka, který někoho měří: vlastní seznam měřených
   položek, přepínání muž/žena, konfekční předvyplnění z `DEFAULTS` (tady je namístě, na rozdíl
   od objednávky), postavy z téhož zdroje jako embed.
2. **Tisk protokolu** — port `vytvorProtokol()` (`js/app.js:358`) + tiskové styly `#protokol`
   (`css/style.css:122`). Tiskne z aktuální stránky bez popupu (commit `96bf9f9`) — tohle
   chování zachovat.
3. Položka v menu workspace `nakup`, u objednávek.

### Etapa 6 — Archivace repa Merenka

Teprve až etapy 1–5 běží v B2B:

1. **Kontrola úplnosti** — projít repo soubor po souboru a odškrtnout, že má v B2B protějšek:
   `index.html`, `js/app.js`, `css/style.css`, `editor.html`, `img/logo.svg`,
   `postavy-precizni.svg`, `archiv/`, `merenka.jpeg`. Co se nepřenese, ať je to **vědomé
   rozhodnutí, ne opomenutí**.
2. Do `B2B/docs/merenka.md` zapsat, odkud se Měřenka vzala a co všechno pohltila.
3. Upravit odkazy ve `VAVIB2B/PLAN.md` (řádky 181 a 233–234) — místo github.io ukázat na B2B.
4. GitHub → **Archive repository** (read-only). **Nemazat ani nepřepínat na private** — odkaz
   na demo má zákazník v zápisech z porad a archivované repo Pages dál servíruje.
5. Lokálně přejmenovat `C:\_prg\Merenka` → `Merenka-archiv`.

---

## 8. Pasti a poznámky z analýzy

- **`DEFAULTS` v objednávce jsou nebezpečné.** Dnes se při prvním otevření položky předvyplní
  konfekční velikost (`js/app.js:266`). V objednávce by to znamenalo, že uživatel odešle
  konfekční hodnoty jako „naměřené", aniž by kohokoli změřil. **V embed režimu se
  nepředvyplňuje**, v samostatné měřence ano.
- **`beforeunload` v iframu** (`js/app.js:417`) vyskakuje při každém zavření modálu. V B2B verzi
  vynechat.
- **localStorage má jeden globální klíč** (`js/app.js:45`) — embedovaná měřenka by míchala data
  mezi položkami objednávky. V B2B ho nahradí formulář a DB.
- **Editor je dnes navázaný na `index.html`** přes `fetch('index.html')` (`editor.html:101`) —
  `index.html` je tak zároveň stránka i zdroj grafiky. Jakmile se figury stanou daty, vazba mizí.
- **GitHub Pages neposílá `X-Frame-Options` ani `CSP: frame-ancestors`** (ověřeno curlem) —
  iframe by prošel i z github.io. Pro B2B je to ale stejně jedno, jede se přes vlastní routu.
- **Míra mimo rozsah není chyba.** `min`/`max` v `MIRY` jsou „běžné rozmezí"; atypická postava
  je celý smysl Měřenky. Klient ji jen oranžově zvýrazní (`overRozsah`), server ji musí **uložit**
  a nanejvýš varovat.
- **Nette past s parametrem `id` v signálech** (`B2B/CLAUDE.md`): `id` je v routě jako optional
  path segment, query `?id=3` se zahodí. U `handleUlozFiguru` proto parametr `$kod`, ne `$id`.

---

## 9. Ověření (až se bude realizovat)

**Etapa 1–3 (B2B, `http://localhost/`):**

1. Spustit migraci, ověřit seed: `/merenka/editor` ukáže 3 postavy shodné s dnešním demem.
2. Posunout jednu měřicí čáru → **Uložit** → reload → posun **zůstal**
   (dnes se po reloadu ztratí — to je hlavní zisk celého přesunu).
3. Ověřit soubor `www/merenka/figury/muz.svg` — obsahuje novou pozici.
4. **Bezpečnost:** uložit SVG s `<script>alert(1)</script>` a s `onload="alert(1)"` → obojí musí
   být z uloženého SVG odstraněno a nesmí se spustit při zobrazení.
5. **CSRF:** `?do=ulozFiguru` GETem → **405**; POST bez `_token` → **403**.
6. `/merenka/embed?pohlavi=muz` → holá stránka, tabulka měr + postavy, žádný rail/sidebar,
   pole **prázdná** (žádné konfekční předvyplnění).

**Etapa 4 (kolotoč dat):**

7. Na objednávce „Měřenka" → modál se otevře; vyplnit pár měr, jednu **schválně mimo rozsah**
   → zoranžoví, ale musí jít přenést.
8. „Přenést míry" → modál se zavře, objeví se souhrn, hidden input má JSON, konzole bez chyb.
9. Znovu otevřít → přijde `init` s uloženými mírami, **tabulka je předvyplněná** (round-trip).
10. „Zrušit" i zavření křížkem/Esc → hodnota v hostu se **nezmění** a **nevyskočí** dialog
    „opravdu chcete odejít".
11. Odeslat formulář → v `wtabObjednavkaMiry` sedí řádky; míra mimo rozsah **uložena**.

**Etapa 5–6:**

12. `/merenka` → samostatná měřenka: seznam položek, přepínání muž/žena, konfekční
    předvyplnění funguje.
13. „Protokol (PDF)" → tiskový náhled obsahuje hlavičku, přehled položek, naměřené rozměry
    **i postavy s měřicími čarami**; tiskne **jednou** a bez popupu; po zavření dialogu je
    stránka zpět v normálu.
14. **Poslední kontrola před archivací:** vedle sebe porovnat demo
    (`preview_start {name: "merenka"}` → `http://localhost:8765/`) a B2B verzi — B2B musí umět
    **všechno**, co demo. Teprve pak archivovat.

---

## 10. Co se vědomě NEDĚLÁ

- **Verzování figur** — jen jednokrokové `svg_zaloha`. Plná historie, až kdyby chyběla.
- **Kartotéka měřených osob** (uložení naměřené osoby pod jménem do DB) — `VAVIB2B/PLAN.md:191`
  to zmiňuje, ale je to samostatná funkce, ne součást přesunu.
- **Zpřístupnění Měřenky zákazníkům** — dle `VAVIB2B/ZADANI.md` kap. 10 placená vícepráce;
  v první verzi jen pro zaměstnance VAVI.
- **Přepis figur do Latte partialů** — zůstávají jako SVG soubory / záznamy v DB, ne jako šablony.
