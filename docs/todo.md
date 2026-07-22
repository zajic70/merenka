# Měřenka — otevřené úkoly

## Rejstřík

**A. Přesun do B2B** *(naplánováno, zatím se nerealizuje — podrobně v [prenos-do-b2b.md](prenos-do-b2b.md))*
1. Datový model figur + katalog měr
2. Měřenka jako Nette stránka
3. Editor s ukládáním SVG
4. Napojení na objednávku
5. Samostatná měřenka + tisk protokolu
6. Archivace repa Merenka

---

## A. Přesun do B2B

**Stav: naplánováno, NEREALIZUJE SE.** Do rozhodnutí o zahájení běží Měřenka dál tady
a na https://zajic70.github.io/merenka/.

Kompletní plán včetně architektury, DB schématu, protokolu postMessage, bezpečnosti a ověření
je v **[prenos-do-b2b.md](prenos-do-b2b.md)**. Níže jen rozcestník.

### A1. Datový model figur + katalog měr
Tabulka `wtabMerenkaFigury`, `MerenkaFiguryRepository`, prvotní naplnění dnešními SVG,
`MerenkaKatalog` (MIRY + ZKRATKY + DEFAULTS z `js/app.js`), `Resource::Merenka`.

### A2. Měřenka jako Nette stránka
`MerenkaPresenter::actionEmbed`, holý layout, port `js/app.js` a `css/style.css` do `assets/`,
postMessage API. V embed režimu vypnout `beforeunload`, localStorage i předvyplnění `DEFAULTS`.

### A3. Editor s ukládáním SVG
`actionEditor` + `handleUlozFiguru` (POST+CSRF), port `editor.html`, filtr `|safesvg`.
Odpadá dnešní vazba editoru na `index.html` přes `fetch()`.

### A4. Napojení na objednávku
Až vznikne modul objednávek v B2B (`objednavky.latte` je zatím stub). Tlačítko + modál s iframem
+ skrytý input, tabulka `wtabObjednavkaMiry`, serverová validace (mimo rozsah = varování).

### A5. Samostatná měřenka + tisk protokolu
**Podmínka archivace.** Bez toho by se ztratily dvě věci, které `VAVIB2B/PLAN.md:235-236` vede
jako hotové a zákazníkovi předvedené.

### A6. Archivace repa Merenka
Až A1–A5 běží v B2B: kontrola úplnosti přesunu, úprava odkazů ve `VAVIB2B/PLAN.md`,
GitHub Archive (nemazat, nedávat na private), lokálně přejmenovat na `Merenka-archiv`.
