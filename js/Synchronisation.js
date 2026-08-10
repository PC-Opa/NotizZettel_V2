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
            github = { benutzer: "", repository: "", token: "" };
        }
    }
}

function githubSpeichern(benutzer, repository, token) {
    github.benutzer = (benutzer || "").trim();
    github.repository = (repository || "").trim();
    github.token = (token || "").trim();

    localStorage.setItem(SPEICHER_GITHUB, JSON.stringify(github));
}

function githubVorhanden() {
    // Sicherstellen, dass die Werte existieren, bevor .trim() aufgerufen wird
    return (
        typeof github.benutzer === "string" && github.benutzer.trim() !== "" &&
        typeof github.repository === "string" && github.repository.trim() !== "" &&
        typeof github.token === "string" && github.token.trim() !== ""
    );
}

// ============================================================
// GITHUB-BEREICH
// ============================================================

function githubBereichUmschalten() {
    const bereich = document.getElementById("GitHubBereich");
    if (!bereich) return;

    if (bereich.style.display === "none" || bereich.style.display === "") {
        bereich.style.display = "block";
        
        const benutzerElem = document.getElementById("GitBenutzer");
        const repoElem = document.getElementById("GitRepository");
        const tokenElem = document.getElementById("GitToken");

        if (benutzerElem) benutzerElem.value = github.benutzer;
        if (repoElem) repoElem.value = github.repository;
        if (tokenElem) tokenElem.value = github.token;
    } else {
        bereich.style.display = "none";
    }
}

// ============================================================
// TEXT FÜR GITHUB KODIEREN (Sicher für Umlaute/Emojis)
// ============================================================

function textFuerGitHubKodieren(text) {
    const daten = new TextEncoder().encode(text);
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
    const binaer = atob(text.replace(/\s/g, ""));
    const daten = new Uint8Array(binaer.length);
    for (let i = 0; i < binaer.length; i++) {
        daten[i] = binaer.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(daten);
}

// ============================================================
// DATEN.JSON VON GITHUB LESEN
// ============================================================

async function githubDateiLesen() {
    if (!githubVorhanden()) {
        alert("Bitte zuerst die GitHub-Zugangsdaten speichern.");
        return null;
    }

    const url = `https://github.com{github.benutzer}/${github.repository}/contents/Daten.json`;

    try {
        const antwort = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + github.token,
                "Accept": "application/vnd.github.v3+json", // Version v3 explizit hinzugefügt
                "X-GitHub-Api-Version": "2022-11-28"       // Aktueller GitHub API Standard
            }
        });

        if (!antwort.ok) {
            const fehler = await antwort.text();
            alert(`GitHub konnte Daten.json nicht lesen.\n\nHTTP: ${antwort.status}\n\n${fehler}`);
            return null;
        }

        const daten = await antwort.json();
        const text = textAusGitHubDekodieren(daten.content);
        const inhalt = JSON.parse(text);

        return {
            sha: daten.sha,
            daten: inhalt
        };
    } catch (fehler) {
        alert("Fehler beim Lesen von GitHub:\n\n" + fehler.message);
        return null;
    }
}

// ============================================================
// DATEN.JSON NACH GITHUB SCHREIBEN
// ============================================================

async function githubDateiSpeichern(inhalt, sha) {
    if (!githubVorhanden()) {
        alert("Bitte zuerst die GitHub-Zugangsdaten speichern.");
        return false;
    }

    const url = `https://github.com{github.benutzer}/${github.repository}/contents/Daten.json`;
    const text = JSON.stringify(inhalt, null, 2);

    try {
        const bodyDaten = {
            message: "NotizZettel Synchronisation",
            content: textFuerGitHubKodieren(text)
        };

        // SHA wird nur benötigt, wenn die Datei bereits existiert (Update)
        if (sha) {
            bodyDaten.sha = sha;
        }

        const antwort = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + github.token,
                "Accept": "application/vnd.github.v3+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyDaten)
        });

        if (!antwort.ok) {
            const fehler = await antwort.text();
            alert(`GitHub konnte Daten.json nicht speichern.\n\nHTTP: ${antwort.status}\n\n${fehler}`);
            return false;
        }

        return true;
    } catch (fehler) {
        alert("Fehler beim Speichern auf GitHub:\n\n" + fehler.message);
        return false;
    }
}

// ============================================================
// NOTIZ-SCHLÜSSEL
// ============================================================

function notizSchluessel(eintrag) {
    if (!eintrag || typeof eintrag.text !== "string") {
        return "";
    }
    return eintrag.text.trim().toLowerCase();
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
        if (!eintrag || typeof eintrag.text !== "string") {
            return;
        }

        const text = eintrag.text.trim();
        if (text === "") return;

        const schluessel = text.toLowerCase();
        if (vorhanden.has(schluessel)) return;

        vorhanden.add(schluessel);
        ergebnis.push({
            text: text,
            erledigt: eintrag.erledigt === true
        });
    });

    return ergebnis;
}

// ============================================================
// LETZTEN SYNCHRONISATIONSSTAND LADEN (Vervollständigt)
// ============================================================

function syncStandLaden() {
    const daten = localStorage.getItem(SPEICHER_SYNC_STAND);
    if (!daten) {
        return null;
    }

    try {
        return JSON.parse(daten);
    } catch (fehler) {
        return null;
    }
}
