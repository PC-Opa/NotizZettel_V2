document.addEventListener("DOMContentLoaded", function () {

    githubLaden();

    notizenStarten();

    const btnGitHub = document.getElementById("BtnGitHub");

    if (btnGitHub) {

        btnGitHub.addEventListener(
            "click",
            githubBereichUmschalten
        );

        btnGitHub.addEventListener(
            "dblclick",
            async function () {

                const daten = await githubDateiLesen();

                if (daten) {

                    console.log(daten);

                    alert("Verbindung zu GitHub erfolgreich.");

                }

            }
        );

    }


    const btnSync = document.getElementById("BtnSync");

    if (btnSync) {

        btnSync.addEventListener(
            "click",
            async function () {

                await synchronisieren();

            }
        );

    }

});
