const SPEICHER_GITHUB = "NotizZettel_GitHub";
const SPEICHER_SYNC_STAND = "NotizZettel_SyncStand";
const SPEICHER_GELOESCHT = "NotizZettel_Geloescht";

let github = {
    benutzer: "",
    repository: "",
    token: ""
};


// ============================================================
// GITHUB-ZUGANGSDATEN
// ============================================================

function githubLaden() {

    const daten =
        localStorage.getItem(
            SPEICHER_GITHUB
        );

    if (daten) {

        try {

            const geladen =
                JSON.parse(daten);

            github = {

                benutzer:
                    typeof geladen.benutzer === "string"
                        ? geladen.benutzer
                        : "",

                repository:
                    typeof geladen.repository === "string"
                        ? geladen.repository
                        : "",

                token:
                    typeof geladen.token === "string"
                        ? geladen.token
                        : ""

            };

        } catch (fehler) {

            github = {
                benutzer: "",
                repository: "",
                token: ""
            };

        }

    }

}


// ============================================================
// GITHUB-ZUGANGSDATEN SPEICHERN
// ============================================================

function githubSpeichern(
    benutzer,
    repository,
    token
) {

    github.benutzer =
        typeof benutzer === "string"
            ? benutzer.trim()
            : "";

    github.repository =
        typeof repository === "string"
            ? repository.trim()
            : "";

    github.token =
        typeof token === "string"
            ? token.trim()
            : "";


    localStorage.setItem(
        SPEICHER_GITHUB,
        JSON.stringify(github)
    );

}


// ============================================================
// GITHUB-ZUGANGSDATEN PRÜFEN
// ============================================================

function githubVorhanden() {

    return (

        typeof github.benutzer === "string" &&
        github.benutzer.trim() !== "" &&

        typeof github.repository === "string" &&
        github.repository.trim() !== "" &&

        typeof github.token === "string" &&
        github.token.trim() !== ""

    );

}


// ============================================================
// GITHUB-BEREICH
// ============================================================

function githubBereichUmschalten() {

    const bereich =
        document.getElementById(
            "GitHubBereich"
        );

    if (!bereich) {

        return;

    }


    if (
        bereich.style.display === "none" ||
        bereich.style.display === ""
    ) {

        bereich.style.display =
            "block";


        const benutzer =
            document.getElementById(
                "GitBenutzer"
            );

        const repository =
            document.getElementById(
                "GitRepository"
            );

        const token =
            document.getElementById(
                "GitToken"
            );


        if (benutzer) {

            benutzer.value =
                github.benutzer;

        }


        if (repository) {

            repository.value =
                github.repository;

        }


        if (token) {

            token.value =
                github.token;

        }

    } else {

        bereich.style.display =
            "none";

    }

}


// ============================================================
// TEXT FÜR GITHUB KODIEREN
// ============================================================

function textFuerGitHubKodieren(text) {

    const daten =
        new TextEncoder().encode(
            text
        );

    let binaer = "";


    daten.forEach(
        function (zeichen) {

            binaer +=
                String.fromCharCode(
                    zeichen
                );

        }
    );


    return btoa(binaer);

}


// ============================================================
// TEXT VON GITHUB DEKODIEREN
// ============================================================

function textAusGitHubDekodieren(text) {

    const binaer =
        atob(
            text.replace(
                /\s/g,
                ""
            )
        );


    const daten =
        new Uint8Array(
            binaer.length
        );


    for (
        let i = 0;
        i < binaer.length;
        i++
    ) {

        daten[i] =
            binaer.charCodeAt(i);

    }


    return new TextDecoder(
        "utf-8"
    ).decode(daten);

}


// ============================================================
// DATEN.JSON VON GITHUB LESEN
// ============================================================

