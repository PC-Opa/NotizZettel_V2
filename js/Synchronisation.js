// ============================================================
// NotizZettel V2
// SYNCHRONISATION
// Laptop ↔ GitHub ↔ Smartphone
// ============================================================

const GITHUB_BENUTZER = "PC-Opa";
const GITHUB_REPOSITORY = "NotizZettel_V2";
const GITHUB_DATEI = "Daten.json";
const GITHUB_API = "https://api.github.com";
const SPEICHER_GITHUB = "NotizZettel_GitHub";

let github = {
    benutzer: GITHUB_BENUTZER,
    repository: GITHUB_REPOSITORY,
    token: ""
};


// ============================================================
// UTF-8 SICHERE BASE64-KODIERUNG
// ============================================================

function githubTextKodieren(text) {

    const bytes =
        new TextEncoder().encode(text);

    let binaer = "";

    for (
        let i = 0;
        i < bytes.length;
        i += 0x8000
    ) {

        binaer += String.fromCharCode(
            ...bytes.slice(
                i,
                i + 0x8000
            )
        );
    }

    return btoa(binaer);
}


// ============================================================
// UTF-8 SICHERE BASE64-DEKODIERUNG
// ============================================================

function githubTextDekodieren(base64) {

    const bereinigtesBase64 =
        base64.replace(/\s/g, "");

    const binaer =
        atob(bereinigtesBase64);

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
    ).decode(bytes);
}


// ============================================================
// START
// ============================================================

function synchronisationStarten() {

    githubDatenLaden();

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

    const btnGitHub =
        document.getElementById(
            "BtnGitHub"
        );

    const btnSync =
        document.getElementById(
            "BtnSync"
        );

    const btnGitSpeichern =
        document.getElementById(
            "BtnGitSpeichern"
        );

    if (btnGitHub) {

        btnGitHub.addEventListener(
            "click",
            githubBereichAnzeigen
        );
    }

    if (btnSync) {

        btnSync.addEventListener(
            "click",
            synchronisieren
        );
    }

    if (btnGitSpeichern) {

        btnGitSpeichern.addEventListener(
            "click",
            githubDatenSpeichern
        );
    }
}


// ============================================================
// GITHUB-BEREICH
// ============================================================

function githubBereichAnzeigen() {

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
        bereich.style.display ===
        ""
    ) {

        bereich.style.display =
            "block";

    } else {

        bereich.style.display =
            "none";
    }
}


// ============================================================
// GITHUB-DATEN SPEICHERN
// ============================================================

function githubDatenSpeichern() {

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

    const neuerBenutzer =
        benutzer
            ? benutzer.value.trim()
            : "";

    const neuesRepository =
        repository
            ? repository.value.trim()
            : "";

    const neuesToken =
        token
            ? token.value.trim()
            : "";

    if (
        neuerBenutzer === "" ||
        neuesRepository === "" ||
        neuesToken === ""
    ) {

        alert(
            "Bitte GitHub-Benutzer, Repository und Token eingeben."
        );

        return;
    }

    github.benutzer =
        neuerBenutzer;

    github.repository =
        neuesRepository;

    github.token =
        neuesToken;

    githubDatenSpeichernLokal();

    alert(
        "GitHub-Zugangsdaten gespeichert."
    );
}


// ============================================================
// GITHUB-DATEN LOKAL SPEICHERN
// ============================================================

function githubDatenSpeichernLokal() {

    localStorage.setItem(
        SPEICHER_GITHUB,
        JSON.stringify(
            github
        )
    );
}


// ============================================================
// GITHUB-DATEN LADEN
// ============================================================

function githubDatenLaden() {

    const gespeichert =
        localStorage.getItem(
            SPEICHER_GITHUB
        );

    if (!gespeichert) {

        return;
    }

    try {

        const daten =
            JSON.parse(
                gespeichert
            );

        if (
            daten &&
            typeof daten ===
                "object"
        ) {

            github.benutzer =
                daten.benutzer ||
                GITHUB_BENUTZER;

            github.repository =
                daten.repository ||
                GITHUB_REPOSITORY;

            github.token =
                daten.token ||
                "";
        }

    } catch (fehler) {

        github = {

            benutzer:
                GITHUB_BENUTZER,

            repository:
                GITHUB_REPOSITORY,

            token:
                ""
        };
    }
}


// ============================================================
// GITHUB VORHANDEN
// ============================================================

function githubVorhanden() {

    return (
        github.benutzer !== "" &&
        github.repository !== "" &&
        github.token !== ""
    );
}


// ============================================================
// GITHUB-ADRESSE
// ============================================================

function githubAdresse() {

    return (
        GITHUB_API +
        "/repos/" +
        encodeURIComponent(
            github.benutzer
        ) +
        "/" +
        encodeURIComponent(
            github.repository
        ) +
        "/contents/" +
        GITHUB_DATEI
    );
}


// ============================================================
// DATEN VON GITHUB LESEN
// ============================================================

