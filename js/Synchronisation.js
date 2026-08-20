// ============================================================
// NotizZettel V2
// SYNCHRONISATION
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
            github.benutzer = String(gespeichert.benutzer || "").trim();
            github.repository = String(gespeichert.repository || "").trim();
            github.token = String(gespeichert.token || "").trim();
        }
    } catch (fehler) {
        github = {
            benutzer: "",
            repository: "",
            token: ""
        };
    }
}

function githubSpeichern() {
    const benutzer = document.getElementById("GitBenutzer");
    const repository = document.getElementById("GitRepository");
    const token = document.getElementById("GitToken");

    github = {
        benutzer: benutzer ? benutzer.value.trim() : "",
        repository: repository ? repository.value.trim() : "",
        token: token ? token.value.trim() : ""
    };

    localStorage.setItem(
        SPEICHER_GITHUB,
        JSON.stringify(github)
    );

    const bereich = document.getElementById("GitHubBereich");

    if (bereich) {
        bereich.style.display = "none";
    }

    alert("GitHub-Zugangsdaten gespeichert.");
}

// ============================================================
// GITHUB-BEREICH ÖFFNEN / SCHLIESSEN
// ============================================================

function githubBereichUmschalten() {
    const bereich = document.getElementById("GitHubBereich");

    if (!bereich) {
        return;
    }

    const geschlossen =
        bereich.style.display === "none" ||
        bereich.style.display === "";

    if (geschlossen) {
        const benutzer = document.getElementById("GitBenutzer");
        const repository = document.getElementById("GitRepository");
        const token = document.getElementById("GitToken");

        if (benutzer) {
            benutzer.value = github.benutzer;
        }

        if (repository) {
            repository.value = github.repository;
        }

        if (token) {
            token.value = github.token;
        }

        bereich.style.display = "block";
    } else {
        bereich.style.display = "none";
    }
}

// ============================================================
// GITHUB PRÜFEN
// ============================================================

function githubVorhanden() {
    return (
        github.benutzer !== "" &&
        github.repository !== "" &&
        github.token !== ""
    );
}

function githubAdresse() {
    return (
        "https://api.github.com/repos/" +
        encodeURIComponent(github.benutzer) +
        "/" +
        encodeURIComponent(github.repository) +
        "/contents/Daten.json"
    );
}

// ============================================================
// TEXT / BASE64
// ============================================================

function textZuBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binaer = "";

    for (let i = 0; i < bytes.length; i++) {
        binaer += String.fromCharCode(bytes[i]);
    }

    return btoa(binaer);
}

function base64ZuText(base64) {
    const binaer = atob(
        String(base64 || "").replace(/\s/g, "")
    );

    const bytes = new Uint8Array(binaer.length);

    for (let i = 0; i < binaer.length; i++) {
        bytes[i] = binaer.charCodeAt(i);
    }

    return new TextDecoder("utf-8").decode(bytes);
}

// ============================================================
// LOKALE DATEN LESEN
// ============================================================

function lokaleDatenLesen() {
    let notizenLokal = [];
    let geloeschteLokal = [];
    let woerterLokal = [];

    try {
        const daten =
            localStorage.getItem(SPEICHER_NOTIZEN);

        if (daten) {
            const geladen = JSON.parse(daten);

            if (Array.isArray(geladen)) {
                notizenLokal = geladen;
            }
        }
    } catch (fehler) {
        notizenLokal = [];
    }

    try {
        const daten =
            localStorage.getItem(SPEICHER_GELOESCHT);

        if (daten) {
            const geladen = JSON.parse(daten);

            if (Array.isArray(geladen)) {
                geloeschteLokal = geladen;
            }
        }
    } catch (fehler) {
        geloeschteLokal = [];
    }

    try {
        const daten =
            localStorage.getItem(SPEICHER_WOERTER);

        if (daten) {
            const geladen = JSON.parse(daten);

            if (Array.isArray(geladen)) {
                woerterLokal = geladen;
            }
        }
    } catch (fehler) {
        woerterLokal = [];
    }

    if (
        typeof woerter !== "undefined" &&
        Array.isArray(woerter)
    ) {
        woerterLokal = woerter;
    }

    return {
        notizen: notizenLokal,
        geloeschteNotizen: geloeschteLokal,
        woerter: woerterLokal
    };
}

// ============================================================
// LOKALE DATEN SPEICHERN
// ============================================================

function lokaleDatenSpeichern(daten) {
    localStorage.setItem(
        SPEICHER_NOTIZEN,
        JSON.stringify(daten.notizen)
    );

    localStorage.setItem(
        SPEICHER_GELOESCHT,
        JSON.stringify(daten.geloeschteNotizen)
    );

    localStorage.setItem(
        SPEICHER_WOERTER,
        JSON.stringify(daten.woerter)
    );

    if (typeof notizen !== "undefined") {
        notizen = daten.notizen;
    }

    if (typeof woerter !== "undefined") {
        woerter = daten.woerter;
    }

    if (typeof anzeigen === "function") {
        anzeigen();
    }
}

// ============================================================
// GITHUB DATEN LESEN
// ============================================================

