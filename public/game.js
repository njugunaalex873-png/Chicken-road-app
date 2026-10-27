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

const SERVER_URL = "https://chicken-road-server.onrender.com";
let serverRoundId = null;
let roundTimer = null;
let roundRequestInProgress = false;
const ROUND_UPDATE_INTERVAL = 1000;


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


function moveChickenForward(serverMultiplier) {
  if (!demoRunning) return;

  const nextStep = Math.round((serverMultiplier - 1) / 0.25);

  if (nextStep > step) {
    step = nextStep;
    multiplier = serverMultiplier;
    positionChickenInLane(step);
    updateMultiplierDisplay();
  }

  if (statusText) statusText.textContent = "DEMO RUNNING";

  if (message) {
    message.textContent =
      `Server multiplier: ${formatMultiplier(multiplier)}.`;
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


async function startDemo() {
  if (selectedGameMode !== "demo") return;
  if (demoRunning || roundRequestInProgress) return;

  const stake = Number(stakeInput?.value);

  if (!Number.isFinite(stake) || stake < 1) {
    if (message) message.textContent = "Enter a valid demo stake amount.";
    return;
  }

  if (!resetDemoRoad()) {
    if (message) message.textContent = "Could not find the road or chicken.";
    return;
  }

  roundRequestInProgress = true;
  if (goButton) goButton.disabled = true;

  try {
    const response = await fetch(`${SERVER_URL}/api/round/start`, {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not start the demo round.");
    }

    serverRoundId = data.round.id;
    multiplier = data.round.multiplier;
    demoRunning = true;

    if (cashoutButton) cashoutButton.disabled = false;
    if (statusText) statusText.textContent = "DEMO RUNNING";
    if (message) message.textContent = "Demo round started at 1.00×.";

    roundTimer = setInterval(advanceServerRound, ROUND_UPDATE_INTERVAL);
  } catch (error) {
    if (message) message.textContent = error.message;
  } finally {
    roundRequestInProgress = false;
    if (goButton) goButton.disabled = false;
  }
}

async function advanceServerRound() {
  if (!demoRunning || roundRequestInProgress) return;

  roundRequestInProgress = true;

  try {
    const response = await fetch(`${SERVER_URL}/api/round/advance`, {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not update the round.");
    }

    if (data.round) {
      moveChickenForward(data.round.multiplier);
    }

    if (data.crashed) {
      demoRunning = false;
      clearInterval(roundTimer);
      roundTimer = null;

      if (cashoutButton) cashoutButton.disabled = true;
      if (goButton) goButton.disabled = false;
      if (statusText) statusText.textContent = "CRASHED";

      if (message) {
        message.textContent =
          `Round crashed at ${formatMultiplier(data.round.crashPoint)}.`;
      }
    }
  } catch (error) {
    if (message) message.textContent = error.message;
    clearInterval(roundTimer);
    roundTimer = null;
    demoRunning = false;
    if (cashoutButton) cashoutButton.disabled = true;
    if (goButton) goButton.disabled = false;
    if (statusText) statusText.textContent = "CONNECTION ERROR";
  } finally {
    roundRequestInProgress = false;
  }
  }


// --------------------------------------------
// Cash Out
// --------------------------------------------


async function stopDemo() {
  if (!demoRunning || roundRequestInProgress) return;

  roundRequestInProgress = true;

  try {
    const response = await fetch(`${SERVER_URL}/api/round/cashout`, {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not cash out of the demo round.");
    }

    demoRunning = false;
    clearInterval(roundTimer);
    roundTimer = null;

    if (cashoutButton) cashoutButton.disabled = true;
    if (goButton) goButton.disabled = false;
    if (statusText) statusText.textContent = "DEMO STOPPED";

    if (message) {
      message.textContent =
        `Demo stopped at ${formatMultiplier(multiplier)}. No real money was involved.`;
    }
  } catch (error) {
    if (message) message.textContent = error.message;
  } finally {
    roundRequestInProgress = false;
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

/* Chicken Road mode selection */
let selectedGameMode = null;

const demoModeButton =
  document.getElementById("demoModeButton");

const realModeButton =
  document.getElementById("realModeButton");

const modeMessage =
  document.getElementById("modeMessage");

function selectGameMode(mode) {
  selectedGameMode = mode;

  demoModeButton?.classList.toggle(
    "selected",
    mode === "demo"
  );

  realModeButton?.classList.toggle(
    "selected",
    mode === "real"
  );

  if (mode === null) {
    if (modeMessage) {
      modeMessage.textContent =
        "Choose Demo Mode to start playing.";
    }

    if (goButton) goButton.disabled = true;
    if (cashoutButton) cashoutButton.disabled = true;
    if (stakeInput) stakeInput.disabled = true;
    return;
  }

  if (mode === "demo") {
    if (modeMessage) {
      modeMessage.textContent =
        "Demo Mode selected. Virtual stakes only.";
    }

    if (message) {
      message.textContent =
        "Demo Mode selected. Press GO to start.";
    }

    if (goButton) goButton.disabled = false;
    if (stakeInput) stakeInput.disabled = false;
    return;
  }

  if (mode === "real") {
    if (modeMessage) {
      modeMessage.textContent =
        "Real Money Mode is not available yet. " +
        "Deposits, betting and withdrawals are disabled.";
    }

    if (message) {
      message.textContent =
        "Please choose Demo Mode to play.";
    }

    if (goButton) goButton.disabled = true;
    if (cashoutButton) cashoutButton.disabled = true;
    if (stakeInput) stakeInput.disabled = true;
  }
}

demoModeButton?.addEventListener("click", () => {
  selectGameMode("demo");
});

realModeButton?.addEventListener("click", () => {
  if (demoRunning) {
    if (modeMessage) {
      modeMessage.textContent =
        "Finish your current demo round first.";
    }
    return;
  }

  selectGameMode("real");
});

selectGameMode(null);

