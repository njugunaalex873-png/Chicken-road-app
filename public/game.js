// ============================================
// CHICKEN ROAD — CONTINUOUS VISUAL DEMO
// Demo only: no real wagers or payouts.
// ============================================

const goButton = document.getElementById("goButton");
const cashoutButton = document.getElementById("cashoutButton");
const stakeInput = document.getElementById("stake");
const message = document.getElementById("message");
const statusText = document.getElementById("status");
const balance = document.getElementById("balance");
const payout = document.getElementById("payout");

let chicken = document.getElementById("chicken");

const dialog = document.getElementById("infoDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");

const roadGrid = document.querySelector(".road-grid");

let step = 0;
let multiplier = 1.00;
let demoRunning = false;
let moveTimer = null;

// Preserve the original starting road, including the 1.00× lane.
const originalRoadContent = roadGrid ? roadGrid.innerHTML : null;

// --------------------------------------------
// Dialogs
// --------------------------------------------

function showDialog(title, text) {
  if (!dialog || !dialogTitle || !dialogText) return;

  dialogTitle.textContent = title;
  dialogText.textContent = text;

  if (!dialog.open) {
    dialog.showModal();
  }
}

document.getElementById("helpButton")?.addEventListener("click", () => {
  showDialog(
    "How to play",
    "This is a visual demo. Press GO to move forward. " +
    "No real wagers or payouts are processed."
  );
});

document.getElementById("menuButton")?.addEventListener("click", () => {
  showDialog(
    "Chicken Road menu",
    "Account registration, wallet history, and settings are not connected yet."
  );
});

document.getElementById("closeDialog")?.addEventListener("click", () => {
  if (dialog) dialog.close();
});

// --------------------------------------------
// Stake controls
// --------------------------------------------

document.querySelectorAll("[data-stake]").forEach(button => {
  button.addEventListener("click", () => {
    if (!demoRunning && stakeInput) {
      stakeInput.value = button.dataset.stake;
    }
  });
});

document.getElementById("minusButton")?.addEventListener("click", () => {
  if (demoRunning || !stakeInput) return;

  const current = Number(stakeInput.value) || 1;
  stakeInput.value = Math.max(1, current - 10);
});

document.getElementById("plusButton")?.addEventListener("click", () => {
  if (demoRunning || !stakeInput) return;

  const current = Number(stakeInput.value) || 0;
  stakeInput.value = current + 10;
});

// --------------------------------------------
// Difficulty controls
// --------------------------------------------

document.querySelectorAll("[data-level]").forEach(button => {
  button.addEventListener("click", () => {
    if (demoRunning) return;

    document.querySelectorAll("[data-level]").forEach(item => {
      item.classList.remove("selected");
    });

    button.classList.add("selected");

    if (message) {
      message.textContent =
        `Selected ${button.dataset.level} difficulty for the visual demo.`;
    }
  });
});

// --------------------------------------------
// Update multiplier and demo payout display
// --------------------------------------------

function updateMultiplierDisplay() {
  const multiplierText = `${multiplier.toFixed(2)}×`;

  const display = document.querySelector(
    "#multiplier, #currentMultiplier, .current-multiplier"
  );

  if (display) {
    display.textContent = multiplierText;
  }

  // Update the newest lane marker.
  const markers = document.querySelectorAll(
    ".road-grid .multiplier-marker"
  );

  if (markers.length) {
    markers[markers.length - 1].textContent = multiplierText;
  }

  if (payout) {
    const stake = Number(stakeInput?.value) || 0;

    payout.textContent =
      `Demo only: ${(stake * multiplier).toFixed(2)}`;
  }
}

// --------------------------------------------
// Create a new lane as the chicken moves forward
// --------------------------------------------

