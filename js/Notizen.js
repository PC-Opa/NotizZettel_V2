// ============================================================
// NotizZettel V2
// NOTIZEN
// ============================================================

const SPEICHER_NOTIZEN =
    "NotizZettel_V2";

const SPEICHER_GELOESCHT =
    "NotizZettel_Geloescht";

let notizen = [];

let geloeschteNotizen = [];


// ============================================================
// NOTIZEN LADEN
// ============================================================

function laden() {

    const gespeichert =
        localStorage.getItem(
            SPEICHER_NOTIZEN
        );

    if (!gespeichert) {

        notizen = [];

        return;
    }

    try {

        const daten =
            JSON.parse(
                gespeichert
            );

        if (
            Array.isArray(daten)
        ) {

            notizen = daten;

        } else {

            notizen = [];
        }

    } catch (fehler) {

        notizen = [];
    }
}


// ============================================================
// GELÖSCHTE NOTIZEN LADEN
// ============================================================

function geloeschteNotizenLaden() {

    const gespeichert =
        localStorage.getItem(
            SPEICHER_GELOESCHT
        );

    if (!gespeichert) {

        geloeschteNotizen = [];

        return;
    }

    try {

        const daten =
            JSON.parse(
                gespeichert
            );

        if (
            Array.isArray(daten)
        ) {

            geloeschteNotizen =
                daten;

        } else {

            geloeschteNotizen = [];
        }

    } catch (fehler) {

        geloeschteNotizen = [];
    }
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
// SCHLÜSSEL FÜR EINE GELÖSCHTE NOTIZ
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

    if (
        text === ""
    ) {

        feld.focus();

        return;
    }


    const haendlerFeld =
        document.getElementById(
            "HaendlerAuswahl"
        );

    const haendler =
        haendlerFeld
            ? haendlerFeld.value
            : "";


    const schluessel =
        text.toLowerCase();


    // Eine zuvor gelöschte Notiz
    // darf wieder neu angelegt werden.

    geloeschteNotizen =
        geloeschteNotizen.filter(
            function (eintrag) {

                return (
                    eintrag !==
                    schluessel
                );
            }
        );


    notizen.push({

        text:
            text,

        haendler:
            haendler,

        erledigt:
            false
    });


    // Neues Wort an das Wörterbuch übergeben,
    // wenn diese Funktion vorhanden ist.

    if (
        typeof wortMerken ===
        "function"
    ) {

        wortMerken(
            text
        );
    }


    speichern();

    geloeschteNotizenSpeichern();

    anzeigen();


    feld.value =
        "";


    if (
        haendlerFeld
    ) {

        haendlerFeld.value =
            "";
    }


    vorschlaegeLoeschen();

    feld.focus();
}


// ============================================================
// VORSCHLÄGE ANZEIGEN
// ============================================================

function vorschlaegeAnzeigen() {

    const feld =
        document.getElementById(
            "NeueNotiz"
        );

    const bereich =
        document.getElementById(
            "VorschlagBereich"
        );

    if (
        !feld ||
        !bereich
    ) {

        return;
    }


    const eingabe =
        feld.value
            .trim()
            .toLowerCase();


    bereich.innerHTML =
        "";


    if (
        eingabe === ""
    ) {

        return;
    }


    let treffer = [];


    // Vorhandenes Wörterbuch verwenden.

    if (
        typeof sucheWoerter ===
        "function"
    ) {

        const ergebnis =
            sucheWoerter(
                eingabe
            );

        if (
            Array.isArray(ergebnis)
        ) {

            treffer =
                ergebnis;
        }
    }


    if (
        treffer.length === 0
    ) {

        vorschlaegeLoeschen();

        return;
    }


    treffer.forEach(
        function (wort) {

            if (
                typeof wort !==
                "string"
            ) {

                return;
            }


            const vorschlag =
                document.createElement(
                    "div"
                );


            vorschlag.textContent =
                wort;


            vorschlag.className =
                "notiz-vorschlag";


            vorschlag.addEventListener(
                "click",
                function () {

                    feld.value =
                        wort;

                    vorschlaegeLoeschen();

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
// VORSCHLÄGE LÖSCHEN
// ============================================================

function vorschlaegeLoeschen() {

    const bereich =
        document.getElementById(
            "VorschlagBereich"
        );

    if (
        bereich
    ) {

        bereich.innerHTML =
            "";
    }
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


    liste.innerHTML =
        "";


    if (
        notizen.length === 0
    ) {

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
                eintrag.erledigt ===
                true;


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


            text.className =
                "notiz-text";


            text.textContent =
                eintrag.text;


            if (
                eintrag.haendler
            ) {

                const trennzeichen =
                    document.createElement(
                        "span"
                    );

                trennzeichen.textContent =
                    " ··· ";


                const kuerzel =
                    document.createElement(
                        "span"
                    );


                kuerzel.textContent =
                    eintrag.haendler;


                kuerzel.className =
                    "notiz-haendler";


                text.appendChild(
                    trennzeichen
                );

                text.appendChild(
                    kuerzel
                );
            }


            if (
                eintrag.erledigt
            ) {

                text.classList.add(
                    "erledigt"
                );
            }


            const loeschen =
                document.createElement(
                    "button"
                );


            loeschen.type =
                "button";


            loeschen.textContent =
                "Löschen";


            loeschen.className =
                "notiz-loeschen";


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


    speichern();

    geloeschteNotizenSpeichern();

    anzeigen();
}


// ============================================================
// MARKIERTE NOTIZEN LÖSCHEN
// ============================================================

function markierteLoeschen() {

    const behalten =
        [];


    notizen.forEach(
        function (eintrag) {

            if (
                eintrag.erledigt ===
                true
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


    speichern();

    geloeschteNotizenSpeichern();

    anzeigen();
}


// ============================================================
// START DER NOTIZFUNKTION
// ============================================================

function notizenStarten() {

    laden();

    geloeschteNotizenLaden();

    anzeigen();
}


// ============================================================
// TASTATUR UND SCHALTFLÄCHEN
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const feld =
            document.getElementById(
                "NeueNotiz"
            );


        const btnHinzufuegen =
            document.getElementById(
                "BtnHinzufuegen"
            );


        const btnMarkierteLoeschen =
            document.getElementById(
                "BtnMarkierteLoeschen"
            );


        if (
            btnHinzufuegen
        ) {

            btnHinzufuegen.addEventListener(
                "click",
                notizHinzufuegen
            );
        }


        if (
            btnMarkierteLoeschen
        ) {

            btnMarkierteLoeschen.addEventListener(
                "click",
                markierteLoeschen
            );
        }


        if (
            feld
        ) {

            feld.addEventListener(
                "input",
                vorschlaegeAnzeigen
            );


            feld.addEventListener(
                "keydown",
                function (ereignis) {

                    if (
                        ereignis.key ===
                        "Enter"
                    ) {

                        ereignis.preventDefault();

                        notizHinzufuegen();
                    }


                    if (
                        ereignis.key ===
                        "Escape"
                    ) {

                        vorschlaegeLoeschen();
                    }
                }
            );
        }


        notizenStarten();
    }
);
