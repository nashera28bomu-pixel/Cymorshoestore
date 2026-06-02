/* =========================================
   CYMOR SHOE STORE
   MAIN.JS (DIRECTOR FILE)
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    bootSequence();

});

/* =========================================
   BOOT SEQUENCE (STARTUP FLOW)
========================================= */

function bootSequence() {

    showLoadingEffect();

    setTimeout(() => {

        startCoreSystems();

    }, 1200);

    setTimeout(() => {

        unlockExperience();

    }, 2500);

}

/* =========================================
   LOADING EFFECT
========================================= */

function showLoadingEffect() {

    const body = document.body;

    const loader = document.createElement("div");

    loader.id = "boot-loader";

    loader.innerHTML = `
        <div class="boot-text">
            INITIALIZING CYMOR SYSTEMS...
        </div>
        <div class="boot-bar">
            <div class="boot-progress"></div>
        </div>
    `;

    body.appendChild(loader);

    // Animate progress bar
    setTimeout(() => {

        const progress =
            document.querySelector(".boot-progress");

        if (progress) {
            progress.style.width = "100%";
        }

    }, 500);

    // Remove loader
    setTimeout(() => {

        loader.style.opacity = "0";

        setTimeout(() => {
            loader.remove();
        }, 600);

    }, 1200);

}

/* =========================================
   START CORE SYSTEMS
========================================= */

function startCoreSystems() {

    console.log("CYMOR SYSTEMS ONLINE");

    // scanner starts
    if (typeof initializeScanner === "function") {
        initializeScanner();
    }

}

/* =========================================
   UNLOCK EXPERIENCE
========================================= */

function unlockExperience() {

    document.body.classList.add("active");

    triggerAmbientEffects();

}

/* =========================================
   AMBIENT EFFECTS
========================================= */

function triggerAmbientEffects() {

    // subtle background pulse
    setInterval(() => {

        document.body.style.filter =
            "brightness(1.05) contrast(1.05)";

        setTimeout(() => {

            document.body.style.filter =
                "brightness(1) contrast(1)";

        }, 400);

    }, 4000);

}

/* =========================================
   FUTURE READY: PAGE SWITCH
========================================= */

function goToStore() {

    // later this will load actual shop page

    document.body.style.transition = "1s ease";

    document.body.style.opacity = "0";

    setTimeout(() => {

        window.location.href = "store.html";

    }, 1000);

}

/* =========================================
   BUTTON HOOK (OPTIONAL)
========================================= */

document.addEventListener("click", (e) => {

    if (e.target.classList.contains("btn-primary")) {
        goToStore();
    }

});