function createRoadStep() {
  if (!roadGrid || !chicken) return;

  const lane = document.createElement("div");
  lane.className = "lane demo-generated-lane";

  const marker = document.createElement("div");
  marker.className = "multiplier-marker";
  marker.textContent = `${multiplier.toFixed(2)}×`;

  lane.appendChild(marker);
  roadGrid.appendChild(lane);

  // Move the chicken into the newest lane.
  lane.appendChild(chicken);

  // Scroll only when the chicken approaches the right edge.
  requestAnimationFrame(() => {
    const chickenCenter =
      lane.offsetLeft + lane.offsetWidth / 2;

    const visibleRight =
      roadGrid.scrollLeft + roadGrid.clientWidth;

    if (chickenCenter > visibleRight - 70) {
      roadGrid.scrollTo({
        left: chickenCenter - roadGrid.clientWidth + 100,
        behavior: "smooth"
      });
    }
  });
}

// --------------------------------------------
// Move the chicken forward
// --------------------------------------------

function moveChickenForward() {
  if (!demoRunning || !roadGrid || !chicken) return;

  step += 1;

  // Visual demonstration progression only.
  multiplier = 1 + step * 0.25;

  createRoadStep();
  updateMultiplierDisplay();

  if (statusText) {
    statusText.textContent = "DEMO RUNNING";
  }

  if (message) {
    message.textContent =
      `Visual demo: step ${step}, multiplier ${multiplier.toFixed(2)}×.`;
  }

  // Continue until the user stops the demo.
  moveTimer = window.setTimeout(moveChickenForward, 1200);
}

// --------------------------------------------
// Start a new demo round
// --------------------------------------------

function startDemo() {
  if (demoRunning) return;

  const stake = Number(stakeInput?.value);

  if (!Number.isFinite(stake) || stake < 1) {
    if (message) {
      message.textContent = "Enter a valid demo stake amount.";
    }
    return;
  }

  if (!roadGrid || originalRoadContent === null) {
    if (message) {
      message.textContent = "Road element not found. Check the HTML.";
    }
    return;
  }

  // Restore the original road and its fixed starting lane.
  roadGrid.innerHTML = originalRoadContent;

  // The chicken element must be retrieved again after restoration.
  chicken = document.getElementById("chicken");

  if (!chicken) {
    if (message) {
      message.textContent =
        "Chicken element not found in the starting lane.";
    }
    return;
  }

  step = 0;
  multiplier = 1.00;
  demoRunning = true;

  // Begin at the leftmost position.
  roadGrid.scrollLeft = 0;

  if (goButton) {
    goButton.textContent = "RUNNING";
    goButton.disabled = true;
  }

  if (cashoutButton) {
    cashoutButton.disabled = false;
  }

  if (statusText) {
    statusText.textContent = "DEMO RUNNING";
  }

  if (message) {
    message.textContent =
      "Visual demo started at 1.00×. No real wager has been placed.";
  }

  updateMultiplierDisplay();

  // Keep the chicken at 1.00× briefly before its first move.
  moveTimer = window.setTimeout(moveChickenForward, 1200);
}

// --------------------------------------------
// Stop the visual demo
// --------------------------------------------

function stopDemo() {
  if (!demoRunning) return;

  demoRunning = false;

  if (moveTimer !== null) {
    clearTimeout(moveTimer);
    moveTimer = null;
  }

  if (goButton) {
    goButton.disabled = false;
    goButton.textContent = "GO";
  }

  if (cashoutButton) {
    cashoutButton.disabled = true;
  }

  if (statusText) {
    statusText.textContent = "DEMO STOPPED";
  }

  if (message) {
    message.textContent =
      `Demo stopped at ${multiplier.toFixed(2)}×. ` +
      "No real money was involved.";
  }
}

// --------------------------------------------
// Button events
// --------------------------------------------

goButton?.addEventListener("click", startDemo);
cashoutButton?.addEventListener("click", stopDemo);

// --------------------------------------------
// Initial screen
// --------------------------------------------

if (balance) {
  balance.textContent = "Demo mode — no real balance";
}

if (cashoutButton) {
  cashoutButton.disabled = true;
}

if (payout) {
  payout.textContent = "Demo only";
}

if (statusText) {
  statusText.textContent = "READY — DEMO MODE";
}

if (message) {
  message.textContent =
    "Press GO to test continuous chicken movement. Demo only.";
    }
