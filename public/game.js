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
    "The chicken starts at 1.00×. Press GO to start, then press GO again " +
    "to advance one lane. This is a visual demo only."
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
// Multiplier display
// --------------------------------------------

function updateMultiplierDisplay() {
  const text = `${multiplier.toFixed(2)}×`;

  const display = document.querySelector(
    "#multiplier, #currentMultiplier, .current-multiplier"
  );

  if (display) display.textContent = text;

  // Update only the lane where the chicken currently stands.
  const currentLane = chicken?.closest(".lane");
  const currentMarker = currentLane?.querySelector(".multiplier-marker");

  if (currentMarker) currentMarker.textContent = text;

  if (payout) {
    const stake = Number(stakeInput?.value) || 0;
    payout.textContent = `Demo only: ${(stake * multiplier).toFixed(2)}`;
  }
}

// --------------------------------------------
// Create a lane
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

  // Move the chicken into the new lane.
  lane.appendChild(chicken);

  // Scroll the road when the new lane approaches the right edge.
  requestAnimationFrame(() => {
    const laneCenter = lane.offsetLeft + lane.offsetWidth / 2;
    const desiredScroll = Math.max(
      0,
      laneCenter - roadGrid.clientWidth / 2
    );

    roadGrid.scrollTo({
      left: desiredScroll,
      behavior: "smooth"
    });
  });
}

// --------------------------------------------
// Advance exactly one lane per GO press
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
      `Step ${step}: ${multiplier.toFixed(2)}×. Press GO to advance again.`;
  }
}

// --------------------------------------------
// Start or advance the demo
// --------------------------------------------

function startDemo() {
  // Once started, each GO press advances one lane.
  if (demoRunning) {
    moveChickenForward();
    return;
  }

  const stake = Number(stakeInput?.value);

  if (!Number.isFinite(stake) || stake < 1) {
    if (message) message.textContent = "Enter a valid demo stake amount.";
    return;
  }

  if (!roadGrid || !chicken) {
    if (message) message.textContent = "Road or chicken element not found.";
    return;
  }

  // Remove generated lanes and restore the original six lanes.
  roadGrid.querySelectorAll(".demo-generated-lane").forEach(lane => {
    lane.remove();
  });

  // Reset to the first lane.
  step = 0;
  multiplier = 1.00;
  roadGrid.scrollLeft = 0;

  // Ensure the chicken starts in the actual first lane.
  const firstLane = roadGrid.querySelector(".lane");

  if (!firstLane) {
    if (message) message.textContent = "Starting lane not found.";
    return;
  }

  firstLane.appendChild(chicken);

  // Set the original lane labels into the 0.25× sequence.
  roadGrid.querySelectorAll(".lane").forEach((lane, index) => {
    const marker = lane.querySelector(".multiplier-marker");

    if (marker) {
      marker.textContent = `${(1 + index * 0.25).toFixed(2)}×`;
      marker.classList.remove("green", "gold");
    }
  });

  demoRunning = true;

  if (goButton) goButton.textContent = "GO";
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
// Initial screen
// --------------------------------------------

function positionChickenAtStart() {
  if (!roadGrid) return;

  const firstLane = roadGrid.querySelector(".lane");

  if (firstLane && chicken) {
    firstLane.appendChild(chicken);
  }

  // Make every original lane follow the same sequence.
  roadGrid.querySelectorAll(".lane").forEach((lane, index) => {
    const marker = lane.querySelector(".multiplier-marker");

    if (marker) {
      marker.textContent = `${(1 + index * 0.25).toFixed(2)}×`;
      marker.classList.remove("green", "gold");
    }
  });

  step = 0;
  multiplier = 1.00;
  roadGrid.scrollLeft = 0;

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
    "Chicken starts at 1.00×. Press GO to start, then GO again to advance.";
                                                         }
