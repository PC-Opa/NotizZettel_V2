document.addEventListener("DOMContentLoaded", function () {

    githubLaden();

    notizenStarten();

    document
        .getElementById("BtnGitHub")
        .addEventListener("click", githubBereichUmschalten);

    document
        .getElementById("BtnGitSpeichern")
        .addEventListener("click", function () {

            githubSpeichern(

                document.getElementById("GitBenutzer").value,
                document.getElementById("GitRepository").value,
                document.getElementById("GitToken").value

            );

            alert("GitHub-Zugangsdaten gespeichert.");

        });

    document
        .getElementById("BtnGitHub")
        .addEventListener("dblclick", async function () {

            const daten = await githubDateiLesen();

            if (daten) {

                console.log(daten);

                alert("Verbindung zu GitHub erfolgreich.");

            }

        });

    document
        .getElementById("BtnSync")
        .addEventListener("click", async function () {

            await synchronisieren();

        });

});