async function githubDateiLesen() {

    if (!githubVorhanden()) {

        alert(
            "Bitte zuerst die GitHub-Zugangsdaten speichern."
        );

        return null;
    }

    try {

        const antwort =
            await fetch(
                githubAdresse(),
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/vnd.github+json",

                        "Authorization":
                            "Bearer " +
                            github.token,

                        "X-GitHub-Api-Version":
                            "2022-11-28"
                    }
                }
            );

        if (
            antwort.status ===
            404
        ) {

            return {

                sha: null,

                daten: {
                    notizen: [],
                    woerter: [],
                    geloeschteNotizen: []
                }
            };
        }

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

        const githubDatei =
            await antwort.json();

        const text =
            githubTextDekodieren(
                githubDatei.content
            );

        let daten;

        try {

            daten =
                JSON.parse(text);

        } catch (fehler) {

            daten = {
                notizen: [],
                woerter: [],
                geloeschteNotizen: []
            };
        }

        return {

            sha:
                githubDatei.sha ||
                null,

            daten:
                daten
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
// DATEN AUF GITHUB SPEICHERN
// ============================================================

async function githubDateiSpeichern(
    daten,
    sha
) {

    if (!githubVorhanden()) {

        alert(
            "Bitte zuerst die GitHub-Zugangsdaten speichern."
        );

        return false;
    }

    try {

        const text =
            JSON.stringify(
                daten,
                null,
                2
            );

        const body = {

            message:
                "NotizZettel Synchronisation",

            content:
                githubTextKodieren(
                    text
                )
        };

        if (sha) {

            body.sha =
                sha;
        }

        const antwort =
            await fetch(
                githubAdresse(),
                {
                    method: "PUT",

                    headers: {

                        "Accept":
                            "application/vnd.github+json",

                        "Authorization":
                            "Bearer " +
                            github.token,

                        "Content-Type":
                            "application/json",

                        "X-GitHub-Api-Version":
                            "2022-11-28"
                    },

                    body:
                        JSON.stringify(
                            body
                        )
                }
            );

        if (!antwort.ok) {

            const fehler =
                await antwort.text();

            alert(
                "Fehler beim Speichern auf GitHub.\n\n" +
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
            "Fehler beim Schreiben auf GitHub:\n\n" +
            fehler.message
        );

        return false;
    }
}


// ============================================================
// LOKALE DATEN HOLEN
// ============================================================

function lokaleDatenErstellen() {

    let lokaleNotizen = [];

    let lokaleWoerter = [];

    let lokaleGeloeschte = [];


    if (
        typeof notizen !==
        "undefined" &&
        Array.isArray(notizen)
    ) {

        lokaleNotizen =
            notizen;
    }


    if (
        typeof woerter !==
        "undefined" &&
        Array.isArray(woerter)
    ) {

        lokaleWoerter =
            woerter;
    }


    if (
        typeof geloeschteNotizen !==
        "undefined" &&
        Array.isArray(
            geloeschteNotizen
        )
    ) {

        lokaleGeloeschte =
            geloeschteNotizen;
    }


    return {

        notizen:
            lokaleNotizen,

        woerter:
            lokaleWoerter,

        geloeschteNotizen:
            lokaleGeloeschte
    };
}


// ============================================================
// NOTIZEN ZUSAMMENFÜHREN
// ============================================================

function notizenZusammenfuehren(
    lokal,
    remote
) {

    const ergebnis = [];

    const schluessel =
        new Map();


    const alle = [];


    if (
        Array.isArray(lokal)
    ) {

        alle.push(
            ...lokal
        );
    }


    if (
        Array.isArray(remote)
    ) {

        alle.push(
            ...remote
        );
    }


    for (
        const eintrag of alle
    ) {

        if (
            !eintrag ||
            typeof eintrag.text !==
                "string"
        ) {

            continue;
        }


        const text =
            eintrag.text.trim();


        if (
            text === ""
        ) {

            continue;
        }


        const key =
            text.toLowerCase();


        if (
            !schluessel.has(key)
        ) {

            const neu = {

                text:
                    text,

                haendler:
                    eintrag.haendler ||
                    "",

                erledigt:
                    eintrag.erledigt ===
                    true
            };


            schluessel.set(
                key,
                ergebnis.length
            );


            ergebnis.push(
                neu
            );

        } else {

            const position =
                schluessel.get(
                    key
                );


            if (
                eintrag.erledigt ===
                true
            ) {

                ergebnis[
                    position
                ].erledigt =
                    true;
            }


            if (
                !ergebnis[
                    position
                ].haendler &&
                eintrag.haendler
            ) {

                ergebnis[
                    position
                ].haendler =
                    eintrag.haendler;
            }
        }
    }


    return ergebnis;
}


// ============================================================
// WÖRTER ZUSAMMENFÜHREN
// ============================================================

function woerterZusammenfuehren(
    lokal,
    remote
) {

    const ergebnis = [];

    const vorhanden =
        new Set();


    const alle = [];


    if (
        Array.isArray(lokal)
    ) {

        alle.push(
            ...lokal
        );
    }


    if (
        Array.isArray(remote)
    ) {

        alle.push(
            ...remote
        );
    }


    for (
        const wort of alle
    ) {

        if (
            typeof wort !==
            "string"
        ) {

            continue;
        }


        const text =
            wort.trim();


        if (
            text === ""
        ) {

            continue;
        }


        const key =
            text.toLowerCase();


        if (
            !vorhanden.has(key)
        ) {

            vorhanden.add(
                key
            );

            ergebnis.push(
                text
            );
        }
    }


    return ergebnis;
}


// ============================================================
// GELÖSCHTE NOTIZEN ZUSAMMENFÜHREN
// ============================================================

function geloeschteZusammenfuehren(
    lokal,
    remote
) {

    const ergebnis = [];

    const vorhanden =
        new Set();


    const alle = [];


    if (
        Array.isArray(lokal)
    ) {

        alle.push(
            ...lokal
        );
    }


    if (
        Array.isArray(remote)
    ) {

        alle.push(
            ...remote
        );
    }


    for (
        const eintrag of alle
    ) {

        if (
            typeof eintrag !==
            "string"
        ) {

            continue;
        }


        const text =
            eintrag
                .trim()
                .toLowerCase();


        if (
            text === ""
        ) {

            continue;
        }


        if (
            !vorhanden.has(
                text
            )
        ) {

            vorhanden.add(
                text
            );

            ergebnis.push(
                text
            );
        }
    }


    return ergebnis;
}


// ============================================================
// GELÖSCHTE NOTIZEN AUSFILTERN
// ============================================================

function geloeschteNotizenAnwenden(
    daten
) {

    const geloescht =
        new Set(
            daten.geloeschteNotizen
        );


    daten.notizen =
        daten.notizen.filter(
            function (eintrag) {

                if (
                    !eintrag ||
                    typeof eintrag.text !==
                        "string"
                ) {

                    return false;
                }


                const key =
                    eintrag.text
                        .trim()
                        .toLowerCase();


                return !geloescht.has(
                    key
                );
            }
        );
}


// ============================================================
// DATEN ZUSAMMENFÜHREN
// ============================================================

function datenZusammenfuehren(
    lokal,
    remote
) {

    const lokaleNotizen =
        lokal &&
        Array.isArray(
            lokal.notizen
        )
            ? lokal.notizen
            : [];


    const entfernteNotizen =
        remote &&
        Array.isArray(
            remote.notizen
        )
            ? remote.notizen
            : [];


    const lokaleWoerter =
        lokal &&
        Array.isArray(
            lokal.woerter
        )
            ? lokal.woerter
            : [];


    const entfernteWoerter =
        remote &&
        Array.isArray(
            remote.woerter
        )
            ? remote.woerter
            : [];


    const lokaleGeloeschte =
        lokal &&
        Array.isArray(
            lokal.geloeschteNotizen
        )
            ? lokal.geloeschteNotizen
            : [];


    const entfernteGeloeschte =
        remote &&
        Array.isArray(
            remote.geloeschteNotizen
        )
            ? remote.geloeschteNotizen
            : [];


    const ergebnis = {

        notizen:
            notizenZusammenfuehren(
                lokaleNotizen,
                entfernteNotizen
            ),

        woerter:
            woerterZusammenfuehren(
                lokaleWoerter,
                entfernteWoerter
            ),

        geloeschteNotizen:
            geloeschteZusammenfuehren(
                lokaleGeloeschte,
                entfernteGeloeschte
            )
    };


    geloeschteNotizenAnwenden(
        ergebnis
    );


    return ergebnis;
}


// ============================================================
// LOKALE DATEN AKTUALISIEREN
// ============================================================

function lokaleDatenUebernehmen(
    daten
) {

    if (!daten) {

        return;
    }


    notizen =
        Array.isArray(
            daten.notizen
        )
            ? daten.notizen
            : [];


    geloeschteNotizen =
        Array.isArray(
            daten.geloeschteNotizen
        )
            ? daten.geloeschteNotizen
            : [];


    localStorage.setItem(
        "NotizZettel_V2",
        JSON.stringify(
            notizen
        )
    );


    localStorage.setItem(
        "NotizZettel_Geloescht",
        JSON.stringify(
            geloeschteNotizen
        )
    );


    if (
        typeof anzeigen ===
        "function"
    ) {

        anzeigen();
    }
}


// ============================================================
// HAUPTFUNKTION SYNCHRONISIEREN
// ============================================================

async function synchronisieren() {

    if (
        !githubVorhanden()
    ) {

        alert(
            "Bitte zuerst die GitHub-Zugangsdaten speichern."
        );

        return;
    }


    const remote =
        await githubDateiLesen();


    if (!remote) {

        return;
    }


    const lokal =
        lokaleDatenErstellen();


    const zusammengefuehrt =
        datenZusammenfuehren(
            lokal,
            remote.daten
        );


    const gespeichert =
        await githubDateiSpeichern(
            zusammengefuehrt,
            remote.sha
        );


    if (!gespeichert) {

        return;
    }


    lokaleDatenUebernehmen(
        zusammengefuehrt
    );


    alert(
        "Synchronisation erfolgreich."
    );
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        synchronisationStarten();
    }
);
