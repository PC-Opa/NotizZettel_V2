// ============================================================
// NotizZettel V2
// NOTIZEN.JS
// ============================================================

let notizen = [];
let geloeschteNotizen = [];

// ============================================================
// SPEICHER
// ============================================================

const NOTIZEN_SPEICHER =
    "NotizZettel_V2";

const GELOESCHTE_NOTIZEN_SPEICHER =
    "NotizZettel_Geloescht";

// ============================================================
// START
// ============================================================

function notizenStarten() {

    notizenLaden();
    geloeschteNotizenLaden();

    notizenAnzeigen();
}

// ============================================================
// NOTIZ HINZUFÜGEN
// ============================================================

function notizHinzufuegen() {

    const feld =
        document.getElementById(
            "NeueNotiz"
        );

    if (!feld) {
        return;
    }

    const text =
        feld.value.trim();

    if (text === "") {
        return;
    }

    const haendler =
        document.getElementById(
            "HaendlerAuswahl"
        );

    const eintrag = {
        text: text,

        haendler:
            haendler
                ? haendler.value.trim()
                : "",

        erledigt: false
    };

    notizen.push(
        eintrag
    );

    notizenSpeichern();
    notizenAnzeigen();

    feld.value = "";

    if (haendler) {
        haendler.value = "";
    }

    feld.focus();
}

// ============================================================
// NOTIZEN ANZEIGEN
// ============================================================

function notizenAnzeigen() {

    const liste =
        document.getElementById(
            "ListenBereich"
        );

    if (!liste) {
        return;
    }

    liste.innerHTML = "";

    if (notizen.length === 0) {

        liste.innerHTML =
            "<p>Noch keine Notizen vorhanden.</p>";

        return;
    }

    notizen.forEach(
        function (
            eintrag,
            index
        ) {

            const zeile =
                document.createElement(
                    "div"
                );

            zeile.className =
                "notiz-zeile";

            const haken =
                document.createElement(
                    "input"
                );

            haken.type =
                "checkbox";

            haken.checked =
                eintrag.erledigt === true;

            haken.addEventListener(
                "change",
                function () {

                    notizen[index].erledigt =
                        haken.checked;

                    notizenSpeichern();
                    notizenAnzeigen();
                }
            );

            const text =
                document.createElement(
                    "span"
                );

            text.textContent =
                eintrag.text;

            if (
                eintrag.haendler
            ) {

                text.textContent +=
                    " ··· " +
                    eintrag.haendler;
            }

            if (
                eintrag.erledigt
            ) {

                text.style.textDecoration =
                    "line-through";
            }

            const loeschen =
                document.createElement(
                    "button"
                );

            loeschen.type =
                "button";

            loeschen.textContent =
                "Löschen";

            loeschen.addEventListener(
                "click",
                function () {

                    notizLoeschen(
                        index
                    );
                }
            );

            zeile.appendChild(
                haken
            );

            zeile.appendChild(
                text
            );

            zeile.appendChild(
                loeschen
            );

            liste.appendChild(
                zeile
            );
        }
    );
}

// ============================================================
// EINZELNE NOTIZ LÖSCHEN
// ============================================================

function notizLoeschen(
    index
) {

    if (
        index < 0 ||
        index >= notizen.length
    ) {
        return;
    }

    const eintrag =
        notizen[index];

    const schluessel =
        notizSchluessel(
            eintrag
        );

    if (
        schluessel !== ""
    ) {

        geloeschteNotizen.push(
            schluessel
        );

        geloeschteNotizen =
            [
                ...new Set(
                    geloeschteNotizen
                )
            ];
    }

    notizen.splice(
        index,
        1
    );

    geloeschteNotizenSpeichern();
    notizenSpeichern();
    notizenAnzeigen();
}

// ============================================================
// ERLEDIGTE NOTIZEN LÖSCHEN
// ============================================================

function markierteLoeschen() {

    const behalten = [];

    notizen.forEach(
        function (eintrag) {

            if (
                eintrag.erledigt
            ) {

                const schluessel =
                    notizSchluessel(
                        eintrag
                    );

                if (
                    schluessel !== ""
                ) {

                    geloeschteNotizen.push(
                        schluessel
                    );
                }

            } else {

                behalten.push(
                    eintrag
                );
            }
        }
    );

    notizen =
        behalten;

    geloeschteNotizen =
        [
            ...new Set(
                geloeschteNotizen
            )
        ];

    geloeschteNotizenSpeichern();
    notizenSpeichern();
    notizenAnzeigen();
}

// ============================================================
// SCHLÜSSEL EINER NOTIZ
// ============================================================

function notizSchluessel(
    eintrag
) {

    if (
        !eintrag ||
        typeof eintrag.text !==
            "string"
    ) {
        return "";
    }

    return eintrag.text
        .trim()
        .toLowerCase();
}

// ============================================================
// NOTIZEN SPEICHERN
// ============================================================

function notizenSpeichern() {

    localStorage.setItem(
        NOTIZEN_SPEICHER,
        JSON.stringify(
            notizen
        )
    );
}

// ============================================================
// NOTIZEN LADEN
// ============================================================

function notizenLaden() {

    const daten =
        localStorage.getItem(
            NOTIZEN_SPEICHER
        );

    if (!daten) {

        notizen = [];

        return;
    }

    try {

        const geladen =
            JSON.parse(
                daten
            );

        notizen =
            Array.isArray(
                geladen
            )
                ? geladen
                : [];

    } catch (
        fehler
    ) {

        notizen = [];
    }
}

// ============================================================
// GELÖSCHTE NOTIZEN SPEICHERN
// ============================================================

function geloeschteNotizenSpeichern() {

    localStorage.setItem(
        GELOESCHTE_NOTIZEN_SPEICHER,
        JSON.stringify(
            geloeschteNotizen
        )
    );
}

// ============================================================
// GELÖSCHTE NOTIZEN LADEN
// ============================================================

function geloeschteNotizenLaden() {

    const daten =
        localStorage.getItem(
            GELOESCHTE_NOTIZEN_SPEICHER
        );

    if (!daten) {

        geloeschteNotizen = [];

        return;
    }

    try {

        const geladen =
            JSON.parse(
                daten
            );

        geloeschteNotizen =
            Array.isArray(
                geladen
            )
                ? geladen
                : [];

    } catch (
        fehler
    ) {

        geloeschteNotizen = [];
    }
}

// ============================================================
// ENTER-TASTE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const feld =
            document.getElementById(
                "NeueNotiz"
            );

        if (feld) {

            feld.addEventListener(
                "keydown",
                function (e) {

                    if (
                        e.key ===
                        "Enter"
                    ) {

                        e.preventDefault();

                        notizHinzufuegen();
                    }
                }
            );
        }

        const btnHinzufuegen =
            document.getElementById(
                "BtnHinzufuegen"
            );

        if (
            btnHinzufuegen
        ) {

            btnHinzufuegen.onclick =
                notizHinzufuegen;
        }

        const btnLoeschen =
            document.getElementById(
                "BtnMarkierteLoeschen"
            );

        if (
            btnLoeschen
        ) {

            btnLoeschen.onclick =
                markierteLoeschen;
        }

        notizenStarten();
    }
);
