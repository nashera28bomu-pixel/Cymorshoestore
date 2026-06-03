/* =========================================
   CYMOR SHOE STORE | CORE DIRECTOR
   State-Managed Boot Sequence
========================================= */

const AppState = {
    isReady: false,
    version: "1.0.0"
};

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await runBootSequence();
        console.log(`%cCymor Systems v${AppState.version} Online`, "color: #00ff41; font-weight: bold;");
    } catch (err) {
        console.error("Boot sequence failed:", err);
    }
});

/* =========================================
   BOOT ENGINE
========================================= */

async function runBootSequence() {
    const loader = createLoader();
    document.body.appendChild(loader);

    // Initial Loading Phase
    await new Promise(resolve => setTimeout(resolve, 100));
    loader.querySelector(".boot-progress").style.width = "100%";
    
    // Wait for the transition
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Cleanup
    loader.style.opacity = "0";
    await new Promise(resolve => setTimeout(resolve, 600));
    loader.remove();

    // Initialize UI
    unlockExperience();
}

function createLoader() {
    const div = document.createElement("div");
    div.id = "boot-loader";
    div.innerHTML = `
        <div class="boot-text">INITIALIZING CYMOR SYSTEMS...</div>
        <div class="boot-bar"><div class="boot-progress"></div></div>
    `;
    return div;
}

/* =========================================
   SYSTEM LIFECYCLE
========================================= */

function unlockExperience() {
    AppState.isReady = true;
    document.body.classList.add("active");
    
    // Initialize external animation scripts if available
    if (typeof startLandingAnimation === "function") startLandingAnimation();
    triggerAmbientEffects();
}

function triggerAmbientEffects() {
    // Uses CSS variables for performance
    setInterval(() => {
        document.documentElement.style.setProperty('--body-filter', 'brightness(1.05) contrast(1.05)');
        setTimeout(() => {
            document.documentElement.style.setProperty('--body-filter', 'brightness(1) contrast(1)');
        }, 400);
    }, 4000);
}

/* =========================================
   NAVIGATION HANDLER
========================================= */

async function goToStore(url = "store.html") {
    const body = document.body;
    body.style.transition = "opacity 0.8s ease";
    body.style.opacity = "0";
    
    await new Promise(resolve => setTimeout(resolve, 800));
    window.location.href = url;
}

// Global Event Delegation (Cleaner than individual listeners)
document.addEventListener("click", (e) => {
    if (e.target.matches(".btn-primary")) {
        goToStore();
    }
});
