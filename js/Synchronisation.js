const SPEICHER_GITHUB = "NotizZettel_GitHub";
const SPEICHER_SYNC_STAND = "NotizZettel_SyncStand";

let github = {

    benutzer: "",
    repository: "",
    token: ""

};


// ============================================================
// GITHUB-ZUGANGSDATEN
// ============================================================

function githubLaden() {

    const daten = localStorage.getItem(SPEICHER_GITHUB);

    if (daten) {

        try {

            github = JSON.parse(daten);

        } catch (fehler) {

            github = {

                benutzer: "",
                repository: "",
                token: ""

            };

        }

    }

}


function githubSpeichern(benutzer, repository, token) {

    github.benutzer = benutzer.trim();
    github.repository = repository.trim();
    github.token = token.trim();

    localStorage.setItem(
        SPEICHER_GITHUB,
        JSON.stringify(github)
    );

}


function githubVorhanden() {

    return (

        github.benutzer.trim() !== "" &&
        github.repository.trim() !== "" &&
        github.token.trim() !== ""

    );

}


// ============================================================
// GITHUB-BEREICH
// ============================================================

function githubBereichUmschalten() {

    const bereich =
        document.getElementById("GitHubBereich");

    if (!bereich) {

        return;

    }

    if (bereich.style.display === "none") {

        bereich.style.display = "block";

        document.getElementById("GitBenutzer").value =
            github.benutzer;

        document.getElementById("GitRepository").value =
            github.repository;

        document.getElementById("GitToken").value =
            github.token;

    } else {

        bereich.style.display = "none";

    }

}


// ============================================================
// TEXT FÜR GITHUB KODIEREN
// ============================================================

function textFuerGitHubKodieren(text) {

    const daten =
        new TextEncoder().encode(text);

    let binaer = "";

    daten.forEach(function (zeichen) {

        binaer += String.fromCharCode(zeichen);

    });

    return btoa(binaer);

}


// ============================================================
// TEXT VON GITHUB DEKODIEREN
// ============================================================

