const SPEICHER_WOERTER = "NotizZettel_Woerter";

let woerter = [];

function woerterLaden() {

    const daten = localStorage.getItem(SPEICHER_WOERTER);

    if (daten) {

        woerter = JSON.parse(daten);

    } else {

        woerter = [];

    }

}

function woerterSpeichern() {

    localStorage.setItem(
        SPEICHER_WOERTER,
        JSON.stringify(woerter)
    );

}

function wortMerken(text) {

    const teile = text.split(/\s+/);

    teile.forEach(function (wort) {

        wort = wort
            .replace(/[.,;:!?()"']/g, "")
            .trim();

        if (wort === "") return;

        const vorhanden = woerter.some(function (eintrag) {

            return eintrag.toLowerCase() === wort.toLowerCase();

        });

        if (!vorhanden) {

            woerter.push(wort);

        }

    });

    woerter.sort(function (a, b) {

        return a.localeCompare(b, "de");

    });

    woerterSpeichern();

}

function sucheWoerter(text) {

    text = text.trim().toLowerCase();

    if (text === "") {

        return [];

    }

    return woerter
        .filter(function (wort) {

            return wort.toLowerCase().startsWith(text);

        })
        .slice(0, 5);

}

function vorschlaegeLoeschen() {

    document.getElementById("VorschlagBereich").innerHTML = "";

}