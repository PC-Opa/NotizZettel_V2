// ============================================================
// NotizZettel V2
// SYNCHRONISATION
// Smartphone ↔ GitHub ↔ Laptop
// ============================================================

const GITHUB_BENUTZER =
    "PC-Opa";

const GITHUB_REPOSITORY =
    "NotizZettel_V2";

const GITHUB_DATEI =
    "Daten.json";

const GITHUB_API =
    "https://api.github.com";

const SPEICHER_GITHUB =
    "NotizZettel_GitHub";


// ============================================================
// GITHUB-DATEN
// ============================================================

let github = {

    benutzer:
        GITHUB_BENUTZER,

    repository:
        GITHUB_REPOSITORY,

    token:
        ""
};


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
// GITHUB-BEREICH ANZEIGEN / AUSBLENDEN
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
// GITHUB VORHANDEN?
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
// GITHUB DATEI LESEN
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

                    method:
                        "GET",

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

                sha:
                    null,

                daten:
                    {
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


        if (
            !githubDatei.content
        ) {

            return {

                sha:
                    githubDatei.sha ||
                    null,

                daten:
                    {
                        notizen: [],
                        woerter: [],
                        geloeschteNotizen: []
                    }
            };
        }


        const text =
            githubTextDekodieren(
                githubDatei.content
            );


        let daten;


        try {

            daten =
                JSON.parse(
                    text
                );

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
// GITHUB DATEI SPEICHERN
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

                    method:
                        "PUT",

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
// GITHUB TEXT DEKODIEREN
// ============================================================

function githubTextDekodieren(
    inhalt
) {

    const basis =
        inhalt.replace(
            /\s/g,
            ""
        );


    const binaer =
        atob(
            basis
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
            binaer.charCodeAt(
                i
            );
    }


    return new TextDecoder(
        "utf-8"
    ).decode(
        bytes
    );
}


// ============================================================
// GITHUB TEXT KODIEREN
// ============================================================

function githubTextKodieren(
    text
) {

    const bytes =
        new TextEncoder().encode(
            text
        );


    let binaer =
        "";


    const block =
        0x8000;


    for (
        let i = 0;
        i < bytes.length;
        i += block
    ) {

        binaer +=
            String.fromCharCode(
                ...bytes.slice(
                    i,
                    i + block
                )
            );
    }


    return btoa(
        binaer
    );
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
            typeof woerter !==
            "undefined" &&
            Array.isArray(woerter)
                ? woerter
                : [],

        geloeschteNotizen:
            Array.isArray(
                geloeschteNotizen
            )
                ? geloeschteNotizen
                : []
    };
}


// ============================================================
// NOTIZEN ZUSAMMENFÜHREN
// ============================================================

function notizenZusammenfuehren(
    lokal,
    githubDaten
) {

    const ergebnis =
        [];

    const vorhanden =
        new Map();


    const alle =
        [];


    if (
        Array.isArray(lokal)
    ) {

        alle.push(
            ...lokal
        );
    }


    if (
        Array.isArray(githubDaten)
    ) {

        alle.push(
            ...githubDaten
        );
    }


    alle.forEach(
        function (eintrag) {

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
                !vorhanden.has(
                    schluessel
                )
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


                vorhanden.set(
                    schluessel,
                    ergebnis.length
                );


                ergebnis.push(
                    neu
                );

            } else {

                const position =
                    vorhanden.get(
                        schluessel
                    );


                // Sobald ein Gerät die Notiz
                // als erledigt markiert hat,
                // bleibt sie erledigt.

                if (
                    eintrag.erledigt ===
                    true
                ) {

                    ergebnis[
                        position
                    ].erledigt =
                        true;
                }


                // Händlerangabe übernehmen,
                // falls sie bisher fehlt.

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
    );


    return ergebnis;
}


// ============================================================
// WÖRTERBUCH ZUSAMMENFÜHREN
// ============================================================

function woerterZusammenfuehren(
    lokal,
    githubDaten
) {

    const ergebnis =
        [];

    const vorhanden =
        new Set();


    const alle =
        [];


    if (
        Array.isArray(lokal)
    ) {

        alle.push(
            ...lokal
        );
    }


    if (
        Array.isArray(githubDaten)
    ) {

        alle.push(
            ...githubDaten
        );
    }


    alle.forEach(
        function (wort) {

            if (
                typeof wort !==
                "string"
            ) {

                return;
            }


            const text =
                wort.trim();


            if (
                text === ""
            ) {

                return;
            }


            const schluessel =
                text.toLowerCase();


            if (
                !vorhanden.has(
                    schluessel
                )
            ) {

                vorhanden.add(
                    schluessel
                );


                ergebnis.push(
                    text
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
// GELÖSCHTE NOTIZEN ZUSAMMENFÜHREN
// ============================================================

function geloeschteNotizenZusammenfuehren(
    lokal,
    githubDaten
) {

    const ergebnis =
        [];


    const vorhanden =
        new Set();


    const alle =
        [];


    if (
        Array.isArray(lokal)
    ) {

        alle.push(
            ...lokal
        );
    }


    if (
        Array.isArray(githubDaten)
    ) {

        alle.push(
            ...githubDaten
        );
    }


    alle.forEach(
        function (eintrag) {

            if (
                typeof eintrag !==
                "string"
            ) {

                return;
            }


            const text =
                eintrag
                    .trim()
                    .toLowerCase();


            if (
                text === ""
            ) {

                return;
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
    );


    return ergebnis;
}


// ============================================================
// GELÖSCHTE NOTIZEN BEREINIGEN
// ============================================================

function geloeschteNotizenBereinigen(
    daten
) {

    const geloescht =
        new Set(
            Array.isArray(
                daten.geloeschteNotizen
            )
                ? daten.geloeschteNotizen
                : []
        );


    if (
        !Array.isArray(
            daten.notizen
        )
    ) {

        return;
    }


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


                return !geloescht.has(
                    eintrag.text
                        .trim()
                        .toLowerCase()
                );
            }
        );
}


// ============================================================
// DATEN ZUSAMMENFÜHREN
// ============================================================

function zusammenfuehren(
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


    const remoteNotizen =
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


    const remoteWoerter =
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


    const remoteGeloeschte =
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
                remoteNotizen
            ),

        woerter:
            woerterZusammenfuehren(
                lokaleWoerter,
                remoteWoerter
            ),

        geloeschteNotizen:
            geloeschteNotizenZusammenfuehren(
                lokaleGeloeschte,
                remoteGeloeschte
            )
    };


    geloeschteNotizenBereinigen(
        ergebnis
    );


    return ergebnis;
}


// ============================================================
// LOKALE DATEN ÜBERNEHMEN
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


    if (
        typeof woerter !==
        "undefined"
    ) {

        localStorage.setItem(
            "NotizZettel_Woerter",
            JSON.stringify(
                woerter
            )
        );
    }


    localStorage.setItem(
        "NotizZettel_Geloescht",
        JSON.stringify(
            geloeschteNotizen
        )
    );
}


// ============================================================
// SYNCHRONISIEREN
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


    const remote =
        await githubDateiLesen();


    if (!remote) {

        return false;
    }


    const lokal =
        lokaleDatenErstellen();


    const gemeinsameDaten =
        zusammenfuehren(
            lokal,
            remote.daten
        );


    const gespeichert =
        await githubDateiSpeichern(
            gemeinsameDaten,
            remote.sha
        );


    if (!gespeichert) {

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

document.addEventListener(
    "DOMContentLoaded",
    function () {

        synchronisationStarten();
    }
);
