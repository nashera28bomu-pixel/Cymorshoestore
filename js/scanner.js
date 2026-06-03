/* =========================================
   CYMOR SHOE STORE | SCANNER ENGINE
   High-Performance Physics & Rendering
========================================= */

const Engine = {
    particles: [],
    frame: 0,
    scannerPosition: 0,
    scannerDirection: 1
};

function initializeScanner() {
    const scannerLayer = document.getElementById("scanner-layer");
    if (!scannerLayer) return;

    // Start the animation loop
    requestAnimationFrame(render);
}

/* =========================================
   CORE RENDER LOOP (60FPS)
========================================= */
function render() {
    Engine.frame++;

    // 1. Update Scanner Line
    const line = document.querySelector(".scanner-line");
    if (line) {
        Engine.scannerPosition += Engine.scannerDirection * 3;
        if (Engine.scannerPosition >= window.innerHeight || Engine.scannerPosition <= 0) {
            Engine.scannerDirection *= -1;
        }
        line.style.transform = `translateY(${Engine.scannerPosition}px)`;
    }

    // 2. Efficient Particle Generation (throttle to every 10th frame)
    if (Engine.frame % 10 === 0) {
        spawnParticle();
    }

    // 3. Shoe Glow Effect (Oscillates every 120 frames ~ 2 seconds)
    if (Engine.frame % 120 === 0) {
        pulseShoeGlow();
    }

    requestAnimationFrame(render);
}

/* =========================================
   PARTICLE SYSTEM (Optimized)
========================================= */
function spawnParticle() {
    const layer = document.getElementById("scanner-layer");
    const p = document.createElement("div");
    p.classList.add("scan-particle");
    
    // Random positioning
    p.style.left = `${Math.random() * 100}vw`;
    p.style.top = `${Math.random() * 100}vh`;
    
    layer.appendChild(p);
    
    // Auto-clean after animation
    p.addEventListener('animationend', () => p.remove(), { once: true });
}

/* =========================================
   GLOW EFFECTS
========================================= */
function pulseShoeGlow() {
    const shoe = document.querySelector(".shoe");
    if (!shoe) return;

    shoe.style.transition = "box-shadow 0.6s ease-in-out";
    shoe.style.boxShadow = "0 0 40px #0ff, 0 0 80px #0ff";
    
    setTimeout(() => {
        shoe.style.boxShadow = "0 0 15px rgba(255,255,255,0.2)";
    }, 600);
}

// Global Resize Listener
window.addEventListener("resize", () => {
    // CSS handles most responsive layouts; only re-calc if necessary
});
