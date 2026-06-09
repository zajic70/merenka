/* ===== Měřenka VAVI – interaktivita ===== */
(function () {
    'use strict';

    // ---- Zkratky pro výpis měr v košíku ----
    const ZKRATKY = {
        muz:  { 1:'výš',  2:'krk',  3:'hrud', 4:'pas',  5:'sed',  6:'ruk',  7:'pže',  8:'sth', 9:'záda', 10:'krok' },
        zena: { 1:'výš',  2:'hrud', 3:'pas',  4:'sed',  5:'ruk',  6:'pže',  7:'sth',  8:'krok' }
    };

    // Definice rozměrů (číslo, popisek, min/max dle běžné populace v cm).
    // Číslo zároveň odpovídá značce v SVG (muz-1, zena-1, ...).
    const MIRY = {
        muz: [
            { n: 1,  label: 'výška postavy',        min: 150, max: 210 },
            { n: 2,  label: 'obvod krku',           min: 33,  max: 55  },
            { n: 3,  label: 'obvod hrudníku',       min: 80,  max: 140 },
            { n: 4,  label: 'obvod pasu',           min: 65,  max: 150 },
            { n: 5,  label: 'obvod sedu',           min: 80,  max: 140 },
            { n: 6,  label: 'délka ramene a ruky',  min: 50,  max: 80  },
            { n: 7,  label: 'obvod paže *',         min: 22,  max: 50  },
            { n: 8,  label: 'obvod stehna *',       min: 42,  max: 80  },
            { n: 9,  label: 'šíře zad',             min: 35,  max: 60  },
            { n: 10, label: 'kroková délka',        min: 68,  max: 95  },
        ],
        zena: [
            { n: 1, label: 'výška postavy',         min: 145, max: 195 },
            { n: 2, label: 'obvod hrudníku',        min: 75,  max: 130 },
            { n: 3, label: 'obvod pasu',            min: 58,  max: 130 },
            { n: 4, label: 'obvod sedu',            min: 80,  max: 140 },
            { n: 5, label: 'délka ramene a ruky',   min: 48,  max: 75  },
            { n: 6, label: 'obvod paže *',          min: 20,  max: 48  },
            { n: 7, label: 'obvod stehna *',        min: 42,  max: 75  },
            { n: 8, label: 'kroková délka',         min: 64,  max: 92  },
        ],
    };

    // Standardní konfekční velikost (muž ~50/L, žena ~38/M) – předvyplní se při prvním otevření položky.
    const DEFAULTS = {
        muz:  { 1:182, 2:41, 3:100, 4:88, 5:102, 6:64, 7:32, 8:58, 9:45, 10:82 },
        zena: { 1:168, 2:92, 3:74, 4:100, 5:60, 6:28, 7:58, 8:78 }
    };

    // Klíč pro uložení do prohlížeče
    const STORAGE_KEY = 'merenka_vavi_kosik_v1';

    // Vykreslení řádků tabulky pro dané pohlaví do první nalezené tabulky v kartě.
    function renderRows(pohlavi, tbody) {
        MIRY[pohlavi].forEach(function (m) {
            const key = pohlavi + '-' + m.n;
            const tr = document.createElement('tr');
            tr.dataset.row = key;
            tr.innerHTML =
                '<td class="mira-num">' + m.n + '.</td>' +
                '<td>' + m.label + '</td>' +
                '<td>' +
                    '<div class="input-group input-group-sm">' +
                        '<input type="number" step="1" min="' + m.min + '" max="' + m.max + '" class="form-control" ' +
                            'name="miry_' + pohlavi + '[' + m.n + ']" ' +
                            'data-mira="' + key + '" ' +
                            'title="běžné rozmezí ' + m.min + '–' + m.max + ' cm" ' +
                            'placeholder="' + m.min + '–' + m.max + '" ' +
                            'aria-label="' + m.label + '">' +
                        '<span class="input-group-text">cm</span>' +
                    '</div>' +
                '</td>';
            tbody.appendChild(tr);
        });
    }

    // Najde tbody v kartě podle záhlaví .tbl-head-muz / .tbl-head-zena
    function tbodyFor(pohlavi) {
        const head = document.querySelector('.tbl-head-' + pohlavi);
        return head ? head.closest('.card').querySelector('tbody') : null;
    }

    const muzBody = tbodyFor('muz');
    const zenaBody = tbodyFor('zena');
    if (muzBody) renderRows('muz', muzBody);
    if (zenaBody) renderRows('zena', zenaBody);

    // ---- Přesun ilustrací ze skrytého zdroje k tabulkám (vedle vstupů) ----
    (function presunIlustrace() {
        var slotMuz = document.getElementById('fig-slot-muz');
        var slotZena = document.getElementById('fig-slot-zena');
        document.querySelectorAll('#fig-zdroj .fig-col').forEach(function (col) {
            if (col.dataset.gender === 'zena') { if (slotZena) slotZena.appendChild(col); }
            else { if (slotMuz) slotMuz.appendChild(col); }
        });
    })();

    // ---- Šedé kolečko + velká oblast pro klik pod každým číslem ----
    const NS = 'http://www.w3.org/2000/svg';
    document.querySelectorAll('.mira-marker').forEach(function (marker) {
        var num = marker.querySelector('.num');
        if (!num) return;
        var cx = +num.getAttribute('x');
        var cy = +num.getAttribute('y');

        // šedé kolečko (pozadí čísla)
        var bg = document.createElementNS(NS, 'circle');
        bg.setAttribute('cx', cx);
        bg.setAttribute('cy', cy);
        bg.setAttribute('r', '11');
        bg.setAttribute('class', 'num-bg');
        marker.insertBefore(bg, num);

        // průhledný větší kruh pro pohodlnější klik
        var hit = document.createElementNS(NS, 'circle');
        hit.setAttribute('cx', cx);
        hit.setAttribute('cy', cy);
        hit.setAttribute('r', '18');
        hit.setAttribute('class', 'hit-area');
        marker.appendChild(hit);
    });

    // ---- Propojení pole <-> SVG značka ----
    function markers(key) {
        // může být ve více SVG (např. muz-1 zepředu i zboku)
        return document.querySelectorAll('.mira-marker[data-mira="' + key + '"]');
    }

    var COLOR_ACTIVE = '#0d6efd';
    var COLOR_DEFAULT = '#e0e0e0';

    function setActive(key, on) {
        markers(key).forEach(function (g) {
            g.classList.toggle('mira-active', on);
            var bg = g.querySelector('.num-bg');
            if (bg) bg.setAttribute('fill', on ? COLOR_ACTIVE : COLOR_DEFAULT);
        });
        var row = document.querySelector('tr[data-row="' + key + '"]');
        if (row) row.classList.toggle('row-active', on);
    }

    // Focus/blur na polích
    document.querySelectorAll('input[data-mira]').forEach(function (inp) {
        const key = inp.dataset.mira;
        inp.addEventListener('focus', function () { setActive(key, true); });
        inp.addEventListener('blur', function () { setActive(key, false); });
    });

    // Klik na značku v SVG → focus na příslušné pole
    document.querySelectorAll('.mira-marker').forEach(function (g) {
        g.addEventListener('click', function () {
            const inp = document.querySelector('input[data-mira="' + g.dataset.mira + '"]');
            if (inp) inp.focus();
        });
    });

    // ====== Košík ↔ míry dole na stránce ======
    var kosikData = {};        // { rowId: { n: hodnota } }
    var aktivniRadek = null;   // id řádku košíku
    var aktivniPohlavi = null; // 'muz' | 'zena'

    var hint    = document.getElementById('mereni-hint');
    var banner  = document.getElementById('mereni-banner');
    var sekce   = document.getElementById('mereni-sekce');

    // Zobraz pouze blok (tabulka + ilustrace) daného pohlaví
    function zobrazPohlavi(pohlavi) {
        document.querySelectorAll('.gender-block').forEach(function (el) {
            el.classList.toggle('d-none', el.dataset.gender !== pohlavi);
        });
        if (hint) hint.classList.add('d-none');
    }

    // Vstupní pole míry pro pohlaví (tabulka dole)
    function vstup(pohlavi, n) {
        return document.querySelector('input[name="miry_' + pohlavi + '[' + n + ']"]');
    }

    // Text se zkratkami z uložených dat řádku
    function textZkratek(pohlavi, data) {
        return MIRY[pohlavi].map(function (m) {
            var v = data[m.n];
            return (v !== undefined && v !== '') ? ZKRATKY[pohlavi][m.n] + '.' + v : null;
        }).filter(Boolean).join('  ');
    }

    // Zapiš text do řádku košíku
    function zapisDoRadku(rowId, pohlavi) {
        var row = document.querySelector('#kosik tr[data-kosik-id="' + rowId + '"]');
        if (!row) return;
        var span = row.querySelector('.miry-text');
        if (!span) return;
        var t = textZkratek(pohlavi, kosikData[rowId] || {});
        if (t) {
            span.textContent = t;
            span.classList.remove('text-muted', 'fst-italic');
            span.classList.add('text-dark');
        } else {
            span.textContent = '—';
            span.classList.add('text-muted', 'fst-italic');
            span.classList.remove('text-dark');
        }
    }

    // Naplň tabulku dole z uložených dat řádku
    function nactiDoTabulky(pohlavi, data) {
        MIRY[pohlavi].forEach(function (m) {
            var inp = vstup(pohlavi, m.n);
            if (inp) inp.value = (data && data[m.n] !== undefined) ? data[m.n] : '';
        });
    }

    // ---- Ukládání jako JSON (text + prohlížeč) ----
    var jsonField = document.getElementById('kosik-json');

    function ulozData() {
        var json = JSON.stringify(kosikData);
        if (jsonField) jsonField.value = json;
        try { localStorage.setItem(STORAGE_KEY, json); } catch (e) { /* localStorage nedostupné */ }
    }

    function maNejakaData() {
        return Object.keys(kosikData).some(function (id) {
            return kosikData[id] && Object.keys(kosikData[id]).length > 0;
        });
    }

    // ---- Obnova dříve uložených dat po reloadu ----
    (function obnovData() {
        var json = null;
        try { json = localStorage.getItem(STORAGE_KEY); } catch (e) { /* nic */ }
        if (!json) return;
        try { kosikData = JSON.parse(json) || {}; } catch (e) { kosikData = {}; return; }

        // doplň texty do řádků košíku podle pohlaví řádku
        document.querySelectorAll('#kosik tr[data-kosik-id]').forEach(function (tr) {
            var id = tr.dataset.kosikId;
            if (kosikData[id] && Object.keys(kosikData[id]).length) {
                zapisDoRadku(id, tr.dataset.pohlavi);
            }
        });
        if (jsonField) jsonField.value = json;

        // info, že byla načtena uložená data
        var info = document.getElementById('load-info');
        if (info && maNejakaData()) info.classList.remove('d-none');
    })();

    // Klik na „Měřenka" v košíku → otevři správné pohlaví dole
    document.querySelectorAll('.btn-mira').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var tr = btn.closest('tr');
            aktivniRadek = tr.dataset.kosikId;
            aktivniPohlavi = tr.dataset.pohlavi;
            if (!kosikData[aktivniRadek]) kosikData[aktivniRadek] = {};

            // První otevření bez dat → předvyplň standardní konfekční velikost
            if (Object.keys(kosikData[aktivniRadek]).length === 0) {
                MIRY[aktivniPohlavi].forEach(function (m) {
                    kosikData[aktivniRadek][m.n] = DEFAULTS[aktivniPohlavi][m.n];
                });
                zapisDoRadku(aktivniRadek, aktivniPohlavi);
                ulozData();
            }

            zobrazPohlavi(aktivniPohlavi);
            nactiDoTabulky(aktivniPohlavi, kosikData[aktivniRadek]);

            // banner s názvem položky
            document.getElementById('mereni-nazev').textContent = tr.dataset.nazev || '';
            var bdg = document.getElementById('mereni-pohlavi');
            bdg.textContent = aktivniPohlavi === 'muz' ? 'Muž' : 'Žena';
            bdg.className = 'badge ' + (aktivniPohlavi === 'muz' ? 'badge-muz' : 'badge-zena');
            banner.classList.remove('d-none');
            banner.classList.add('d-flex');

            // zvýrazni aktivní řádek košíku
            document.querySelectorAll('#kosik tr').forEach(function (r) { r.classList.remove('table-active'); });
            tr.classList.add('table-active');

            if (sekce) sekce.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Živý zápis při psaní do tabulek dole → do aktivního řádku košíku
    ['muz', 'zena'].forEach(function (pohlavi) {
        MIRY[pohlavi].forEach(function (m) {
            var inp = vstup(pohlavi, m.n);
            if (!inp) return;
            inp.addEventListener('input', function () {
                if (!aktivniRadek || aktivniPohlavi !== pohlavi) return;
                if (inp.value === '') delete kosikData[aktivniRadek][m.n];
                else kosikData[aktivniRadek][m.n] = inp.value;
                zapisDoRadku(aktivniRadek, pohlavi);
                ulozData();
            });
        });
    });

    // „Hotovo" → schovej míry, zpět na hint
    var zavrit = document.getElementById('mereni-zavrit');
    if (zavrit) {
        zavrit.addEventListener('click', function () {
            aktivniRadek = null;
            aktivniPohlavi = null;
            document.querySelectorAll('.gender-block').forEach(function (el) { el.classList.add('d-none'); });
            banner.classList.add('d-none');
            banner.classList.remove('d-flex');
            if (hint) hint.classList.remove('d-none');
            document.querySelectorAll('#kosik tr').forEach(function (r) { r.classList.remove('table-active'); });
        });
    }

    // ---- Ošetření reloadu / opuštění stránky: dotaz před ztrátou dat ----
    window.addEventListener('beforeunload', function (e) {
        if (maNejakaData()) {
            var zprava = 'Máte rozpracované míry. Opravdu chcete opustit nebo obnovit stránku? Neuložené úpravy se mohou ztratit.';
            e.preventDefault();
            e.returnValue = zprava; // text se použije v prohlížečích, které ho podporují
            return zprava;
        }
    });
})();
