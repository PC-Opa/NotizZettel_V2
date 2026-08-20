// ============================================================
// NotizZettel V2 – NOTIZEN
// ============================================================

const SPEICHER_NOTIZEN = "NotizZettel_V2";
const SPEICHER_GELOESCHT = "NotizZettel_Geloescht";

let notizen = [];
let geloeschteNotizen = [];

// ============================================================
// START
// ============================================================

function starten() {
    laden();
    geloeschteNotizenLaden();

    if (typeof woerterLaden === "function") {
        woerterLaden();
    }

    const feld = document.getElementById("NeueNotiz");
    const haendler = document.getElementById("HaendlerAuswahl");
    const btnHinzufuegen = document.getElementById("BtnHinzufuegen");
    const btnMarkierteLoeschen =
        document.getElementById("BtnMarkierteLoeschen");

    if (btnHinzufuegen) {
        btnHinzufuegen.addEventListener(
            "click",
            notizHinzufuegen
        );
    }

    if (btnMarkierteLoeschen) {
        btnMarkierteLoeschen.addEventListener(
            "click",
            markierteLoeschen
        );
    }

    if (feld) {
        feld.addEventListener(
            "keydown",
            function (e) {
                if (e.key === "Enter") {
                    notizHinzufuegen();
                }
            }
        );

        feld.addEventListener(
            "input",
            zeigeVorschlaege
        );
    }

    anzeigen();

    if (feld) {
        feld.focus();
    }
}

// ============================================================
// NOTIZ HINZUFÜGEN
// ============================================================

function notizHinzufuegen() {
    const feld =
        document.getElementById("NeueNotiz");

    const bereich =
        document.getElementById("VorschlagBereich");

    const haendler =
        document.getElementById("HaendlerAuswahl");

    if (!feld) {
        return;
    }

    const text =
        feld.value.trim();

    if (text === "") {
        feld.focus();
        return;
    }

    const kuerzel =
        haendler
            ? haendler.value
            : "";

    const schluessel =
        text.toLowerCase();

    geloeschteNotizen =
        geloeschteNotizen.filter(
            eintrag =>
                eintrag !== schluessel
        );

    notizen.push({
        text: text,
        haendler: kuerzel,
        erledigt: false
    });

    if (
        typeof wortMerken ===
        "function"
    ) {
        wortMerken(text);
    }

    geloeschteNotizenSpeichern();
    speichern();
    anzeigen();

    if (bereich) {
        bereich.innerHTML = "";
    }

    feld.value = "";

    if (haendler) {
        haendler.value = "";
    }

    feld.focus();
}

// ============================================================
// AUTOVERVOLLSTÄNDIGUNG
// ============================================================

function zeigeVorschlaege() {
    const feld =
        document.getElementById("NeueNotiz");

    const bereich =
        document.getElementById("VorschlagBereich");

    if (!feld || !bereich) {
        return;
    }

    bereich.innerHTML = "";

    const text =
        feld.value.trim();

    if (
        text === "" ||
        typeof sucheWoerter !== "function"
    ) {
        return;
    }

    const treffer =
        sucheWoerter(text);

    if (
        !Array.isArray(treffer) ||
        treffer.length === 0
    ) {
        return;
    }

    treffer.forEach(
        wort => {
            const vorschlag =
                document.createElement("div");

            vorschlag.textContent =
                wort;

            vorschlag.style.padding =
                "8px";

            vorschlag.style.margin =
                "2px 0";

            vorschlag.style.background =
                "#f3f3f3";

            vorschlag.style.border =
                "1px solid #dddddd";

            vorschlag.style.borderRadius =
                "6px";

            vorschlag.style.color =
                "#666666";

            vorschlag.style.cursor =
                "pointer";

            vorschlag.addEventListener(
                "click",
                function () {
                    feld.value = wort;
                    bereich.innerHTML = "";
                    feld.focus();
                }
            );

            bereich.appendChild(
                vorschlag
            );
        }
    );
}

// ============================================================
// NOTIZEN ANZEIGEN
// ============================================================

