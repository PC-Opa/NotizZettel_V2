// ============================================================
// NotizZettel V2
// SYNCHRONISIERUNG
// Smartphone ↔ GitHub ↔ Laptop
// ============================================================

const SPEICHER_GITHUB = "NotizZettel_GitHub";
const SPEICHER_NOTIZEN = "NotizZettel_V2";
const SPEICHER_GELOESCHT = "NotizZettel_Geloescht";
const SPEICHER_WOERTER = "NotizZettel_Woerter";

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

    if (!daten) {
        return;
    }

    try {
        const gespeichert = JSON.parse(daten);

        if (gespeichert && typeof gespeichert === "object") {
            github.benutzer =
                String(gespeichert.benutzer || "").trim();

            github.repository =
                String(gespeichert.repository || "").trim();

            github.token =
                String(gespeichert.token || "").trim();
        }
    } catch (fehler) {
        github = {
            benutzer: "",
            repository: "",
            token: ""
        };
    }
}

function githubSpeichern(benutzer, repository, token) {
    github = {
        benutzer: String(benutzer || "").trim(),
        repository: String(repository || "").trim(),
        token: String(token || "").trim()
    };

    localStorage.setItem(
        SPEICHER_GITHUB,
        JSON.stringify(github)
    );
}

function githubVorhanden() {
    return (
        github.benutzer !== "" &&
        github.repository !== "" &&
        github.token !== ""
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

    const geschlossen =
        bereich.style.display === "none" ||
        bereich.style.display === "";

    bereich.style.display =
        geschlossen ? "block" : "none";

    if (!geschlossen) {
        return;
    }

    const benutzer =
        document.getElementById("GitBenutzer");

    const repository =
        document.getElementById("GitRepository");

    const token =
        document.getElementById("GitToken");

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
}

function githubZugangSpeichern() {
    const benutzer =
        document.getElementById("GitBenutzer");

    const repository =
        document.getElementById("GitRepository");

    const token =
        document.getElementById("GitToken");

    githubSpeichern(
        benutzer ? benutzer.value : "",
        repository ? repository.value : "",
        token ? token.value : ""
    );
}

// ============================================================
// GITHUB-DATEI
// ============================================================

function githubDateiAdresse() {
    return (
        "https://api.github.com/repos/" +
        encodeURIComponent(github.benutzer) +
        "/" +
        encodeURIComponent(github.repository) +
        "/contents/Daten.json"
    );
}

function textFuerGitHubKodieren(text) {
    const bytes =
        new TextEncoder().encode(
            String(text || "")
        );

    let binaer = "";

    for (let i = 0; i < bytes.length; i++) {
        binaer +=
            String.fromCharCode(bytes[i]);
    }

    return btoa(binaer);
}

function textAusGitHubDekodieren(base64) {
    const binaer =
        atob(
            String(base64 || "")
                .replace(/\s/g, "")
        );

    const bytes =
        new Uint8Array(
            binaer.length
        );

    for (let i = 0; i < binaer.length; i++) {
        bytes[i] =
            binaer.charCodeAt(i);
    }

    return new TextDecoder("utf-8")
        .decode(bytes);
}

// ============================================================
// GITHUB DATEN LESEN
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

        if (antwort.status === 404) {
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
            throw new Error(
                "GitHub HTTP " +
                antwort.status
            );
        }

        const datei =
            await antwort.json();

        const text =
            textAusGitHubDekodieren(
                datei.content
            );

        const daten =
            JSON.parse(text);

        return {
            sha: datei.sha,
            daten: normalisiereDaten(daten)
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
        return false;
    }

    const inhalt = {
        message:
            "NotizZettel Synchronisation",

        content:
            textFuerGitHubKodieren(
                JSON.stringify(
                    daten,
                    null,
                    2
                )
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
            throw new Error(
                "GitHub HTTP " +
                antwort.status
            );
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
// DATEN NORMALISIEREN
// ============================================================

function normalisiereDaten(daten) {
    if (
        !daten ||
        typeof daten !== "object"
    ) {
        daten = {};
    }

    return {
        notizen:
            Array.isArray(daten.notizen)
                ? daten.notizen
                : [],

        woerter:
            Array.isArray(daten.woerter)
                ? daten.woerter
                : [],

        geloeschteNotizen:
            Array.isArray(
                daten.geloeschteNotizen
            )
                ? daten.geloeschteNotizen
                : []
    };
}

// ============================================================
// LOKALE DATEN LESEN
// ============================================================

function lokaleDatenLesen() {
    let notizenLokal = [];
    let woerterLokal = [];
    let geloeschteLokal = [];

    try {
        const daten =
            localStorage.getItem(
                SPEICHER_NOTIZEN
            );

        if (daten) {
            const geladen =
                JSON.parse(daten);

            if (Array.isArray(geladen)) {
                notizenLokal = geladen;
            }
        }

    } catch (fehler) {
        notizenLokal = [];
    }

    try {
        const daten =
            localStorage.getItem(
                SPEICHER_WOERTER
            );

        if (daten) {
            const geladen =
                JSON.parse(daten);

            if (Array.isArray(geladen)) {
                woerterLokal = geladen;
            }
        }

    } catch (fehler) {
        woerterLokal = [];
    }

    try {
        const daten =
            localStorage.getItem(
                SPEICHER_GELOESCHT
            );

        if (daten) {
            const geladen =
                JSON.parse(daten);

            if (Array.isArray(geladen)) {
                geloeschteLokal = geladen;
            }
        }

    } catch (fehler) {
        geloeschteLokal = [];
    }

    if (
        typeof woerter !== "undefined" &&
        Array.isArray(woerter)
    ) {
        woerterLokal = woerter;
    }

    return {
        notizen: notizenLokal,
        woerter: woerterLokal,
        geloeschteNotizen: geloeschteLokal
    };
}

// ============================================================
// SCHLÜSSEL FÜR NOTIZ
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
// GELÖSCHTE NOTIZEN
// ============================================================

function geloeschteSchluessel(liste) {
    const ergebnis =
        new Set();

    if (!Array.isArray(liste)) {
        return ergebnis;
    }

    liste.forEach(
        function (eintrag) {
            if (typeof eintrag === "string") {
                const schluessel =
                    eintrag
                        .trim()
                        .toLowerCase();

                if (schluessel !== "") {
                    ergebnis.add(
                        schluessel
                    );
                }
            }
        }
    );

    return ergebnis;
}

// ============================================================
// NOTIZEN ZUSAMMENFÜHREN
// ============================================================

function notizenZusammenfuehren(
    lokaleNotizen,
    githubNotizen,
    geloeschte
) {
    const ergebnis = [];
    const positionen = new Map();

    function uebernehmen(eintrag) {
        const schluessel =
            notizSchluessel(
                eintrag
            );

        if (schluessel === "") {
            return;
        }

        if (geloeschte.has(schluessel)) {
            return;
        }

        if (!positionen.has(schluessel)) {
            const neu = {
                text:
                    eintrag.text.trim(),

                haendler:
                    typeof eintrag.haendler === "string"
                        ? eintrag.haendler
                        : "",

                erledigt:
                    eintrag.erledigt === true
            };

            positionen.set(
                schluessel,
                ergebnis.length
            );

            ergebnis.push(neu);

            return;
        }

        const vorhandene =
            ergebnis[
                positionen.get(schluessel)
            ];

        if (eintrag.erledigt === true) {
            vorhandene.erledigt = true;
        }

        if (
            vorhandene.haendler === "" &&
            typeof eintrag.haendler === "string" &&
            eintrag.haendler.trim() !== ""
        ) {
            vorhandene.haendler =
                eintrag.haendler;
        }
    }

    if (Array.isArray(lokaleNotizen)) {
        lokaleNotizen.forEach(
            uebernehmen
        );
    }

    if (Array.isArray(githubNotizen)) {
        githubNotizen.forEach(
            uebernehmen
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
    const vorhanden = new Set();

    function uebernehmen(wort) {
        if (typeof wort !== "string") {
            return;
        }

        const text =
            wort.trim();

        if (text === "") {
            return;
        }

        const schluessel =
            text.toLowerCase();

        if (vorhanden.has(schluessel)) {
            return;
        }

        vorhanden.add(
            schluessel
        );

        ergebnis.push(
            text
        );
    }

    if (Array.isArray(lokaleWoerter)) {
        lokaleWoerter.forEach(
            uebernehmen
        );
    }

    if (Array.isArray(githubWoerter)) {
        githubWoerter.forEach(
            uebernehmen
        );
    }

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
// GESAMTE DATEN ZUSAMMENFÜHREN
// ============================================================

function datenZusammenfuehren(
    lokal,
    entfernt
) {
    const lokaleLoeschungen =
        geloeschteSchluessel(
            lokal.geloeschteNotizen
        );

    const entfernteLoeschungen =
        geloeschteSchluessel(
            entfernt.geloeschteNotizen
        );

    const alleLoeschungen =
        new Set([
            ...lokaleLoeschungen,
            ...entfernteLoeschungen
        ]);

    return {
        notizen:
            notizenZusammenfuehren(
                lokal.notizen,
                entfernt.notizen,
                alleLoeschungen
            ),

        woerter:
            woerterZusammenfuehren(
                lokal.woerter,
                entfernt.woerter
            ),

        geloeschteNotizen:
            [...alleLoeschungen]
    };
}

// ============================================================
// LOKALE DATEN SPEICHERN
// ============================================================

function lokaleDatenSpeichern(daten) {
    localStorage.setItem(
        SPEICHER_NOTIZEN,
        JSON.stringify(
            daten.notizen
        )
    );

    localStorage.setItem(
        SPEICHER_WOERTER,
        JSON.stringify(
            daten.woerter
        )
    );

    localStorage.setItem(
        SPEICHER_GELOESCHT,
        JSON.stringify(
            daten.geloeschteNotizen
        )
    );

    if (
        typeof notizen !== "undefined"
    ) {
        notizen =
            daten.notizen;
    }

    if (
        typeof woerter !== "undefined"
    ) {
        woerter =
            daten.woerter;
    }

    if (
        typeof anzeigen === "function"
    ) {
        anzeigen();
    }
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

    const lokal =
        lokaleDatenLesen();

    const entfernt =
        await githubDateiLesen();

    if (!entfernt) {
        return false;
    }

    const gemeinsam =
        datenZusammenfuehren(
            lokal,
            entfernt.daten
        );

    const gespeichert =
        await githubDateiSpeichern(
            gemeinsam,
            entfernt.sha
        );

    if (!gespeichert) {
        return false;
    }

    lokaleDatenSpeichern(
        gemeinsam
    );

    return true;
}

// ============================================================
// SCHALTFLÄCHEN
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
            async function () {
                const erfolgreich =
                    await synchronisieren();

                if (erfolgreich) {
                    alert(
                        "Synchronisierung erfolgreich."
                    );
                }
            }
        );
    }

    if (btnGitSpeichern) {
        btnGitSpeichern.addEventListener(
            "click",
            githubZugangSpeichern
        );
    }
}

// ============================================================
// START
// ============================================================

if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        synchronisierungStarten
    );
} else {
    synchronisierungStarten();
}
