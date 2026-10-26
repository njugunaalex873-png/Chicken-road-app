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

document.getElementById("helpButton").addEventListener("click", () => {
dialogTitle.textContent = "How to play";
dialogText.textContent =
"Choose a stake and difficulty, then use GO to begin. The production game engine must determine the outcome on the server. Real-money play is not connected yet.";
dialog.showModal();
});

document.getElementById("menuButton").addEventListener("click", () => {
dialogTitle.textContent = "Chicken Road menu";
dialogText.textContent =
"Account registration, wallet history, and settings will be connected through the secure backend in a later stage.";
dialog.showModal();
});

document.getElementById("closeDialog").addEventListener("click", () => {
dialog.close();
});

document.querySelectorAll("[data-stake]").forEach(button => {
button.addEventListener("click", () => {
stakeInput.value = button.dataset.stake;
});
});

document.getElementById("minusButton").addEventListener("click", () => {
const current = Number(stakeInput.value) || 1;
stakeInput.value = Math.max(1, current - 10);
});

document.getElementById("plusButton").addEventListener("click", () => {
const current = Number(stakeInput.value) || 0;
stakeInput.value = current + 10;
});

document.querySelectorAll("[data-level]").forEach(button => {
button.addEventListener("click", () => {
document.querySelectorAll("[data-level]").forEach(item => {
item.classList.remove("selected");
});

button.classList.add("selected");
message.textContent =
  "Selected " + button.dataset.level +
  " difficulty. Server-side game rules are not connected yet.";

});
});

goButton.addEventListener("click", async () => {
const stake = Number(stakeInput.value);

if (!Number.isFinite(stake) || stake < 1) {
message.textContent = "Enter a valid stake amount.";
return;
}

statusText.textContent = "CHECKING SERVER";
message.textContent = "Checking the Chicken Road backend...";

try {
const response = await fetch("/api/health");
if (!response.ok) throw new Error("Server unavailable");

const result = await response.json();

if (result.success) {
  statusText.textContent = "SETUP REQUIRED";
  message.textContent =
    "Backend is online. The secure game engine and wallet are not configured, so no wager has been placed.";
} else {
  throw new Error("Backend is not ready");
}

} catch (error) {
statusText.textContent = "NOT CONNECTED";
message.textContent =
"Could not reach the backend. Check the server deployment and try again.";
}

cashoutButton.disabled = true;
payout.textContent = "Not available";
});

cashoutButton.addEventListener("click", () => {
message.textContent =
"Cash-out is unavailable until the server-authoritative game engine and financial ledger are implemented.";
});

balance.textContent = "Account not connected";
cashoutButton.disabled = true;
payout.textContent = "Not available";
// Chicken movement preview
let chickenStep = 0;

const chickenElement = document.getElementById("chicken");
const roadLanes = document.querySelectorAll(".lane");

function resetChicken() {
  chickenStep = 0;

  if (chickenElement) {
    chickenElement.style.left = "50%";
    chickenElement.style.bottom = "12px";
  }
}

function moveChickenForward() {
  if (!chickenElement || roadLanes.length === 0) return;

  if (chickenStep >= roadLanes.length - 1) {
    message.textContent =
      "The chicken reached the end of the visual preview!";
    return;
  }

  chickenStep++;

  const laneHeight = roadLanes[0].getBoundingClientRect().height;

  chickenElement.style.bottom =
    `${12 + chickenStep * laneHeight}px`;

  message.textContent =
    `Visual preview: chicken advanced to lane ${chickenStep + 1}.`;
}

resetChicken();
// Connect the GO button to the visual chicken movement
goButton.addEventListener("click", () => {
  if (!chicken || roadLanes.length === 0) {
    message.textContent = "Chicken or road lanes not found.";
    return;
  }

  if (chickenStep >= roadLanes.length - 1) {
    message.textContent = "The chicken has reached the end!";
    return;
  }

  chickenStep++;

  // Move the chicken into the next lane
  roadLanes[chickenStep].appendChild(chicken);

  message.textContent =
    `Visual preview: chicken moved to lane ${chickenStep + 1}.`;
});
