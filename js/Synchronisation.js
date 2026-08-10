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
                    : [],

            geloescht:
                Array.isArray(daten.geloescht)
                    ? daten.geloescht
                    : []

        })

    );

}


// ============================================================
// NOTIZ VERGLEICHEN
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

function notizenZusammenfuehren(

    lokaleNotizen,
    githubNotizen,
    letzterStand,
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

    const lokalMap = new Map();
    const githubMap = new Map();
    const vorherMap = new Map();

    lokal.forEach(function (eintrag) {

        lokalMap.set(
            notizSchluessel(eintrag),
            eintrag
        );

    });

    vonGitHub.forEach(function (eintrag) {

        githubMap.set(
            notizSchluessel(eintrag),
            eintrag
        );

    });

    vorher.forEach(function (eintrag) {

        vorherMap.set(
            notizSchluessel(eintrag),
            eintrag
        );

    });

    const geloescht =
        Array.isArray(githubGeloescht)
            ? githubGeloescht
            : [];

    const alleSchluessel =
        new Set([

            ...lokalMap.keys(),
            ...githubMap.keys(),
            ...vorherMap.keys()

        ]);

    const ergebnis = [];
    const neueLoeschungen = new Set(geloescht);


    alleSchluessel.forEach(function (schluessel) {

        const lokalEintrag =
            lokalMap.get(schluessel);

        const githubEintrag =
            githubMap.get(schluessel);

        const vorherEintrag =
            vorherMap.get(schluessel);


        // ----------------------------------------------------
        // GITHUB HAT DIE NOTIZ BEREITS ALS GELÖSCHT GEMERKT
        // ----------------------------------------------------

        if (
            geloescht.includes(schluessel)
        ) {

            if (
                lokalEintrag &&
                vorherEintrag &&
                !notizGleich(
                    lokalEintrag,
                    vorherEintrag
                )
            ) {

                ergebnis.push(
                    lokalEintrag
                );

                neueLoeschungen.delete(
                    schluessel
                );

            }

            return;

        }


        // ----------------------------------------------------
        // LOKAL GELÖSCHT
        // ----------------------------------------------------

        if (
            vorherEintrag &&
            !lokalEintrag
        ) {

            neueLoeschungen.add(
                schluessel
            );

            return;

        }


        // ----------------------------------------------------
        // GITHUB GELÖSCHT
        // ----------------------------------------------------

        if (
            vorherEintrag &&
            !githubEintrag
        ) {

            if (
                lokalEintrag &&
                !notizGleich(
                    lokalEintrag,
                    vorherEintrag
                )
            ) {

                ergebnis.push(
                    lokalEintrag
                );

            } else {

                neueLoeschungen.add(
                    schluessel
                );

            }

            return;

        }


        // ----------------------------------------------------
        // BEIDE VORHANDEN
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // NUR LOKAL VORHANDEN
        // ----------------------------------------------------

        if (lokalEintrag) {

            ergebnis.push(
                lokalEintrag
            );

            return;

        }


        // ----------------------------------------------------
        // NUR GITHUB VORHANDEN
        // ----------------------------------------------------

        if (githubEintrag) {

            ergebnis.push(
                githubEintrag
            );

        }

    });


    return {

        notizen:
            ergebnis,

        geloescht:
            Array.from(
                neueLoeschungen
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


    const notizenErgebnis =
        notizenZusammenfuehren(

            lokaleDaten.notizen,

            githubDaten.notizen,

            letzterStand,

            githubDaten.geloescht

        );


    return {

        notizen:
            notizenErgebnis.notizen,

        woerter:
            woerterZusammenfuehren(

                lokaleDaten.woerter,

                githubDaten.woerter

            ),

        geloescht:
            notizenErgebnis.geloescht

    };

}


// ============================================================
// LOKALE DATEN ERSTELLEN
// ============================================================

function lokaleDatenErstellen() {

    const letzterStand =
        syncStandLaden();

    const lokaleNotizen =
        Array.isArray(notizen)
            ? notizen
            : [];

    const vorherigeNotizen =
        letzterStand &&
        Array.isArray(
            letzterStand.notizen
        )
            ? letzterStand.notizen
            : [];

    const lokaleGeloeschte = [];

    vorherigeNotizen.forEach(
        function (eintrag) {

            const schluessel =
                notizSchluessel(
                    eintrag
                );

            if (
                schluessel === ""
            ) {

                return;

            }

            const vorhanden =
                lokaleNotizen.some(
                    function (lokal) {

                        return (
                            notizSchluessel(
                                lokal
                            ) === schluessel
                        );

                    }
                );

            if (!vorhanden) {

                lokaleGeloeschte.push(
                    schluessel
                );

            }

        }
    );


    return {

        notizen:
            lokaleNotizen,

        woerter:
            Array.isArray(woerter)
                ? woerter
                : [],

        geloescht:
            lokaleGeloeschte

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


    const githubErgebnis =
        await githubDateiLesen();

    if (!githubErgebnis) {

        return false;

    }


    const letzterStand =
        syncStandLaden();


    const lokaleDaten =
        lokaleDatenErstellen();


    const gemeinsameDaten =
        zusammenfuehren(

            lokaleDaten,

            githubErgebnis.daten,

            letzterStand

        );


    const gespeichert =
        await githubDateiSpeichern(

            gemeinsameDaten,

            githubErgebnis.sha

        );


    if (!gespeichert) {

        return false;

    }


    lokaleDatenUebernehmen(
        gemeinsameDaten
    );


    syncStandSpeichern(
        gemeinsameDaten
    );


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
