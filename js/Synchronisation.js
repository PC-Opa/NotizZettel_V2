const SPEICHER_GITHUB = "NotizZettel_GitHub";

let github = {

    benutzer: "",
    repository: "",
    token: ""

};


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


function githubSpeichern(
    benutzer,
    repository,
    token
) {

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


function githubBereichUmschalten() {

    const bereich =
        document.getElementById(
            "GitHubBereich"
        );


    if (
        bereich.style.display === "none"
    ) {

        bereich.style.display =
            "block";


        document.getElementById(
            "GitBenutzer"
        ).value =
            github.benutzer;


        document.getElementById(
            "GitRepository"
        ).value =
            github.repository;


        document.getElementById(
            "GitToken"
        ).value =
            github.token;


    } else {

        bereich.style.display =
            "none";

    }

}


function textAusGitHubDekodieren(
    base64
) {

    const binaer =
        atob(
            base64.replace(
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
    ).decode(bytes);

}


function textFuerGitHubKodieren(
    text
) {

    const bytes =
        new TextEncoder().encode(
            text
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

                "\n" +

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

            sha:
                daten.sha,

            daten:
                inhalt

        };


    } catch (fehler) {

        alert(

            "Fehler beim Lesen von GitHub:\n\n" +

            fehler.message

        );


        return null;

    }

}


async function githubDateiSpeichern(
    inhalt,
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
                            "Bearer " +
                            github.token,

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

                            sha:
                                sha

                        })

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

                "\n" +

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


function notizenZusammenfuehren(
    lokaleNotizen,
    githubNotizen
) {

    const ergebnis = [];

    const positionen =
        new Map();


    const alleNotizen = [];


    if (
        Array.isArray(
            lokaleNotizen
        )
    ) {

        alleNotizen.push(
            ...lokaleNotizen
        );

    }


    if (
        Array.isArray(
            githubNotizen
        )
    ) {

        alleNotizen.push(
            ...githubNotizen
        );

    }


    alleNotizen.forEach(
        function (eintrag) {

            if (
                !eintrag ||
                typeof eintrag.text !== "string"
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


            } else {

                const position =
                    positionen.get(
                        schluessel
                    );


                if (
                    eintrag.erledigt === true
                ) {

                    ergebnis[
                        position
                    ].erledigt =
                        true;

                }

            }

        }
    );


    return ergebnis;

}


function woerterZusammenfuehren(
    lokaleWoerter,
    githubWoerter
) {

    const ergebnis = [];

    const vorhanden =
        new Set();


    const alleWoerter = [];


    if (
        Array.isArray(
            lokaleWoerter
        )
    ) {

        alleWoerter.push(
            ...lokaleWoerter
        );

    }


    if (
        Array.isArray(
            githubWoerter
        )
    ) {

        alleWoerter.push(
            ...githubWoerter
        );

    }


    alleWoerter.forEach(
        function (wort) {

            if (
                typeof wort !== "string"
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


function lokaleDatenErstellen() {

    return {

        notizen:
            Array.isArray(
                notizen
            )
                ? notizen
                : [],


        woerter:
            Array.isArray(
                woerter
            )
                ? woerter
                : []

    };

}


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
