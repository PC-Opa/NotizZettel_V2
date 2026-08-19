// ============================================================
// NOTIZZETTEL V2 – SYNCHRONISATION
// ============================================================

const SPEICHER_GITHUB =
    "NotizZettel_GitHub";

const SPEICHER_NOTIZEN =
    "NotizZettel_V2";

const SPEICHER_WOERTER =
    "NotizZettel_Woerter";


let github = {

    benutzer: "",

    repository: "",

    token: ""

};


// ============================================================
// GITHUB-DATEN LADEN
// ============================================================

function githubLaden() {

    const daten =
        localStorage.getItem(
            SPEICHER_GITHUB
        );


    if (!daten) {

        return;

    }


    try {

        const geladen =
            JSON.parse(
                daten
            );


        if (
            geladen &&
            typeof geladen === "object"
        ) {

            github = {

                benutzer:
                    geladen.benutzer || "",

                repository:
                    geladen.repository || "",

                token:
                    geladen.token || ""

            };

        }

    } catch (
        fehler
    ) {

        github = {

            benutzer: "",

            repository: "",

            token: ""

        };

    }

}


// ============================================================
// GITHUB-DATEN SPEICHERN
// ============================================================

function githubSpeichern(
    benutzer,
    repository,
    token
) {

    github = {

        benutzer:
            String(
                benutzer || ""
            ).trim(),

        repository:
            String(
                repository || ""
            ).trim(),

        token:
            String(
                token || ""
            ).trim()

    };


    localStorage.setItem(

        SPEICHER_GITHUB,

        JSON.stringify(
            github
        )

    );

}


// ============================================================
// GITHUB VORHANDEN?
// ============================================================

function githubVorhanden() {

    return (

        github.benutzer.trim() !== "" &&

        github.repository.trim() !== "" &&

        github.token.trim() !== ""

    );

}


// ============================================================
// GITHUB-BEREICH ÖFFNEN / SCHLIESSEN
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
        bereich.style.display ===
        "none" ||
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
// BASE64 AUS GITHUB DEKODIEREN
// ============================================================

function textAusGitHubDekodieren(
    base64
) {

    const binaer =
        atob(
            String(
                base64 || ""
            ).replace(
                /\s/g,
                ""
            )
        );


    const bytes =
        new Uint8Array(
            binaer.length
        );


    for (
        let i = 0;
        i < binaer.length;
        i++
    ) {

        bytes[i] =
            binaer.charCodeAt(i);

    }


    return new TextDecoder(
        "utf-8"
    ).decode(
        bytes
    );

}


// ============================================================
// TEXT FÜR GITHUB KODIEREN
// ============================================================

function textFuerGitHubKodieren(
    text
) {

    const bytes =
        new TextEncoder().encode(
            String(
                text || ""
            )
        );


    let binaer = "";


    for (
        let i = 0;
        i < bytes.length;
        i++
    ) {

        binaer +=
            String.fromCharCode(
                bytes[i]
            );

    }


    return btoa(
        binaer
    );

}


// ============================================================
// GITHUB-DATEI LESEN
// ============================================================

async function githubDateiLesen() {

    if (
        !githubVorhanden()
    ) {

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
                            "Bearer " +
                            github.token,

                        Accept:
                            "application/vnd.github+json"

                    }

                }
            );


        if (
            !antwort.ok
        ) {

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


        const githubDatei =
            await antwort.json();


        const text =
            textAusGitHubDekodieren(
                githubDatei.content
            );


        let daten;


        try {

            daten =
                JSON.parse(
                    text
                );

        } catch (
            fehler
        ) {

            alert(
                "Daten.json auf GitHub enthält keine gültigen Daten."
            );


            return null;

        }


        if (
            !daten ||
            typeof daten !== "object"
        ) {

            daten = {};

        }


        return {

            sha:
                githubDatei.sha,

            daten:
                daten

        };

    } catch (
        fehler
    ) {

        alert(
            "Fehler beim Lesen von GitHub:\n\n" +

            fehler.message
        );


        return null;

    }

}


// ============================================================
// GITHUB-DATEI SPEICHERN
// ============================================================