async function githubDateiLesen() {

    if (!githubVorhanden()) {

        alert(
            "Bitte zuerst die GitHub-Zugangsdaten speichern."
        );

        return null;

    }


    const url =
        "https://api.github.com/repos/" +
        github.benutzer +
        "/" +
        github.repository +
        "/contents/Daten.json";


    try {

        const antwort =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {

                        "Authorization":
                            "Bearer " +
                            github.token,

                        "Accept":
                            "application/vnd.github.v3+json",

                        "X-GitHub-Api-Version":
                            "2022-11-28"

                    }

                }
            );


        if (!antwort.ok) {

            const fehler =
                await antwort.text();


            alert(
                "GitHub konnte Daten.json nicht lesen.\n\n" +
                "HTTP: " +
                antwort.status +
                "\n\n" +
                fehler
            );


            return null;

        }


        const daten =
            await antwort.json();


        const text =
            textAusGitHubDekodieren(
                daten.content
            );


        const inhalt =
            JSON.parse(text);


        return {

            sha:
                daten.sha,

            daten:
                inhalt

        };


    } catch (fehler) {

        alert(
            "Fehler beim Lesen von GitHub:\n\n" +
            fehler.message
        );


        return null;

    }

}


// ============================================================
// DATEN.JSON NACH GITHUB SCHREIBEN
// ============================================================

async function githubDateiSpeichern(
    inhalt,
    sha
) {

    if (!githubVorhanden()) {

        alert(
            "Bitte zuerst die GitHub-Zugangsdaten speichern."
        );

        return false;

    }


    const url =
        "https://api.github.com/repos/" +
        github.benutzer +
        "/" +
        github.repository +
        "/contents/Daten.json";


    const text =
        JSON.stringify(
            inhalt,
            null,
            2
        );


    try {

        const bodyDaten = {

            message:
                "NotizZettel Synchronisation",

            content:
                textFuerGitHubKodieren(
                    text
                )

        };


        if (sha) {

            bodyDaten.sha =
                sha;

        }


        const antwort =
            await fetch(
                url,
                {
                    method: "PUT",

                    headers: {

                        "Authorization":
                            "Bearer " +
                            github.token,

                        "Accept":
                            "application/vnd.github.v3+json",

                        "X-GitHub-Api-Version":
                            "2022-11-28",

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            bodyDaten
                        )

                }
            );


        if (!antwort.ok) {

            const fehler =
                await antwort.text();


            alert(
                "GitHub konnte Daten.json nicht speichern.\n\n" +
                "HTTP: " +
                antwort.status +
                "\n\n" +
                fehler
            );


            return false;

        }


        return true;


    } catch (fehler) {

        alert(
            "Fehler beim Speichern auf GitHub:\n\n" +
            fehler.message
        );


        return false;

    }

}


// ============================================================
// NOTIZ-SCHLÜSSEL
// ============================================================