function textAusGitHubDekodieren(text) {

    const binaer =
        atob(text.replace(/\s/g, ""));

    const daten =
        new Uint8Array(binaer.length);

    for (
        let i = 0;
        i < binaer.length;
        i++
    ) {

        daten[i] =
            binaer.charCodeAt(i);

    }

    return new TextDecoder("utf-8").decode(daten);

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

                        Authorization:
                            "Bearer " + github.token,

                        Accept:
                            "application/vnd.github+json"

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

            sha: daten.sha,
            daten: inhalt

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

        const antwort =
            await fetch(

                url,

                {

                    method: "PUT",

                    headers: {

                        Authorization:
                            "Bearer " + github.token,

                        Accept:
                            "application/vnd.github+json",

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                "NotizZettel Synchronisation",

                            content:
                                textFuerGitHubKodieren(
                                    text
                                ),

                            sha: sha

                        })

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
// HILFSFUNKTION: NOTIZ-SCHLÜSSEL
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
// HILFSFUNKTION: NOTIZEN VEREINHEITLICHEN
// ============================================================

function notizenVereinheitlichen(liste) {

    const ergebnis = [];
    const vorhanden = new Set();

    if (!Array.isArray(liste)) {

        return ergebnis;

    }

    liste.forEach(function (eintrag) {

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

        if (vorhanden.has(schluessel)) {

            return;

        }

        vorhanden.add(schluessel);

        ergebnis.push({

            text: text,

            erledigt:
                eintrag.erledigt === true

        });

    });

    return ergebnis;

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

function syncStandSpeichern(daten) {

    localStorage.setItem(

        SPEICHER_SYNC_STAND,

        JSON.stringify({

            notizen:
                notizenVereinheitlichen(
                    daten.notizen
                ),

            woerter:
                Array.isArray(daten.woerter)
                    ? daten.woerter
                    : []

        })

    );

}


// ============================================================
// PRÜFEN, OB NOTIZ GLEICH GEBLIEBEN IST
// ============================================================

function notizGleich(a, b) {

    if (!a || !b) {

        return false;

    }

    return (

        notizSchluessel(a) ===
            notizSchluessel(b)

        &&

        a.erledigt ===
            b.erledigt

    );

}


// ============================================================
// NOTIZEN ZUSAMMENFÜHREN
// ============================================================
//
// Wichtig:
//
// Eine Notiz, die seit der letzten Synchronisierung
// auf einem Gerät gelöscht wurde, wird nicht wieder
// zurückgeholt.
//
// Eine neue Notiz wird übernommen.
//
// Eine erledigte Notiz bleibt erledigt.
//
// Bei Änderungen auf beiden Geräten gewinnt der
// aktuelle lokale Stand des synchronisierenden Gerätes.
// ============================================================

function notizenZusammenfuehren(

    lokaleNotizen,
    githubNotizen,
    letzterStand

) {

    const lokal =
        notizenVereinheitlichen(
            lokaleNotizen
        );

    const github =
        notizenVereinheitlichen(
            githubNotizen
        );

    const vorher =
        letzterStand
            ? notizenVereinheitlichen(
                letzterStand.notizen
            )
            : null;

    const lokalMap = new Map();
    const githubMap = new Map();
    const vorherMap = new Map();

    lokal.forEach(function (eintrag) {

        lokalMap.set(
            notizSchluessel(eintrag),
            eintrag
        );

    });

    github.forEach(function (eintrag) {

        githubMap.set(
            notizSchluessel(eintrag),
            eintrag
        );

    });

    if (vorher) {

        vorher.forEach(function (eintrag) {

            vorherMap.set(
                notizSchluessel(eintrag),
                eintrag
            );

        });

    }


    // --------------------------------------------------------
    // ERGEBNIS AUFBAUEN
    // --------------------------------------------------------

    const schluesselAlle =
        new Set([

            ...lokalMap.keys(),
            ...githubMap.keys(),
            ...vorherMap.keys()

        ]);

    const ergebnis = [];


    schluesselAlle.forEach(function (schluessel) {

        const lokalEintrag =
            lokalMap.get(schluessel);

        const githubEintrag =
            githubMap.get(schluessel);

        const vorherEintrag =
            vorherMap.get(schluessel);


        // ----------------------------------------------------
        // NOTIZ WAR VORHER VORHANDEN
        // ----------------------------------------------------

        if (vorherEintrag) {


            // Auf diesem Gerät gelöscht
            const lokalGeloescht =
                !lokalEintrag;


            // Auf GitHub gelöscht
            const githubGeloescht =
                !githubEintrag;


            // Beide haben gelöscht
            if (
                lokalGeloescht &&
                githubGeloescht
            ) {

                return;

            }


            // Lokal gelöscht,
            // GitHub unverändert
            if (
                lokalGeloescht &&
                githubEintrag &&
                notizGleich(
                    githubEintrag,
                    vorherEintrag
                )
            ) {

                return;

            }


            // GitHub gelöscht,
            // lokal unverändert
            if (
                githubGeloescht &&
                lokalEintrag &&
                notizGleich(
                    lokalEintrag,
                    vorherEintrag
                )
            ) {

                return;

            }


            // Beide vorhanden:
            // lokaler Stand wird übernommen,
            // wenn lokal geändert wurde.
            if (
                lokalEintrag &&
                githubEintrag
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


                // Nur GitHub geändert
                if (
                    !lokalGeaendert &&
                    githubGeaendert
                ) {

                    ergebnis.push(
                        githubEintrag
                    );

                    return;

                }


                // Lokal geändert oder beide geändert
                ergebnis.push(
                    lokalEintrag
                );

                return;

            }


            // Lokal vorhanden,
            // GitHub nicht vorhanden,
            // aber lokal wurde geändert:
            // lokal behalten.
            if (
                lokalEintrag &&
                !githubEintrag
            ) {

                const lokalGeaendert =
                    !notizGleich(
                        lokalEintrag,
                        vorherEintrag
                    );

                if (lokalGeaendert) {

                    ergebnis.push(
                        lokalEintrag
                    );

                }

                return;

            }


            // GitHub vorhanden,
            // lokal nicht vorhanden,
            // aber GitHub wurde geändert:
            // GitHub behalten.
            if (
                githubEintrag &&
                !lokalEintrag
            ) {

                const githubGeaendert =
                    !notizGleich(
                        githubEintrag,
                        vorherEintrag
                    );

                if (githubGeaendert) {

                    ergebnis.push(
                        githubEintrag
                    );

                }

                return;

            }

        }


        // ----------------------------------------------------
        // NEUE NOTIZ
        // ----------------------------------------------------

        if (
            lokalEintrag &&
            !vorherEintrag
        ) {

            ergebnis.push(
                lokalEintrag
            );

            return;

        }


        if (
            githubEintrag &&
            !vorherEintrag
        ) {

            ergebnis.push(
                githubEintrag
            );

            return;

        }

    });


    return ergebnis;

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

    if (Array.isArray(lokaleWoerter)) {

        alleWoerter.push(
            ...lokaleWoerter
        );

    }

    if (Array.isArray(githubWoerter)) {

        alleWoerter.push(
            ...githubWoerter
        );

    }


    alleWoerter.forEach(function (wort) {

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
            !vorhanden.has(schluessel)
        ) {

            vorhanden.add(
                schluessel
            );

            ergebnis.push(
                wort
            );

        }

    });


    ergebnis.sort(function (a, b) {

        return a.localeCompare(
            b,
            "de"
        );

    });


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


    return {

        notizen:

            notizenZusammenfuehren(

                lokaleDaten.notizen,
                githubDaten.notizen,
                letzterStand

            ),

        woerter:

            woerterZusammenfuehren(

                lokaleDaten.woerter,
                githubDaten.woerter

            )

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

            Array.isArray(woerter)

                ? woerter

                : []

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


    woerter =

        Array.isArray(
            daten.woerter
        )

            ? daten.woerter

            : [];


    localStorage.setItem(

        "NotizZettel_V2",

        JSON.stringify(
            notizen
        )

    );


    localStorage.setItem(

        "NotizZettel_Woerter",

        JSON.stringify(
            woerter
        )

    );

}


// ============================================================
// KOMPLETTE SYNCHRONISATION
// ============================================================

async function synchronisieren() {

    if (!githubVorhanden()) {

        alert(
            "Bitte zuerst die GitHub-Zugangsdaten speichern."
        );

        return false;

    }


    // --------------------------------------------------------
    // GITHUB DATEN LESEN
    // --------------------------------------------------------

    const githubErgebnis =
        await githubDateiLesen();

    if (!githubErgebnis) {

        return false;

    }


    // --------------------------------------------------------
    // LOKALE DATEN
    // --------------------------------------------------------

    const lokaleDaten =
        lokaleDatenErstellen();


    // --------------------------------------------------------
    // LETZTEN SYNCHRONISATIONSSTAND LADEN
    // --------------------------------------------------------

    const letzterStand =
        syncStandLaden();


    // --------------------------------------------------------
    // DATEN ZUSAMMENFÜHREN
    // --------------------------------------------------------

    const gemeinsameDaten =
        zusammenfuehren(

            lokaleDaten,

            githubErgebnis.daten,

            letzterStand

        );


    // --------------------------------------------------------
    // GITHUB SPEICHERN
    // --------------------------------------------------------

    const gespeichert =
        await githubDateiSpeichern(

            gemeinsameDaten,

            githubErgebnis.sha

        );


    if (!gespeichert) {

        return false;

    }


    // --------------------------------------------------------
    // LOKAL ÜBERNEHMEN
    // --------------------------------------------------------

    lokaleDatenUebernehmen(
        gemeinsameDaten
    );


    // --------------------------------------------------------
    // NEUEN SYNCHRONISATIONSSTAND SPEICHERN
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
