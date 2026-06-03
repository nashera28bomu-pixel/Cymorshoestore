/* =========================================
   CYMOR SHOE STORE | ANIMATION ENGINE
   Optimized for Performance & Flow
========================================= */

document.addEventListener("DOMContentLoaded", async () => {
    // Initial State: Set items to invisible before starting
    const elementsToHide = ["#cymor", "#shoe", "#store", ".shoe", "#credit", ".cta"];
    elementsToHide.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.style.opacity = "0";
    });

    await startLandingSequence();
    initAmbientEffects();
});

async function startLandingSequence() {
    const animationDefaults = { duration: 1200, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "forwards" };
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper to animate
    const play = (selector, keyframes, options = animationDefaults) => {
        const el = document.querySelector(selector);
        if (!el) return;
        el.style.opacity = "1";
        return el.animate(keyframes, options).finished;
    };

    // Sequential Sequence
    await play("#cymor", [{ transform: "translateY(-100px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }]);
    await delay(200);
    
    await play("#shoe", [{ transform: "translateX(-100px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }]);
    await play("#store", [{ transform: "translateX(100px)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }]);
    await delay(300);

    play(".shoe", [
        { transform: "scale(0.5) rotate(-10deg)", opacity: 0 },
        { transform: "scale(1.1) rotate(5deg)", opacity: 1 },
        { transform: "scale(1) rotate(0deg)", opacity: 1 }
    ], { duration: 1500, easing: "ease-out", fill: "forwards" });

    await delay(500);
    play("#credit", [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }]);
    play(".cta", [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }]);
}

/* =========================================
   AMBIENT EFFECTS (Looping)
========================================= */
function initAmbientEffects() {
    // Neon Glow Pulse
    const titles = document.querySelectorAll(".title-container h1");
    setInterval(() => {
        titles.forEach(h1 => {
            h1.style.transition = "text-shadow 0.6s ease";
            h1.style.textShadow = "0 0 15px #0ff, 0 0 30px #0ff";
            setTimeout(() => h1.style.textShadow = "none", 600);
        });
    }, 4000);

    // Floating Credit
    const credit = document.getElementById("credit");
    if (credit) {
        credit.animate([
            { transform: "translateY(0)" },
            { transform: "translateY(-10px)" },
            { transform: "translateY(0)" }
        ], { duration: 3000, iterations: Infinity, easing: "ease-in-out" });
    }
}
