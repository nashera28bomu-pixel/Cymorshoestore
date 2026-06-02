/* =========================================
   CYMOR SHOE STORE
   ANIMATIONS.JS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    startLandingAnimation();

});

/* =========================================
   MAIN ANIMATION SEQUENCE
========================================= */

function startLandingAnimation() {

    animateCymor();

    setTimeout(() => {
        animateShoeWord();
    }, 800);

    setTimeout(() => {
        animateStore();
    }, 1600);

    setTimeout(() => {
        revealShoe();
    }, 2500);

    setTimeout(() => {
        revealCredit();
    }, 4000);

    setTimeout(() => {
        revealButtons();
    }, 5000);

}

/* =========================================
   CYMOR
========================================= */

function animateCymor() {

    const cymor =
        document.getElementById("cymor");

    if (!cymor) return;

    cymor.animate([
        {
            transform: "translateY(-500px)",
            opacity: 0
        },
        {
            transform: "translateY(40px)",
            opacity: 1
        },
        {
            transform: "translateY(0px)"
        }
    ], {
        duration: 1200,
        easing: "ease-out",
        fill: "forwards"
    });

}

/* =========================================
   SHOE
========================================= */

function animateShoeWord() {

    const shoe =
        document.getElementById("shoe");

    if (!shoe) return;

    shoe.animate([
        {
            transform: "translateX(-700px)",
            opacity: 0
        },
        {
            transform: "translateX(50px)",
            opacity: 1
        },
        {
            transform: "translateX(0px)"
        }
    ], {
        duration: 1200,
        easing: "ease-out",
        fill: "forwards"
    });

}

/* =========================================
   STORE
========================================= */

function animateStore() {

    const store =
        document.getElementById("store");

    if (!store) return;

    store.animate([
        {
            transform: "translateX(700px)",
            opacity: 0
        },
        {
            transform: "translateX(-50px)",
            opacity: 1
        },
        {
            transform: "translateX(0px)"
        }
    ], {
        duration: 1200,
        easing: "ease-out",
        fill: "forwards"
    });

}

/* =========================================
   SHOE REVEAL
========================================= */

function revealShoe() {

    const shoe =
        document.querySelector(".shoe");

    if (!shoe) return;

    shoe.animate([
        {
            opacity: 0,
            transform: "scale(.2) rotate(-20deg)"
        },
        {
            opacity: 1,
            transform: "scale(1.1) rotate(5deg)"
        },
        {
            opacity: 1,
            transform: "scale(1) rotate(-5deg)"
        }
    ], {
        duration: 1800,
        easing: "ease-out",
        fill: "forwards"
    });

}

/* =========================================
   CREDIT REVEAL
========================================= */

function revealCredit() {

    const credit =
        document.getElementById("credit");

    if (!credit) return;

    credit.animate([
        {
            opacity: 0,
            transform: "translateY(100px)"
        },
        {
            opacity: 1,
            transform: "translateY(0px)"
        }
    ], {
        duration: 1500,
        easing: "ease-out",
        fill: "forwards"
    });

}

/* =========================================
   BUTTON REVEAL
========================================= */

function revealButtons() {

    const buttons =
        document.querySelector(".cta");

    if (!buttons) return;

    buttons.animate([
        {
            opacity: 0,
            transform: "translateY(50px)"
        },
        {
            opacity: 1,
            transform: "translateY(0)"
        }
    ], {
        duration: 1200,
        easing: "ease-out",
        fill: "forwards"
    });

}

/* =========================================
   EXTRA GLOW EFFECT
========================================= */

setInterval(() => {

    const title =
        document.querySelectorAll(".title h1");

    title.forEach(word => {

        word.style.textShadow =
            `
            0 0 20px #fff,
            0 0 40px cyan,
            0 0 80px cyan
            `;

        setTimeout(() => {

            word.style.textShadow =
                `
                0 0 10px rgba(255,255,255,.4),
                0 0 20px rgba(255,255,255,.2)
                `;

        }, 600);

    });

}, 3500);

/* =========================================
   FLOATING CREDIT EFFECT
========================================= */

setInterval(() => {

    const credit =
        document.getElementById("credit");

    if (!credit) return;

    credit.animate([
        {
            transform: "translateY(0)"
        },
        {
            transform: "translateY(-8px)"
        },
        {
            transform: "translateY(0)"
        }
    ], {
        duration: 2000
    });

}, 2500);
