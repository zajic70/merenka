/* ===== Měřenka SSI – interaktivita ===== */
(function () {
    'use strict';

    // Definice rozměrů (číslo, popisek). Číslo zároveň odpovídá značce v SVG (muz-1, zena-1, ...).
    const MIRY = {
        muz: [
            { n: 1,  label: 'výška postavy' },
            { n: 2,  label: 'obvod krku' },
            { n: 3,  label: 'obvod hrudníku' },
            { n: 4,  label: 'obvod pasu' },
            { n: 5,  label: 'obvod sedu' },
            { n: 6,  label: 'délka ramene a ruky' },
            { n: 7,  label: 'obvod paže *' },
            { n: 8,  label: 'obvod stehna *' },
            { n: 9,  label: 'šíře zad' },
            { n: 10, label: 'kroková délka' },
        ],
        zena: [
            { n: 1, label: 'výška postavy' },
            { n: 2, label: 'obvod hrudníku' },
            { n: 3, label: 'obvod pasu' },
            { n: 4, label: 'obvod sedu' },
            { n: 5, label: 'délka ramene a ruky' },
            { n: 6, label: 'obvod paže *' },
            { n: 7, label: 'obvod stehna *' },
            { n: 8, label: 'kroková délka' },
        ],
    };

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
                        '<input type="number" step="0.1" min="0" class="form-control" ' +
                            'name="miry_' + pohlavi + '[' + m.n + ']" ' +
                            'data-mira="' + key + '" aria-label="' + m.label + '">' +
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

    // ---- Propojení pole <-> SVG značka ----
    function markers(key) {
        // může být ve více SVG (např. muz-1 zepředu i zboku)
        return document.querySelectorAll('.mira-marker[data-mira="' + key + '"]');
    }

    function setActive(key, on) {
        markers(key).forEach(function (g) { g.classList.toggle('mira-active', on); });
        const row = document.querySelector('tr[data-row="' + key + '"]');
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

    // ---- Odeslání (zatím jen ukázka – data vypíšeme do okna) ----
    // Sestaví HTML tabulku vyplněných měr pro jedno pohlaví.
    function tabulkaMer(pohlavi, nadpis) {
        const radky = MIRY[pohlavi].map(function (m) {
            const inp = document.querySelector('input[name="miry_' + pohlavi + '[' + m.n + ']"]');
            const val = inp && inp.value ? inp.value + ' cm' : '<span class="text-muted">—</span>';
            return '<tr><td class="text-muted">' + m.n + '.</td><td>' + m.label + '</td>' +
                   '<td class="text-end">' + val + '</td></tr>';
        }).join('');
        return '<h6>' + nadpis + '</h6>' +
               '<table class="table table-sm"><tbody>' + radky + '</tbody></table>';
    }

    const form = document.getElementById('miry');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const html = tabulkaMer('muz', 'Muž') + tabulkaMer('zena', 'Žena');
            const body = document.getElementById('dataModalBody');
            if (body) body.innerHTML = html;

            const modalEl = document.getElementById('dataModal');
            if (modalEl && window.bootstrap) {
                bootstrap.Modal.getOrCreateInstance(modalEl).show();
            } else {
                // záloha, kdyby Bootstrap nebyl k dispozici
                alert(form.querySelector ? body.innerText : 'Data připravena.');
            }
        });
    }
})();
