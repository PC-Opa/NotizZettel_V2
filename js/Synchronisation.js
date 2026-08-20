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

// UTF-8 sichere Base64-Kodierung (Wichtig für Ä, Ö, Ü, ß)
function githubTextKodieren(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

// UTF-8 sichere Base64-Dekodierung
function githubTextDekodieren(base64) {
    // GitHub liefert manchmal Zeilenumbrüche im Base64-String, diese werden hier entfernt
    const bereinigtesBase64 = base64.replace(/\s/g, '');
    return decodeURIComponent(escape(atob(bereinigtesBase64)));
}

function synchronisationStarten() {
    githubDatenLaden();

    const benutzer = document.getElementById("GitBenutzer");
    const repository = document.getElementById("GitRepository");
    const token = document.getElementById("GitToken");

    if (benutzer) { benutzer.value = github.benutzer; }
    if (repository) { repository.value = github.repository; }
    if (token) { token.value = github.token; }

    const btnGitHub = document.getElementById("BtnGitHub");
    const btnSync = document.getElementById("BtnSync");
    const btnGitSpeichern = document.getElementById("BtnGitSpeichern");

    if (btnGitHub) { btnGitHub.addEventListener("click", githubBereichAnzeigen); }
    if (btnSync) { btnSync.addEventListener("click", synchronisieren); }
    if (btnGitSpeichern) { btnGitSpeichern.addEventListener("click", githubDatenSpeichern); }
}

function githubBereichAnzeigen() {
    const bereich = document.getElementById("GitHubBereich");
    if (!bereich) return;

    if (bereich.style.display === "none" || bereich.style.display === "") {
        bereich.style.display = "block";
    } else {
        bereich.style.display = "none";
    }
}

function githubDatenSpeichern() {
    const benutzer = document.getElementById("GitBenutzer");
    const repository = document.getElementById("GitRepository");
    const token = document.getElementById("GitToken");

    const neuerBenutzer = benutzer ? benutzer.value.trim() : "";
    const neuesRepository = repository ? repository.value.trim() : "";
    const neuesToken = token ? token.value.trim() : "";

    if (neuerBenutzer === "" || neuesRepository === "" || neuesToken === "") {
        alert("Bitte GitHub-Benutzer, Repository und Token eingeben.");
        return;
    }

    github.benutzer = neuerBenutzer;
    github.repository = neuesRepository;
    github.token = neuesToken;

    githubDatenSpeichernLokal();
    alert("GitHub-Zugangsdaten gespeichert.");
}

function githubDatenSpeichernLokal() {
    localStorage.setItem(SPEICHER_GITHUB, JSON.stringify(github));
}

function githubDatenLaden() {
    const gespeichert = localStorage.getItem(SPEICHER_GITHUB);
    if (!gespeichert) return;

    try {
        const daten = JSON.parse(gespeichert);
        if (daten && typeof daten === "object") {
            github.benutzer = daten.benutzer || GITHUB_BENUTZER;
            github.repository = daten.repository || GITHUB_REPOSITORY;
            github.token = daten.token || "";
        }
    } catch (fehler) {
        github = { benutzer: GITHUB_BENUTZER, repository: GITHUB_REPOSITORY, token: "" };
    }
}

function githubVorhanden() {
    return github.benutzer !== "" && github.repository !== "" && github.token !== "";
}

function githubAdresse() {
    return GITHUB_API + "/repos/" + encodeURIComponent(github.benutzer) + "/" + encodeURIComponent(github.repository) + "/contents/" + GITHUB_DATEI;
}

async function githubDateiLesen() {
    if (!githubVorhanden()) {
        alert("Bitte zuerst die GitHub-Zugangsdaten保存.");
        return null;
    }

    try {
        const antwort = await fetch(githubAdresse(), {
            method: "GET",
            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": "Bearer " + github.token,
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });

        if (antwort.status === 404) {
            return {
                sha: null,
                daten: { notizen: [], woerter: [], geloeschteNotizen: [] }
            };
        }

        if (!antwort.ok) {
            const fehler = await antwort.text();
            alert("GitHub konnte Daten.json nicht lesen.\n\nHTTP: " + antwort.status + "\n\n" + fehler);
            return null;
        }

        const githubDatei = await antwort.json();
        const text = githubTextDekodieren(githubDatei.content);

        let daten;
        try {
            daten = JSON.parse(text);
        } catch (fehler) {
            daten = { notizen: [], woerter: [], geloeschteNotizen: [] };
        }

        return {
            sha: githubDatei.sha || null,
            daten: daten
        };

    } catch (fehler) {
        alert("Fehler beim Lesen von GitHub:\n\n" + fehler.message);
        return null;
    }
}

async function githubDateiSpeichern(daten, sha) {
    if (!githubVorhanden()) {
        alert("Bitte zuerst die GitHub-Zugangsdaten speichern.");
        return false;
    }

    try {
        const text = JSON.stringify(daten, null, 2);
        const body = {
            message: "NotizZettel Synchronisation",
            content: githubTextKodieren(text)
        };

        if (sha) {
            body.sha = sha;
        }

        const antwort = await fetch(githubAdresse(), {
            method: "PUT",
            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": "Bearer " + github.token,
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28"
            },
            body: JSON.stringify(body)
        });

        if (!antwort.ok) {
            const fehler = await antwort.text();
            alert("Fehler beim Speichern auf GitHub.\n\nHTTP: " + antwort.status + "\n\n" + fehler);
            return false;
        }

        alert("Erfolgreich auf GitHub gespeichert!");
        return true;

    } catch (fehler) {
        alert("Fehler beim Schreiben auf GitHub:\n\n" + fehler.message);
        return false;
    }
}
