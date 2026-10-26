// ============================================
// CHICKEN ROAD — PLAYER-CONTROLLED VISUAL DEMO
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

// Save the original road, including the chicken's starting lane.
const originalRoadContent = roadGrid ? roadGrid.innerHTML : null;

// --------------------------------------------
// Dialogs
// --------------------------------------------

function showDialog(title, text) {
  if (!dialog || !dialogTitle || !dialogText) return;

  dialogTitle.textContent = title;
  dialogText.textContent = text;

  if (!dialog.open) dialog.showModal();
}

document.getElementById("helpButton")?.addEventListener("click", () => {
  showDialog(
    "How to play",
    "Press GO to start at 1.00×. Press GO again to move forward one lane. " +
    "This is a visual demo; no real wagers or payouts are processed."
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
// Multiplier and demo payout display
// --------------------------------------------

function updateMultiplierDisplay() {
  const multiplierText = `${multiplier.toFixed(2)}×`;

  const display = document.querySelector(
    "#multiplier, #currentMultiplier, .current-multiplier"
  );

  if (display) display.textContent = multiplierText;

  // Update the marker in the chicken's current lane.
  const currentLane = chicken?.closest(".lane");
  const currentMarker = currentLane?.querySelector(".multiplier-marker");

  if (currentMarker) {
    currentMarker.textContent = multiplierText;
  }

  if (payout) {
    const stake = Number(stakeInput?.value) || 0;
    payout.textContent =
      `Demo only: ${(stake * multiplier).toFixed(2)}`;
  }
}

// --------------------------------------------
// Put the chicken in a lane and scroll the road
// --------------------------------------------

function placeChickenInLane(lane) {
  if (!lane || !chicken || !roadGrid) return;

  lane.appendChild(chicken);

  requestAnimationFrame(() => {
    const laneCenter = lane.offsetLeft + lane.offsetWidth / 2;
    const visibleRight = roadGrid.scrollLeft + roadGrid.clientWidth;

    if (laneCenter > visibleRight - 90) {
      roadGrid.scrollTo({
        left: Math.max(0, laneCenter - roadGrid.clientWidth + 110),
        behavior: "smooth"
      });
    }
  });
}

// --------------------------------------------
// Create the next lane
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

  placeChickenInLane(lane);
}

// --------------------------------------------
// Move one lane only when GO is pressed
// --------------------------------------------

function moveChickenForward() {
  if (!demoRunning || !roadGrid || !chicken) return;

  step += 1;
  multiplier = 1 + step * 0.25;

  createRoadStep();
  updateMultiplierDisplay();

  if (statusText) statusText.textContent = "DEMO RUNNING";

  if (message) {
    message.textContent =
      `Visual demo: step ${step}, multiplier ${multiplier.toFixed(2)}×. ` +
      "Press GO to advance again.";
  }
}

// --------------------------------------------
// Start or advance the demo
// --------------------------------------------

function startDemo() {
  // If already running, GO advances exactly one lane.
  if (demoRunning) {
    moveChickenForward();
    return;
  }

  const stake = Number(stakeInput?.value);

  if (!Number.isFinite(stake) || stake < 1) {
    if (message) message.textContent = "Enter a valid demo stake amount.";
    return;
  }

  if (!roadGrid || originalRoadContent === null) {
    if (message) message.textContent = "Road element not found. Check the HTML.";
    return;
  }

  // Restore the original starting road.
  roadGrid.innerHTML = originalRoadContent;
  roadGrid.scrollLeft = 0;

  // Find the original chicken again.
  chicken = document.getElementById("chicken");

  if (!chicken) {
    if (message) {
      message.textContent = "Chicken element not found in the starting lane.";
    }
    return;
  }

  // Reset the demo to the first lane.
  step = 0;
  multiplier = 1.00;

  // Remove any lanes left from a previous run.
  roadGrid.querySelectorAll(".demo-generated-lane").forEach(lane => {
    lane.remove();
  });

  // Find the first lane and put the chicken there.
  const firstLane = roadGrid.querySelector(".lane");

  if (!firstLane) {
    if (message) message.textContent = "Starting lane not found in the road.";
    return;
  }

  placeChickenInLane(firstLane);

  demoRunning = true;

  if (goButton) {
    goButton.textContent = "GO";
    goButton.disabled = false;
  }

  if (cashoutButton) cashoutButton.disabled = false;
  if (statusText) statusText.textContent = "DEMO RUNNING";

  if (message) {
    message.textContent =
      "Started at 1.00×. Press GO again to move to 1.25×.";
  }

  updateMultiplierDisplay();
}

// --------------------------------------------
// Stop the demo
// --------------------------------------------

function stopDemo() {
  if (!demoRunning) return;

  demoRunning = false;

  if (goButton) {
    goButton.disabled = false;
    goButton.textContent = "GO";
  }

  if (cashoutButton) cashoutButton.disabled = true;
  if (statusText) statusText.textContent = "DEMO STOPPED";

  if (message) {
    message.textContent =
      `Demo stopped at ${multiplier.toFixed(2)}×. No real money was involved.`;
  }
}

// --------------------------------------------
// Button events
// --------------------------------------------

goButton?.addEventListener("click", startDemo);
cashoutButton?.addEventListener("click", stopDemo);

// --------------------------------------------
// Initial screen — start at 1.00× immediately
// --------------------------------------------

function positionChickenAtStart() {
  if (!roadGrid) return;

  roadGrid.scrollLeft = 0;

  chicken = document.getElementById("chicken");

  const firstLane = roadGrid.querySelector(".lane");

  if (firstLane && chicken) {
    firstLane.appendChild(chicken);
  }

  step = 0;
  multiplier = 1.00;

  updateMultiplierDisplay();
}

positionChickenAtStart();

if (balance) {
  balance.textContent = "Demo mode — no real balance";
}

if (cashoutButton) cashoutButton.disabled = true;
if (payout) payout.textContent = "Demo only";
if (statusText) statusText.textContent = "READY — DEMO MODE";

if (message) {
  message.textContent =
    "Chicken starts at 1.00×. Press GO to move forward.";
}
