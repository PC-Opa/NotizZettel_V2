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

    woerterLaden();

    const feld =
        document.getElementById("NeueNotiz");


    document
        .getElementById("BtnHinzufuegen")
        .addEventListener(
            "click",
            notizHinzufuegen
        );


    document
        .getElementById("BtnMarkierteLoeschen")
        .addEventListener(
            "click",
            markierteLoeschen
        );


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
        function () {

            zeigeVorschlaege();

        }
    );


    anzeigen();

    feld.focus();

}


// ============================================================
// NOTIZ HINZUFÜGEN
// ============================================================

function notizHinzufuegen() {

    const feld =
        document.getElementById("NeueNotiz");

    const bereich =
        document.getElementById("VorschlagBereich");


    const text =
        feld.value.trim();


    if (text === "") {

        feld.focus();

        return;

    }


    const schluessel =
        text.toLowerCase();


    // Alte Löschmarkierung entfernen,
    // wenn die Notiz neu angelegt wird.

    geloeschteNotizen =
        geloeschteNotizen.filter(
            function (eintrag) {

                return eintrag !== schluessel;

            }
        );


    geloeschteNotizenSpeichern();


    notizen.push({

        text: text,

        erledigt: false

    });


    wortMerken(text);

    speichern();

    anzeigen();


    bereich.innerHTML = "";

    feld.value = "";

    feld.focus();

}


// ============================================================
// VORSCHLÄGE
// ============================================================

function zeigeVorschlaege() {

    const feld =
        document.getElementById("NeueNotiz");

    const bereich =
        document.getElementById("VorschlagBereich");


    bereich.innerHTML = "";


    const text =
        feld.value.trim();


    if (text === "") {

        return;

    }


    const treffer =
        sucheWoerter(text);


    if (treffer.length === 0) {

        return;

    }


    treffer.forEach(
        function (wort) {

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
                "mouseenter",
                function () {

                    vorschlag.style.background =
                        "#dbeafe";

                }
            );


            vorschlag.addEventListener(
                "mouseleave",
                function () {

                    vorschlag.style.background =
                        "#f3f3f3";

                }
            );


            vorschlag.addEventListener(
                "click",
                function () {

                    feld.value =
                        wort;

                    bereich.innerHTML =
                        "";

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


    liste.innerHTML = "";


    if (notizen.length === 0) {

        liste.innerHTML =
            "<p>Noch keine Notizen vorhanden.</p>";

        return;

    }


    notizen.forEach(
        function (eintrag, index) {

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
                eintrag.erledigt;


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


            text.textContent =
                eintrag.text;


            text.style.flex =
                "1";

            text.style.fontSize =
                "22px";


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

function notizLoeschen(index) {

    if (
        index < 0 ||
        index >= notizen.length
    ) {

        return;

    }


    const schluessel =
        notizSchluesselFuerLoeschung(
            notizen[index]
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
        function (eintrag) {

            if (
                eintrag.erledigt
            ) {

                const schluessel =
                    notizSchluesselFuerLoeschung(
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

                neueNotizen.push(
                    eintrag
                );

            }

        }
    );


    notizen =
        neueNotizen;


    geloeschteNotizen =
        [
            ...new Set(
                geloeschteNotizen
            )
        ];


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
        typeof eintrag.text !== "string"
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


    if (daten) {

        try {

            const geladen =
                JSON.parse(daten);


            if (
                Array.isArray(
                    geladen
                )
            ) {

                notizen =
                    geladen;

            } else {

                notizen = [];

            }

        } catch (fehler) {

            notizen = [];

        }

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
            JSON.parse(daten);


        if (
            Array.isArray(
                geladen
            )
        ) {

            geloeschteNotizen =
                geladen;

        } else {

            geloeschteNotizen = [];

        }

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
