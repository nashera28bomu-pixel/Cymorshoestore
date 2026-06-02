/* =========================================
   CYMOR SHOE STORE
   SCANNER.JS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeScanner();

});

/* =========================================
   INITIALIZE
========================================= */

function initializeScanner() {

    animateScannerLine();

    createScannerPulse();

    generateParticles();

}

/* =========================================
   SCANNER LINE MOVEMENT
========================================= */

function animateScannerLine() {

    const scannerLine =
        document.querySelector(".scanner-line");

    if (!scannerLine) return;

    let position = 0;
    let direction = 1;

    function move() {

        position += direction * 2;

        if (position >= window.innerHeight) {
            direction = -1;
        }

        if (position <= 0) {
            direction = 1;
        }

        scannerLine.style.top =
            position + "px";

        requestAnimationFrame(move);

    }

    move();

}

/* =========================================
   SCANNER PULSE
========================================= */

function createScannerPulse() {

    const scannerLayer =
        document.getElementById("scanner-layer");

    if (!scannerLayer) return;

    setInterval(() => {

        const pulse =
            document.createElement("div");

        pulse.classList.add("scanner-pulse");

        scannerLayer.appendChild(pulse);

        setTimeout(() => {

            pulse.remove();

        }, 3000);

    }, 2500);

}

/* =========================================
   PARTICLES
========================================= */

function generateParticles() {

    const scannerLayer =
        document.getElementById("scanner-layer");

    if (!scannerLayer) return;

    setInterval(() => {

        const particle =
            document.createElement("div");

        particle.classList.add("scan-particle");

        particle.style.left =
            Math.random() * window.innerWidth + "px";

        particle.style.top =
            Math.random() * window.innerHeight + "px";

        particle.style.animationDuration =
            (2 + Math.random() * 3) + "s";

        scannerLayer.appendChild(particle);

        setTimeout(() => {

            particle.remove();

        }, 5000);

    }, 200);

}

/* =========================================
   SHOE GLOW BOOST
========================================= */

setInterval(() => {

    const shoe =
        document.querySelector(".shoe");

    if (!shoe) return;

    shoe.style.boxShadow =
        `
        0 0 30px rgba(0,255,255,0.5),
        0 0 60px rgba(0,255,255,0.4),
        0 0 100px rgba(0,255,255,0.3)
        `;

    setTimeout(() => {

        shoe.style.boxShadow =
            `
            0 0 30px rgba(255,255,255,0.3),
            0 0 60px rgba(255,255,255,0.15)
            `;

    }, 600);

}, 4000);

/* =========================================
   WINDOW RESIZE
========================================= */

window.addEventListener("resize", () => {

    const scannerLine =
        document.querySelector(".scanner-line");

    if (scannerLine) {

        scannerLine.style.width =
            window.innerWidth + "px";

    }

});
