// ============================================================
// NotizZettel V2 – SYNCHRONISIERUNG
// ============================================================

const SPEICHER_GITHUB = "NotizZettel_GitHub";
const SPEICHER_NOTIZEN = "NotizZettel_V2";
const SPEICHER_WOERTER = "NotizZettel_Woerter";

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
        localStorage.getItem(SPEICHER_GITHUB);

    if (!daten) {
        return;
    }

    try {
        const gespeichert =
            JSON.parse(daten);

        if (
            gespeichert &&
            typeof gespeichert === "object"
        ) {
            github.benutzer =
                gespeichert.benutzer || "";

            github.repository =
                gespeichert.repository || "";

            github.token =
                gespeichert.token || "";
        }

    } catch (fehler) {
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
        JSON.stringify(github)
    );
}

// ============================================================
// GITHUB-DATEN VORHANDEN?
// ============================================================

function githubVorhanden() {
    return (
        github.benutzer !== "" &&
        github.repository !== "" &&
        github.token !== ""
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

    const geschlossen =
        bereich.style.display === "none" ||
        bereich.style.display === "";

    if (geschlossen) {
        bereich.style.display = "block";

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
        bereich.style.display = "none";
    }
}

// ============================================================
// BASE64 AUS GITHUB IN TEXT UMWANDELN
// ============================================================

function textAusGitHubDekodieren(base64) {
    const binaer =
        atob(
            String(
                base64 || ""
            ).replace(/\s/g, "")
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
    ).decode(bytes);
}

// ============================================================
// TEXT FÜR GITHUB IN BASE64 UMWANDELN
// ============================================================

function textFuerGitHubKodieren(text) {
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

    return btoa(binaer);
}

// ============================================================
// GITHUB-ADRESSE ERSTELLEN
// ============================================================

function githubDateiAdresse() {
    return (
        "https://api.github.com/repos/" +
        encodeURIComponent(
            github.benutzer
        ) +
        "/" +
        encodeURIComponent(
            github.repository
        ) +
        "/contents/Daten.json"
    );
}

// ============================================================
// DATEN VON GITHUB LESEN
// ============================================================

async function githubDateiLesen() {
    if (!githubVorhanden()) {
        return null;
    }

    try {
        const antwort =
            await fetch(
                githubDateiAdresse(),
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

        if (!antwort.ok) {
            throw new Error(
                "GitHub meldet HTTP " +
                antwort.status
            );
        }

        const datei =
            await antwort.json();

        const text =
            textAusGitHubDekodieren(
                datei.content
            );

        let daten;

        try {
            daten =
                JSON.parse(text);
        } catch (fehler) {
            throw new Error(
                "Daten.json enthält ungültige Daten."
            );
        }

        if (
            !daten ||
            typeof daten !== "object"
        ) {
            daten = {};
        }

        return {
            sha: datei.sha,
            daten: daten
        };

    } catch (fehler) {
        alert(
            "GitHub konnte die Daten nicht lesen.\n\n" +
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
        return false;
    }

    const text =
        JSON.stringify(
            daten,
            null,
            2
        );

    const inhalt = {
        message:
            "NotizZettel Synchronisation",

        content:
            textFuerGitHubKodieren(
                text
            )
    };

    if (sha) {
        inhalt.sha = sha;
    }

    try {
        const antwort =
            await fetch(
                githubDateiAdresse(),
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

        if (!antwort.ok) {
            const fehlertext =
                await antwort.text();

            throw new Error(
                "HTTP " +
                antwort.status +
                "\n\n" +
                fehlertext
            );
        }

        return true;

    } catch (fehler) {
        alert(
            "GitHub konnte die Daten nicht speichern.\n\n" +
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
    const schluessel = new Map();

    function hinzufuegen(eintrag) {
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

        const key =
            text.toLowerCase();

        if (!schluessel.has(key)) {
            const neuerEintrag = {
                text: text,

                haendler:
                    typeof eintrag.haendler ===
                    "string"
                        ? eintrag.haendler
                        : "",

                erledigt:
                    eintrag.erledigt === true
            };

            schluessel.set(
                key,
                ergebnis.length
            );

            ergebnis.push(
                neuerEintrag
            );

            return;
        }

        const position =
            schluessel.get(key);

        const vorhanden =
            ergebnis[position];

        if (!vorhanden) {
            return;
        }

        if (eintrag.erledigt === true) {
            vorhanden.erledigt = true;
        }

        if (
            vorhanden.haendler === "" &&
            typeof eintrag.haendler === "string" &&
            eintrag.haendler.trim() !== ""
        ) {
            vorhanden.haendler =
                eintrag.haendler;
        }
    }

    if (Array.isArray(lokaleNotizen)) {
        lokaleNotizen.forEach(hinzufuegen);
    }

    if (Array.isArray(githubNotizen)) {
        githubNotizen.forEach(hinzufuegen);
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
    const vorhanden = new Set();

    function hinzufuegen(wort) {
        if (typeof wort !== "string") {
            return;
        }

        const text =
            wort.trim();

        if (text === "") {
            return;
        }

        const key =
            text.toLowerCase();

        if (vorhanden.has(key)) {
            return;
        }

        vorhanden.add(key);
        ergebnis.push(text);
    }

    if (Array.isArray(lokaleWoerter)) {
        lokaleWoerter.forEach(hinzufuegen);
    }

    if (Array.isArray(githubWoerter)) {
        githubWoerter.forEach(hinzufuegen);
    }

    ergebnis.sort(
        (a, b) =>
            a.localeCompare(
                b,
                "de"
            )
    );

    return ergebnis;
}

// ============================================================
// LOKALE DATEN ERSTELLEN
// ============================================================

function lokaleDatenErstellen() {
    let lokaleWoerter = [];

    try {
        const gespeichert =
            localStorage.getItem(
                SPEICHER_WOERTER
            );

        if (gespeichert) {
            const geladen =
                JSON.parse(
                    gespeichert
                );

            if (Array.isArray(geladen)) {
                lokaleWoerter =
                    geladen;
            }
        }

    } catch (fehler) {
        lokaleWoerter = [];
    }

    if (
        typeof woerter !== "undefined" &&
        Array.isArray(woerter)
    ) {
        lokaleWoerter =
            woerter;
    }

    return {
        notizen:
            Array.isArray(notizen)
                ? notizen
                : [],

        woerter:
            lokaleWoerter
    };
}

// ============================================================
// DATEN LOKAL ÜBERNEHMEN
// ============================================================

function lokaleDatenUebernehmen(daten) {
    if (
        !daten ||
        typeof daten !== "object"
    ) {
        return;
    }

    notizen =
        Array.isArray(daten.notizen)
            ? daten.notizen
            : [];

    if (
        typeof woerter !== "undefined"
    ) {
        woerter =
            Array.isArray(daten.woerter)
                ? daten.woerter
                : [];
    }

    localStorage.setItem(
        SPEICHER_NOTIZEN,
        JSON.stringify(notizen)
    );

    localStorage.setItem(
        SPEICHER_WOERTER,
        JSON.stringify(
            Array.isArray(daten.woerter)
                ? daten.woerter
                : []
        )
    );

    if (
        typeof speichern === "function"
    ) {
        speichern();
    }
}

// ============================================================
// LOKALE UND GITHUB-DATEN ZUSAMMENFÜHREN
// ============================================================

function zusammenfuehren(
    lokaleDaten,
    githubDaten
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
// SYNCHRONISIERUNG
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

    if (!gespeichert) {
        return false;
    }

    lokaleDatenUebernehmen(
        gemeinsameDaten
    );

    if (
        typeof anzeigen === "function"
    ) {
        anzeigen();
    }

    return true;
}

// ============================================================
// GITHUB-BEREICH UND SCHALTFLÄCHEN VERBINDEN
// ============================================================

function synchronisierungStarten() {
    githubLaden();

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
            githubBereichUmschalten
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
            function () {
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

                githubSpeichern(
                    benutzer
                        ? benutzer.value
                        : "",

                    repository
                        ? repository.value
                        : "",

                    token
                        ? token.value
                        : ""
                );

                alert(
                    "GitHub-Zugangsdaten gespeichert."
                );
            }
        );
    }
}

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        synchronisierungStarten
    );
} else {
    synchronisierungStarten();
}