function notizSchluessel(eintrag) {

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
// NOTIZEN VEREINHEITLICHEN
// ============================================================

function notizenVereinheitlichen(liste) {

    const ergebnis = [];
    const vorhanden = new Set();


    if (!Array.isArray(liste)) {

        return ergebnis;

    }


    liste.forEach(
        function (eintrag) {

            if (
                !eintrag ||
                typeof eintrag.text !== "string"
            ) {

                return;

            }


            const text =
                eintrag.text.trim();


            if (text === "") {

                return;

            }


            const schluessel =
                text.toLowerCase();


            if (
                vorhanden.has(
                    schluessel
                )
            ) {

                return;

            }


            vorhanden.add(
                schluessel
            );


            ergebnis.push({

                text:
                    text,

                haendler:
                    typeof eintrag.haendler === "string"
                        ? eintrag.haendler
                        : "",

                erledigt:
                    eintrag.erledigt === true

            });

        }
    );


    return ergebnis;

}


// ============================================================
// LÖSCHLISTE VEREINHEITLICHEN
// ============================================================

function loeschungenVereinheitlichen(liste) {

    const ergebnis = [];
    const vorhanden = new Set();


    if (!Array.isArray(liste)) {

        return ergebnis;

    }


    liste.forEach(
        function (eintrag) {

            if (
                typeof eintrag !== "string"
            ) {

                return;

            }


            const schluessel =
                eintrag.trim().toLowerCase();


            if (schluessel === "") {

                return;

            }


            if (
                vorhanden.has(
                    schluessel
                )
            ) {

                return;

            }


            vorhanden.add(
                schluessel
            );


            ergebnis.push(
                schluessel
            );

        }
    );


    return ergebnis;

}


// ============================================================
// LOKALE LÖSCHLISTE LADEN
// ============================================================

function lokaleLoeschungenLaden() {

    const daten =
        localStorage.getItem(
            SPEICHER_GELOESCHT
        );


    if (!daten) {

        return [];

    }


    try {

        return loeschungenVereinheitlichen(
            JSON.parse(daten)
        );

    } catch (fehler) {

        return [];

    }

}


// ============================================================
// LÖSCHLISTE LOKAL SPEICHERN
// ============================================================

function lokaleLoeschungenSpeichern(
    liste
) {

    localStorage.setItem(

        SPEICHER_GELOESCHT,

        JSON.stringify(
            loeschungenVereinheitlichen(
                liste
            )
        )

    );

}


// ============================================================
// LETZTEN SYNCHRONISATIONSSTAND LADEN
// ============================================================

function syncStandLaden() {

    const daten =
        localStorage.getItem(
            SPEICHER_SYNC_STAND
        );


    if (!daten) {

        return null;

    }


    try {

        const stand =
            JSON.parse(daten);


        if (
            !stand ||
            typeof stand !== "object"
        ) {

            return null;

        }


        return stand;


    } catch (fehler) {

        return null;

    }

}


// ============================================================
// LETZTEN SYNCHRONISATIONSSTAND SPEICHERN
// ============================================================

function syncStandSpeichern(
    daten
) {

    localStorage.setItem(

        SPEICHER_SYNC_STAND,

        JSON.stringify({

            notizen:
                notizenVereinheitlichen(
                    daten.notizen
                ),

            woerter:
                Array.isArray(
                    daten.woerter
                )
                    ? daten.woerter
                    : [],

            geloescht:
                loeschungenVereinheitlichen(
                    daten.geloescht
                )

        })

    );

}


// ============================================================
// NOTIZEN VERGLEICHEN
// ============================================================

function notizGleich(
    a,
    b
) {

    if (!a || !b) {

        return false;

    }


    return (

        notizSchluessel(a) ===
        notizSchluessel(b)

        &&

        a.erledigt ===
        b.erledigt

        &&

        (a.haendler || "") ===
        (b.haendler || "")

    );

}


// ============================================================
// NOTIZEN SYNCHRONISIEREN
// ============================================================

function notizenSynchronisieren(

    lokaleNotizen,
    githubNotizen,
    letzterStand,
    lokaleGeloescht,
    githubGeloescht

) {

    const lokal =
        notizenVereinheitlichen(
            lokaleNotizen
        );


    const vonGitHub =
        notizenVereinheitlichen(
            githubNotizen
        );


    const vorher =
        letzterStand
            ? notizenVereinheitlichen(
                letzterStand.notizen
            )
            : [];


    const geloescht =
        new Set();


    lokaleGeloescht =
        loeschungenVereinheitlichen(
            lokaleGeloescht
        );


    githubGeloescht =
        loeschungenVereinheitlichen(
            githubGeloescht
        );


    lokaleGeloescht.forEach(
        function (schluessel) {

            geloescht.add(
                schluessel
            );

        }
    );


    githubGeloescht.forEach(
        function (schluessel) {

            geloescht.add(
                schluessel
            );

        }
    );


    const lokalMap =
        new Map();

    const githubMap =
        new Map();

    const vorherMap =
        new Map();


    lokal.forEach(
        function (eintrag) {

            lokalMap.set(

                notizSchluessel(
                    eintrag
                ),

                eintrag

            );

        }
    );


    vonGitHub.forEach(
        function (eintrag) {

            githubMap.set(

                notizSchluessel(
                    eintrag
                ),

                eintrag

            );

        }
    );


    vorher.forEach(
        function (eintrag) {

            vorherMap.set(

                notizSchluessel(
                    eintrag
                ),

                eintrag

            );

        }
    );


    // --------------------------------------------------------
    // ALLE SCHLÜSSEL
    // --------------------------------------------------------

    const alleSchluessel =
        new Set([

            ...lokalMap.keys(),

            ...githubMap.keys(),

            ...vorherMap.keys(),

            ...geloescht

        ]);


    const ergebnis = [];


    alleSchluessel.forEach(
        function (schluessel) {

            const lokalEintrag =
                lokalMap.get(
                    schluessel
                );


            const githubEintrag =
                githubMap.get(
                    schluessel
                );


            const vorherEintrag =
                vorherMap.get(
                    schluessel
                );


            // ------------------------------------------------
            // GELÖSCHT
            // ------------------------------------------------

            if (
                geloescht.has(
                    schluessel
                )
            ) {

                // Eine neu angelegte Notiz
                // hebt die alte Löschung auf.

                if (
                    lokalEintrag &&
                    (
                        !vorherEintrag ||
                        !notizGleich(
                            lokalEintrag,
                            vorherEintrag
                        )
                    )
                ) {

                    geloescht.delete(
                        schluessel
                    );


                    ergebnis.push(
                        lokalEintrag
                    );


                    return;

                }


                if (
                    githubEintrag &&
                    !vorherEintrag
                ) {

                    geloescht.delete(
                        schluessel
                    );


                    ergebnis.push(
                        githubEintrag
                    );


                    return;

                }


                return;

            }


            // ------------------------------------------------
            // LOKAL UND GITHUB
            // ------------------------------------------------

            if (
                lokalEintrag &&
                githubEintrag
            ) {

                if (
                    vorherEintrag
                ) {

                    const lokalGeaendert =
                        !notizGleich(
                            lokalEintrag,
                            vorherEintrag
                        );


                    const githubGeaendert =
                        !notizGleich(
                            githubEintrag,
                            vorherEintrag
                        );


                    if (
                        !lokalGeaendert &&
                        githubGeaendert
                    ) {

                        ergebnis.push(
                            githubEintrag
                        );


                        return;

                    }

                }


                ergebnis.push(
                    lokalEintrag
                );


                return;

            }


            // ------------------------------------------------
            // NUR LOKAL
            // ------------------------------------------------

            if (
                lokalEintrag
            ) {

                ergebnis.push(
                    lokalEintrag
                );


                return;

            }


            // ------------------------------------------------
            // NUR GITHUB
            // ------------------------------------------------

            if (
                githubEintrag
            ) {

                if (
                    vorherEintrag
                ) {

                    geloescht.add(
                        schluessel
                    );


                    return;

                }


                ergebnis.push(
                    githubEintrag
                );

            }

        }
    );


    return {

        notizen:
            ergebnis,

        geloescht:
            Array.from(
                geloescht
            )

    };

}


// ============================================================
// WÖRTERBUCH ZUSAMMENFÜHREN
// ============================================================

function woerterZusammenfuehren(

    lokaleWoerter,
    githubWoerter

) {

    const ergebnis = [];
    const vorhanden = new Set();

    const alleWoerter = [];


    if (
        Array.isArray(
            lokaleWoerter
        )
    ) {

        alleWoerter.push(
            ...lokaleWoerter
        );

    }


    if (
        Array.isArray(
            githubWoerter
        )
    ) {

        alleWoerter.push(
            ...githubWoerter
        );

    }


    alleWoerter.forEach(
        function (wort) {

            if (
                typeof wort !== "string"
            ) {

                return;

            }


            wort =
                wort.trim();


            if (wort === "") {

                return;

            }


            const schluessel =
                wort.toLowerCase();


            if (
                !vorhanden.has(
                    schluessel
                )
            ) {

                vorhanden.add(
                    schluessel
                );


                ergebnis.push(
                    wort
                );

            }

        }
    );


    ergebnis.sort(
        function (a, b) {

            return a.localeCompare(
                b,
                "de"
            );

        }
    );


    return ergebnis;

}


// ============================================================
// ALLE DATEN ZUSAMMENFÜHREN
// ============================================================

function zusammenfuehren(

    lokaleDaten,
    githubDaten,
    letzterStand

) {

    if (
        !lokaleDaten ||
        typeof lokaleDaten !== "object"
    ) {

        lokaleDaten = {};

    }


    if (
        !githubDaten ||
        typeof githubDaten !== "object"
    ) {

        githubDaten = {};

    }


    const ergebnis =
        notizenSynchronisieren(

            lokaleDaten.notizen,

            githubDaten.notizen,

            letzterStand,

            lokaleDaten.geloescht,

            githubDaten.geloescht

        );


    return {

        notizen:
            ergebnis.notizen,

        woerter:
            woerterZusammenfuehren(

                lokaleDaten.woerter,

                githubDaten.woerter

            ),

        geloescht:
            ergebnis.geloescht

    };

}


// ============================================================
// LOKALE DATEN ERSTELLEN
// ============================================================

function lokaleDatenErstellen() {

    return {

        notizen:
            Array.isArray(notizen)
                ? notizen
                : [],

        woerter:
            typeof woerter !== "undefined" &&
            Array.isArray(woerter)
                ? woerter
                : [],

        geloescht:
            lokaleLoeschungenLaden()

    };

}


// ============================================================
// ZUSAMMENGEFÜHRTE DATEN LOKAL SPEICHERN
// ============================================================

function lokaleDatenUebernehmen(
    daten
) {

    notizen =
        Array.isArray(
            daten.notizen
        )
            ? daten.notizen
            : [];


    if (
        typeof woerter !== "undefined"
    ) {

        woerter =
            Array.isArray(
                daten.woerter
            )
                ? daten.woerter
                : [];

    }


    localStorage.setItem(

        "NotizZettel_V2",

        JSON.stringify(
            notizen
        )

    );


    localStorage.setItem(

        "NotizZettel_Woerter",

        JSON.stringify(
            daten.woerter
        )

    );


    lokaleLoeschungenSpeichern(

        daten.geloescht

    );

}


// ============================================================
// KOMPLETTE SYNCHRONISATION
// ============================================================

async function synchronisieren() {

    if (
        !githubVorhanden()
    ) {

        alert(
            "Bitte zuerst die GitHub-Zugangsdaten speichern."
        );

        return false;

    }


    // --------------------------------------------------------
    // GITHUB LESEN
    // --------------------------------------------------------

    const githubErgebnis =
        await githubDateiLesen();


    if (
        !githubErgebnis
    ) {

        return false;

    }


    // --------------------------------------------------------
    // LETZTEN STAND LADEN
    // --------------------------------------------------------

    const letzterStand =
        syncStandLaden();


    // --------------------------------------------------------
    // LOKALE DATEN
    // --------------------------------------------------------

    const lokaleDaten =
        lokaleDatenErstellen();


    // --------------------------------------------------------
    // ZUSAMMENFÜHREN
    // --------------------------------------------------------

    const gemeinsameDaten =
        zusammenfuehren(

            lokaleDaten,

            githubErgebnis.daten,

            letzterStand

        );


    // --------------------------------------------------------
    // NACH GITHUB SCHREIBEN
    // --------------------------------------------------------

    const gespeichert =
        await githubDateiSpeichern(

            gemeinsameDaten,

            githubErgebnis.sha

        );


    if (
        !gespeichert
    ) {

        return false;

    }


    // --------------------------------------------------------
    // LOKAL ÜBERNEHMEN
    // --------------------------------------------------------

    lokaleDatenUebernehmen(
        gemeinsameDaten
    );


    // --------------------------------------------------------
    // SYNCHRONISATIONSSTAND SPEICHERN
    // --------------------------------------------------------

    syncStandSpeichern(
        gemeinsameDaten
    );


    // --------------------------------------------------------
    // ANZEIGE AKTUALISIEREN
    // --------------------------------------------------------

    if (
        typeof anzeigen === "function"
    ) {

        anzeigen();

    }


    if (
        typeof vorschlaegeLoeschen === "function"
    ) {

        vorschlaegeLoeschen();

    }


    alert(
        "Synchronisation erfolgreich."
    );


    return true;

}