async function githubDatenLesen() {
    const antwort = await fetch(
        githubAdresse(),
        {
            method: "GET",
            headers: {
                Authorization: "Bearer " + github.token,
                Accept: "application/vnd.github+json"
            }
        }
    );

    if (antwort.status === 404) {
        return {
            sha: null,
            daten: {
                notizen: [],
                geloeschteNotizen: [],
                woerter: []
            }
        };
    }

    if (!antwort.ok) {
        throw new Error(
            "GitHub konnte Daten.json nicht lesen. HTTP " +
            antwort.status
        );
    }

    const datei = await antwort.json();

    const text = base64ZuText(datei.content);

    let daten;

    try {
        daten = JSON.parse(text);
    } catch (fehler) {
        throw new Error(
            "Daten.json enthält keine gültigen Daten."
        );
    }

    if (!daten || typeof daten !== "object") {
        daten = {};
    }

    return {
        sha: datei.sha,
        daten: {
            notizen:
                Array.isArray(daten.notizen)
                    ? daten.notizen
                    : [],

            geloeschteNotizen:
                Array.isArray(daten.geloeschteNotizen)
                    ? daten.geloeschteNotizen
                    : [],

            woerter:
                Array.isArray(daten.woerter)
                    ? daten.woerter
                    : []
        }
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

    return eintrag.text.trim().toLowerCase();
}

// ============================================================
// GELÖSCHTE NOTIZEN
// ============================================================

function loeschungenZusammenfuehren(
    lokal,
    entfernt
) {
    const ergebnis = new Set();

    function uebernehmen(liste) {
        if (!Array.isArray(liste)) {
            return;
        }

        liste.forEach(function (eintrag) {
            if (typeof eintrag !== "string") {
                return;
            }

            const schluessel =
                eintrag.trim().toLowerCase();

            if (schluessel !== "") {
                ergebnis.add(schluessel);
            }
        });
    }

    uebernehmen(lokal);
    uebernehmen(entfernt);

    return [...ergebnis];
}

// ============================================================
// NOTIZEN ZUSAMMENFÜHREN
// ============================================================

function notizenZusammenfuehren(
    lokal,
    entfernt,
    geloeschte
) {
    const ergebnis = [];
    const positionen = new Map();
    const geloescht = new Set(geloeschte);

    function uebernehmen(eintrag) {
        const schluessel = notizSchluessel(eintrag);

        if (schluessel === "") {
            return;
        }

        if (geloescht.has(schluessel)) {
            return;
        }

        if (!positionen.has(schluessel)) {
            const neueNotiz = {
                text: eintrag.text.trim(),

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

            ergebnis.push(neueNotiz);

            return;
        }

        const vorhanden =
            ergebnis[positionen.get(schluessel)];

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

    if (Array.isArray(lokal)) {
        lokal.forEach(uebernehmen);
    }

    if (Array.isArray(entfernt)) {
        entfernt.forEach(uebernehmen);
    }

    return ergebnis;
}

// ============================================================
// WÖRTER ZUSAMMENFÜHREN
// ============================================================

function woerterZusammenfuehren(
    lokal,
    entfernt
) {
    const ergebnis = [];
    const vorhanden = new Set();

    function uebernehmen(wort) {
        if (typeof wort !== "string") {
            return;
        }

        const text = wort.trim();

        if (text === "") {
            return;
        }

        const schluessel = text.toLowerCase();

        if (vorhanden.has(schluessel)) {
            return;
        }

        vorhanden.add(schluessel);
        ergebnis.push(text);
    }

    if (Array.isArray(lokal)) {
        lokal.forEach(uebernehmen);
    }

    if (Array.isArray(entfernt)) {
        entfernt.forEach(uebernehmen);
    }

    ergebnis.sort(function (a, b) {
        return a.localeCompare(b, "de");
    });

    return ergebnis;
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

    try {
        const lokal =
            lokaleDatenLesen();

        const githubErgebnis =
            await githubDatenLesen();

        const gemeinsameLoeschungen =
            loeschungenZusammenfuehren(
                lokal.geloeschteNotizen,
                githubErgebnis.daten.geloeschteNotizen
            );

        const gemeinsameDaten = {
            notizen:
                notizenZusammenfuehren(
                    lokal.notizen,
                    githubErgebnis.daten.notizen,
                    gemeinsameLoeschungen
                ),

            geloeschteNotizen:
                gemeinsameLoeschungen,

            woerter:
                woerterZusammenfuehren(
                    lokal.woerter,
                    githubErgebnis.daten.woerter
                )
        };

        const inhalt = {
            message: "NotizZettel Synchronisation",

            content:
                textZuBase64(
                    JSON.stringify(
                        gemeinsameDaten,
                        null,
                        2
                    )
                )
        };

        if (githubErgebnis.sha) {
            inhalt.sha =
                githubErgebnis.sha;
        }

        const speichern =
            await fetch(
                githubAdresse(),
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

        if (!speichern.ok) {
            throw new Error(
                "GitHub konnte die zusammengeführten Daten nicht speichern. HTTP " +
                speichern.status
            );
        }

        lokaleDatenSpeichern(
            gemeinsameDaten
        );

        alert(
            "Synchronisierung erfolgreich."
        );

        return true;

    } catch (fehler) {
        alert(
            "Synchronisierung fehlgeschlagen:\n\n" +
            fehler.message
        );

        return false;
    }
}

// ============================================================
// SCHALTFLÄCHEN EINRICHTEN
// ============================================================

function synchronisierungStarten() {
    githubLaden();

    const btnGitHub =
        document.getElementById("BtnGitHub");

    const btnSync =
        document.getElementById("BtnSync");

    const btnGitSpeichern =
        document.getElementById("BtnGitSpeichern");

    if (btnGitHub) {
        btnGitHub.onclick =
            githubBereichUmschalten;
    }

    if (btnSync) {
        btnSync.onclick =
            synchronisieren;
    }

    if (btnGitSpeichern) {
        btnGitSpeichern.onclick =
            githubSpeichern;
    }
}

// ============================================================
// START
// ============================================================

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        synchronisierungStarten
    );
} else {
    synchronisierungStarten();
}