function anzeigen() {
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
        (eintrag, index) => {
            const zeile =
                document.createElement("div");

            zeile.style.display =
                "flex";

            zeile.style.alignItems =
                "center";

            zeile.style.gap =
                "12px";

            zeile.style.padding =
                "10px";

            zeile.style.borderBottom =
                "1px solid #dddddd";

            const haken =
                document.createElement(
                    "input"
                );

            haken.type =
                "checkbox";

            haken.checked =
                !!eintrag.erledigt;

            haken.addEventListener(
                "change",
                function () {
                    notizen[index].erledigt =
                        haken.checked;

                    speichern();
                    anzeigen();
                }
            );

            const text =
                document.createElement(
                    "span"
                );

            text.style.flex =
                "1";

            text.style.fontSize =
                "22px";

            text.textContent =
                eintrag.text;

            if (eintrag.haendler) {
                const trennzeichen =
                    document.createElement(
                        "span"
                    );

                trennzeichen.textContent =
                    " ··· ";

                trennzeichen.style.color =
                    "#999999";

                const kuerzel =
                    document.createElement(
                        "span"
                    );

                kuerzel.textContent =
                    eintrag.haendler;

                kuerzel.style.color =
                    "#555555";

                kuerzel.style.fontWeight =
                    "bold";

                text.appendChild(
                    trennzeichen
                );

                text.appendChild(
                    kuerzel
                );
            }

            if (eintrag.erledigt) {
                text.style.textDecoration =
                    "line-through";

                text.style.color =
                    "#888888";
            }

            const loeschen =
                document.createElement(
                    "button"
                );

            loeschen.textContent =
                "Löschen";

            loeschen.style.background =
                "#dc2626";

            loeschen.style.color =
                "#ffffff";

            loeschen.style.border =
                "none";

            loeschen.style.padding =
                "8px 14px";

            loeschen.style.borderRadius =
                "6px";

            loeschen.style.cursor =
                "pointer";

            loeschen.addEventListener(
                "click",
                function () {
                    notizLoeschen(index);
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

function notizLoeschen(index) {
    if (
        index < 0 ||
        index >= notizen.length
    ) {
        return;
    }

    const eintrag =
        notizen[index];

    const schluessel =
        notizSchluesselFuerLoeschung(
            eintrag
        );

    if (schluessel !== "") {
        geloeschteNotizen.push(
            schluessel
        );

        geloeschteNotizen =
            [...new Set(
                geloeschteNotizen
            )];
    }

    notizen.splice(
        index,
        1
    );

    geloeschteNotizenSpeichern();
    speichern();
    anzeigen();
}

// ============================================================
// MARKIERTE NOTIZEN LÖSCHEN
// ============================================================

function markierteLoeschen() {
    const neueNotizen = [];

    notizen.forEach(
        eintrag => {
            if (eintrag.erledigt) {
                const schluessel =
                    notizSchluesselFuerLoeschung(
                        eintrag
                    );

                if (schluessel !== "") {
                    geloeschteNotizen.push(
                        schluessel
                    );
                }
            } else {
                neueNotizen.push(
                    eintrag
                );
            }
        }
    );

    notizen =
        neueNotizen;

    geloeschteNotizen =
        [...new Set(
            geloeschteNotizen
        )];

    geloeschteNotizenSpeichern();
    speichern();
    anzeigen();
}

// ============================================================
// SCHLÜSSEL FÜR GELÖSCHTE NOTIZ
// ============================================================

function notizSchluesselFuerLoeschung(
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

function speichern() {
    localStorage.setItem(
        SPEICHER_NOTIZEN,
        JSON.stringify(
            notizen
        )
    );
}

// ============================================================
// NOTIZEN LADEN
// ============================================================

function laden() {
    const daten =
        localStorage.getItem(
            SPEICHER_NOTIZEN
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
            Array.isArray(geladen)
                ? geladen
                : [];

    } catch (fehler) {
        notizen = [];
    }
}

// ============================================================
// GELÖSCHTE NOTIZEN LADEN
// ============================================================

function geloeschteNotizenLaden() {
    const daten =
        localStorage.getItem(
            SPEICHER_GELOESCHT
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
            Array.isArray(geladen)
                ? geladen
                : [];

    } catch (fehler) {
        geloeschteNotizen = [];
    }
}

// ============================================================
// GELÖSCHTE NOTIZEN SPEICHERN
// ============================================================

function geloeschteNotizenSpeichern() {
    localStorage.setItem(
        SPEICHER_GELOESCHT,
        JSON.stringify(
            geloeschteNotizen
        )
    );
}

// ============================================================
// START AUSFÜHREN
// ============================================================

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        starten
    );
} else {
    starten();
}
