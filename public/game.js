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

const roadGrid = document.querySelector(".road-grid");
let chicken = document.getElementById("chicken");

const dialog = document.getElementById("infoDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");

let step = 0;
let multiplier = 1.00;
let demoRunning = false;

// --------------------------------------------
// Helpers
// --------------------------------------------

function formatMultiplier(value) {
  return `${value.toFixed(2)}×`;
}

function multiplierForLane(index) {
  return 1 + index * 0.25;
}

function getLanes() {
  return roadGrid
    ? Array.from(roadGrid.querySelectorAll(".lane"))
    : [];
}

function labelAllLanes() {
  getLanes().forEach((lane, index) => {
    let marker = lane.querySelector(".multiplier-marker");

    if (!marker) {
      marker = document.createElement("div");
      marker.className = "multiplier-marker";
      lane.prepend(marker);
    }

    marker.textContent = formatMultiplier(multiplierForLane(index));
    marker.classList.remove("green", "gold");
  });
}

function updateMultiplierDisplay() {
  const display = document.querySelector(
    "#multiplier, #currentMultiplier, .current-multiplier"
  );

  if (display) {
    display.textContent = formatMultiplier(multiplier);
  }

  if (payout) {
    const stake = Number(stakeInput?.value) || 0;
    payout.textContent =
      `Demo only: ${(stake * multiplier).toFixed(2)}`;
  }
}

function scrollToLane(lane) {
  if (!roadGrid || !lane) return;

  requestAnimationFrame(() => {
    const gridRect = roadGrid.getBoundingClientRect();
    const laneRect = lane.getBoundingClientRect();

    const target =
      roadGrid.scrollLeft +
      laneRect.left -
      gridRect.left +
      laneRect.width / 2 -
      gridRect.width / 2;

    roadGrid.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth"
    });
  });
}

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
    "The chicken starts at 1.00×. Press GO once to start, then press GO " +
    "again to advance one lane. Cash Out stops the visual demo."
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
    if (demoRunning || !stakeInput) return;

    stakeInput.value = button.dataset.stake;
    updateMultiplierDisplay();
  });
});

document.getElementById("minusButton")?.addEventListener("click", () => {
  if (demoRunning || !stakeInput) return;

  const current = Number(stakeInput.value) || 1;
  stakeInput.value = Math.max(1, current - 10);
  updateMultiplierDisplay();
});

document.getElementById("plusButton")?.addEventListener("click", () => {
  if (demoRunning || !stakeInput) return;

  const current = Number(stakeInput.value) || 0;
  stakeInput.value = current + 10;
  updateMultiplierDisplay();
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
// Create a lane when the road ends
// --------------------------------------------

function createRoadLane() {
  if (!roadGrid) return null;

  const lane = document.createElement("div");
  lane.className = "lane demo-generated-lane";

  const existingLane = getLanes()[0];

  if (existingLane) {
    const style = getComputedStyle(existingLane);

    lane.style.width = style.width || "110px";
    lane.style.minWidth = style.minWidth || "110px";
    lane.style.minHeight = style.minHeight || "430px";
  }

  roadGrid.appendChild(lane);
  return lane;
}

// --------------------------------------------
// Position chicken in the requested lane
// --------------------------------------------

function positionChickenInLane(index) {
  if (!roadGrid || !chicken) return;

  let lanes = getLanes();

  while (index >= lanes.length) {
    if (!createRoadLane()) return;
    lanes = getLanes();
  }

  const lane = lanes[index];
  if (!lane) return;

  lane.appendChild(chicken);
  labelAllLanes();
  scrollToLane(lane);
}

// --------------------------------------------
// Move forward exactly one lane
// --------------------------------------------

function moveChickenForward() {
  if (!demoRunning) return;

  step += 1;
  multiplier = multiplierForLane(step);

  positionChickenInLane(step);
  updateMultiplierDisplay();

  if (statusText) statusText.textContent = "DEMO RUNNING";

  if (message) {
    message.textContent =
      `Step ${step}: ${formatMultiplier(multiplier)}. Press GO to advance again.`;
  }
}

// --------------------------------------------
// Reset the road
// --------------------------------------------

function resetDemoRoad() {
  if (!roadGrid || !chicken) return false;

  roadGrid.querySelectorAll(".demo-generated-lane").forEach(lane => {
    lane.remove();
  });

  const firstLane = roadGrid.querySelector(".lane");
  if (!firstLane) return false;

  step = 0;
  multiplier = 1.00;
  roadGrid.scrollLeft = 0;

  firstLane.appendChild(chicken);
  labelAllLanes();
  updateMultiplierDisplay();

  return true;
}

// --------------------------------------------
// Start or advance
// --------------------------------------------

function startDemo() {
  if (demoRunning) {
    moveChickenForward();
    return;
  }

  const stake = Number(stakeInput?.value);

  if (!Number.isFinite(stake) || stake < 1) {
    if (message) message.textContent = "Enter a valid demo stake amount.";
    return;
  }

  if (!resetDemoRoad()) {
    if (message) message.textContent = "Could not find the road or chicken.";
    return;
  }

  demoRunning = true;

  if (cashoutButton) cashoutButton.disabled = false;
  if (statusText) statusText.textContent = "DEMO RUNNING";

  if (message) {
    message.textContent =
      "Demo started at 1.00×. Press GO again to move to 1.25×.";
  }
}

// --------------------------------------------
// Cash Out
// --------------------------------------------

function stopDemo() {
  if (!demoRunning) return;

  demoRunning = false;

  if (cashoutButton) cashoutButton.disabled = true;
  if (statusText) statusText.textContent = "DEMO STOPPED";

  if (message) {
    message.textContent =
      `Demo stopped at ${formatMultiplier(multiplier)}. No real money was involved.`;
  }
}

// --------------------------------------------
// Button events
// --------------------------------------------

goButton?.addEventListener("click", startDemo);
cashoutButton?.addEventListener("click", stopDemo);

// --------------------------------------------
// Initialize when the page loads
// --------------------------------------------

function initializeGame() {
  if (!roadGrid || !chicken) {
    if (message) {
      message.textContent = "Could not find the road or chicken element.";
    }
    return;
  }

  demoRunning = false;
  resetDemoRoad();

  if (balance) {
    balance.textContent = "Demo mode — no real balance";
  }

  if (cashoutButton) cashoutButton.disabled = true;
  if (goButton) goButton.textContent = "GO";
  if (statusText) statusText.textContent = "READY — DEMO MODE";
  if (payout) payout.textContent = "Demo only";

  if (message) {
    message.textContent =
      "Chicken starts at 1.00×. Press GO to start, then GO again to advance.";
  }
}

initializeGame();
