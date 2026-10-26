const goButton = document.getElementById("goButton");
const cashoutButton = document.getElementById("cashoutButton");
const stakeInput = document.getElementById("stake");
const message = document.getElementById("message");
const statusText = document.getElementById("status");
const balance = document.getElementById("balance");
const payout = document.getElementById("payout");
const chicken = document.getElementById("chicken");

const dialog = document.getElementById("infoDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");

const roadGrid = document.querySelector(".road-grid");
const lanes = [...document.querySelectorAll(".road-grid .lane")];

let step = 0;
let multiplier = 1.00;
let demoRunning = false;
let moveTimer = null;
let originalRoadContent = null;

function showDialog(title, text) {
  if (!dialog || !dialogTitle || !dialogText) return;

  dialogTitle.textContent = title;
  dialogText.textContent = text;

  if (!dialog.open) dialog.showModal();
}

document.getElementById("helpButton")?.addEventListener("click", () => {
  showDialog(
    "How to play",
    "This is a visual demo. Press GO to move forward and increase the displayed multiplier. No real wagers or payouts are processed."
  );
});

document.getElementById("menuButton")?.addEventListener("click", () => {
  showDialog(
    "Chicken Road menu",
    "Account registration, wallet history, and settings are not connected yet."
  );
});

document.getElementById("closeDialog")?.addEventListener("click", () => {
  dialog?.close();
});

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

document.querySelectorAll("[data-level]").forEach(button => {
  button.addEventListener("click", () => {
    if (demoRunning) return;

    document.querySelectorAll("[data-level]").forEach(item => {
      item.classList.remove("selected");
    });

    button.classList.add("selected");
    message.textContent =
      `Selected ${button.dataset.level} difficulty for the visual demo.`;
  });
});

// Save the initial road markup so it can be restored on reset.
if (roadGrid) {
  originalRoadContent = roadGrid.innerHTML;
}

function updateMultiplierDisplay() {
  const multiplierText = `${multiplier.toFixed(2)}×`;

  // Update any existing multiplier display without requiring a specific ID.
  const display = document.querySelector(
    "#multiplier, #currentMultiplier, .current-multiplier"
  );

  if (display) {
    display.textContent = multiplierText;
  }

  // Update the most recently displayed lane marker.
  const markers = document.querySelectorAll(".multiplier-marker");
  if (markers.length) {
    const marker = markers[markers.length - 1];
    marker.textContent = multiplierText;
  }

  if (payout) {
    const stake = Number(stakeInput?.value) || 0;
    payout.textContent =
      `Demo only: ${(stake * multiplier).toFixed(2)}`;
  }
}

function createRoadStep() {
  if (!roadGrid || !chicken) return;

  const lane = document.createElement("div");
  lane.className = "lane demo-generated-lane";

  const marker = document.createElement("div");
  marker.className = "multiplier-marker";
  marker.textContent = `${multiplier.toFixed(2)}×`;

  lane.appendChild(marker);
  roadGrid.appendChild(lane);

  // Keep the chicken inside the newest lane.
  lane.appendChild(chicken);

  // Scroll the road horizontally as new steps appear.
  roadGrid.scrollTo({
    left: roadGrid.scrollWidth,
    behavior: "smooth"
  });
}

function moveChickenForward() {
  if (!demoRunning || !roadGrid || !chicken) return;

  step += 1;

  // Demo-only progression. This is not a real game outcome.
  multiplier = 1 + step * 0.25;

  createRoadStep();
  updateMultiplierDisplay();

  statusText.textContent = "DEMO RUNNING";
  message.textContent =
    `Visual demo: step ${step}, multiplier ${multiplier.toFixed(2)}×.`;

  // The preview continues until the player stops it.
  moveTimer = window.setTimeout(moveChickenForward, 1200);
}

function startDemo() {
  if (demoRunning) return;

  const stake = Number(stakeInput?.value);

  if (!Number.isFinite(stake) || stake < 1) {
    message.textContent = "Enter a valid demo stake amount.";
    return;
  }

  if (!roadGrid || !chicken) {
    message.textContent = "Road or chicken element not found. Check the HTML.";
    return;
  }

  demoRunning = true;
  step = 0;
  multiplier = 1.00;

  goButton.textContent = "RUNNING";
  goButton.disabled = true;
  cashoutButton.disabled = false;

  statusText.textContent = "DEMO RUNNING";
  message.textContent =
    "Visual demo started. No real wager has been placed.";

  updateMultiplierDisplay();
  moveChickenForward();
}

function stopDemo() {
  if (!demoRunning) return;

  demoRunning = false;

  if (moveTimer !== null) {
    clearTimeout(moveTimer);
    moveTimer = null;
  }

  goButton.disabled = false;
  goButton.textContent = "GO";
  cashoutButton.disabled = true;

  statusText.textContent = "DEMO STOPPED";
  message.textContent =
    `Demo stopped at ${multiplier.toFixed(2)}×. No money was paid or collected.`;
}

goButton?.addEventListener("click", startDemo);
cashoutButton?.addEventListener("click", stopDemo);

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