async function githubDateiSpeichern(
    daten,
    sha
) {

    if (
        !githubVorhanden()
    ) {

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
            daten,
            null,
            2
        );


    const inhalt =
        {

            message:
                "NotizZettel Synchronisation",

            content:
                textFuerGitHubKodieren(
                    text
                ),

            sha:
                sha

        };


    try {

        const antwort =
            await fetch(
                url,
                {

                    method: "PUT",

                    headers: {

                        Authorization:
                            "Bearer " +
                            github.token,

                        Accept:
                            "application/vnd.github+json",

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            inhalt
                        )

                }
            );


        if (
            !antwort.ok
        ) {

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

    } catch (
        fehler
    ) {

        alert(
            "Fehler beim Speichern auf GitHub:\n\n" +

            fehler.message
        );


        return false;

    }

}


// ============================================================
// NOTIZEN ZUSAMMENFÜHREN
// ============================================================

function notizenZusammenfuehren(
    lokaleNotizen,
    githubNotizen
) {

    const ergebnis = [];

    const positionen =
        new Map();


    function eintragHinzufuegen(
        eintrag
    ) {

        if (
            !eintrag ||
            typeof eintrag.text !==
                "string"
        ) {

            return;

        }


        const text =
            eintrag.text.trim();


        if (
            text === ""
        ) {

            return;

        }


        const schluessel =
            text.toLowerCase();


        if (
            !positionen.has(
                schluessel
            )
        ) {

            const neuerEintrag = {

                text:
                    text,

                haendler:
                    typeof eintrag.haendler ===
                    "string"
                        ? eintrag.haendler
                        : "",

                erledigt:
                    eintrag.erledigt === true

            };


            positionen.set(

                schluessel,

                ergebnis.length

            );


            ergebnis.push(
                neuerEintrag
            );


            return;

        }


        const position =
            positionen.get(
                schluessel
            );


        const vorhanden =
            ergebnis[position];


        if (
            !vorhanden
        ) {

            return;

        }


        if (
            eintrag.erledigt === true
        ) {

            vorhanden.erledigt =
                true;

        }


        if (
            vorhanden.haendler === "" &&
            typeof eintrag.haendler ===
                "string" &&
            eintrag.haendler.trim() !== ""
        ) {

            vorhanden.haendler =
                eintrag.haendler;

        }

    }


    if (
        Array.isArray(
            lokaleNotizen
        )
    ) {

        lokaleNotizen.forEach(
            eintragHinzufuegen
        );

    }


    if (
        Array.isArray(
            githubNotizen
        )
    ) {

        githubNotizen.forEach(
            eintragHinzufuegen
        );

    }


    return ergebnis;

}


// ============================================================
// WÖRTER ZUSAMMENFÜHREN
// ============================================================

function woerterZusammenfuehren(
    lokaleWoerter,
    githubWoerter
) {

    const ergebnis = [];

    const vorhanden =
        new Set();


    function wortHinzufuegen(
        wort
    ) {

        if (
            typeof wort !==
            "string"
        ) {

            return;

        }


        wort =
            wort.trim();


        if (
            wort === ""
        ) {

            return;

        }


        const schluessel =
            wort.toLowerCase();


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
            wort
        );

    }


    if (
        Array.isArray(
            lokaleWoerter
        )
    ) {

        lokaleWoerter.forEach(
            wortHinzufuegen
        );

    }


    if (
        Array.isArray(
            githubWoerter
        )
    ) {

        githubWoerter.forEach(
            wortHinzufuegen
        );

    }


    ergebnis.sort(
        function (
            a,
            b
        ) {

            return a.localeCompare(
                b,
                "de"
            );

        }
    );


    return ergebnis;

}


// ============================================================
// LOKALE DATEN ERSTELLEN
// ============================================================

function lokaleDatenErstellen() {

    let lokaleWoerter = [];


    try {

        const gespeicherteWoerter =
            localStorage.getItem(
                SPEICHER_WOERTER
            );


        if (
            gespeicherteWoerter
        ) {

            const geladen =
                JSON.parse(
                    gespeicherteWoerter
                );


            if (
                Array.isArray(
                    geladen
                )
            ) {

                lokaleWoerter =
                    geladen;

            }

        }

    } catch (
        fehler
    ) {

        lokaleWoerter =
            [];

    }


    if (
        typeof woerter !==
        "undefined" &&
        Array.isArray(
            woerter
        )
    ) {

        lokaleWoerter =
            woerter;

    }


    return {

        notizen:
            Array.isArray(
                notizen
            )
                ? notizen
                : [],

        woerter:
            lokaleWoerter

    };

}


// ============================================================
// DATEN LOKAL ÜBERNEHMEN
// ============================================================

function lokaleDatenUebernehmen(
    daten
) {

    if (
        !daten ||
        typeof daten !==
            "object"
    ) {

        return;

    }


    notizen =
        Array.isArray(
            daten.notizen
        )
            ? daten.notizen
            : [];


    if (
        typeof woerter !==
        "undefined"
    ) {

        woerter =
            Array.isArray(
                daten.woerter
            )
                ? daten.woerter
                : [];

    }


    localStorage.setItem(

        SPEICHER_NOTIZEN,

        JSON.stringify(
            notizen
        )

    );


    localStorage.setItem(

        SPEICHER_WOERTER,

        JSON.stringify(
            Array.isArray(
                daten.woerter
            )
                ? daten.woerter
                : []

        )

    );


    if (
        typeof speichern ===
        "function"
    ) {

        speichern();

    }

}


// ============================================================
// DATEN ZUSAMMENFÜHREN
// ============================================================

function zusammenfuehren(
    lokaleDaten,
    githubDaten
) {

    if (
        !lokaleDaten ||
        typeof lokaleDaten !==
            "object"
    ) {

        lokaleDaten = {};

    }


    if (
        !githubDaten ||
        typeof githubDaten !==
            "object"
    ) {

        githubDaten = {};

    }


    return {

        notizen:
            notizenZusammenfuehren(

                lokaleDaten.notizen,

                githubDaten.notizen

            ),


        woerter:
            woerterZusammenfuehren(

                lokaleDaten.woerter,

                githubDaten.woerter

            )

    };

}


// ============================================================
// SYNCHRONISATION
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


    const githubErgebnis =
        await githubDateiLesen();


    if (
        !githubErgebnis
    ) {

        return false;

    }


    const lokaleDaten =
        lokaleDatenErstellen();


    const gemeinsameDaten =
        zusammenfuehren(

            lokaleDaten,

            githubErgebnis.daten

        );


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


    lokaleDatenUebernehmen(

        gemeinsameDaten

    );


    if (
        typeof anzeigen ===
        "function"
    ) {

        anzeigen();

    }


    if (
        typeof vorschlaegeLoeschen ===
        "function"
    ) {

        vorschlaegeLoeschen();

    }


    alert(
        "Synchronisation erfolgreich."
    );


    return true;

}


// ============================================================
// START
// ============================================================

githubLaden();
