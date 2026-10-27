import { auth, authReady } from "./firebase.js";
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
const modeSelector = document.getElementById("modeSelector");
const gameArea = document.getElementById("gameArea");
const backToModesButton = document.getElementById("backToModesButton");
const realMoneyScreen =
  document.getElementById("realMoneyScreen");

const realMoneyMessage =
  document.getElementById("realMoneyMessage");

const backToModesFromRealButton =
  document.getElementById("backToModesFromRealButton");
let step = 0;
let multiplier = 1.00;
let demoRunning = false;

const SERVER_URL = "https://chicken-road-server.onrender.com";
let serverRoundId = null;
// My Profile screen elements
const menuButton = document.getElementById("menuButton");
const accountMenu = document.getElementById("accountMenu");

const profileScreen = document.getElementById("profileScreen");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileStatus = document.getElementById("profileStatus");
const profileMessage = document.getElementById("profileMessage");
const closeProfileButton = document.getElementById("closeProfileButton");
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

// Open and close the Chicken Road account menu

menuButton?.addEventListener("click", () => {
if (!accountMenu) return;

const isOpening = accountMenu.hidden;
accountMenu.hidden = !isOpening;

menuButton.setAttribute("aria-expanded", String(isOpening));
});

// Close the menu when the player taps outside it
document.addEventListener("click", (event) => {
if (
accountMenu &&
menuButton &&
!accountMenu.contains(event.target) &&
!menuButton.contains(event.target)
) {
accountMenu.hidden = true;
menuButton.setAttribute("aria-expanded", "false");
}
});
// Open My Profile
document.querySelector('[data-open-screen="profileScreen"]')
  ?.addEventListener("click", async () => {
    if (accountMenu) accountMenu.hidden = true;
    menuButton?.setAttribute("aria-expanded", "false");

    if (profileScreen) profileScreen.hidden = false;
    if (modeSelector) modeSelector.hidden = true;
    if (gameArea) gameArea.hidden = true;
    if (realMoneyScreen) realMoneyScreen.hidden = true;

    if (profileMessage) profileMessage.textContent = "";

    try {
      await authReady;

      const user = auth.currentUser;

      if (!user) {
        if (profileName) profileName.textContent = "Not signed in";
        if (profileEmail) profileEmail.textContent = "Not available";
        if (profileStatus) profileStatus.textContent = "Signed out";

        if (profileMessage) {
          profileMessage.textContent =
            "Please sign in to view your profile.";
        }
        return;
      }

      if (profileName) {
        profileName.textContent = user.displayName || "Player";
      }

      if (profileEmail) {
        profileEmail.textContent = user.email || "No email available";
      }

      if (profileStatus) {
        profileStatus.textContent = user.emailVerified
          ? "Email verified"
          : "Email not verified";
      }
    } catch (error) {
      if (profileMessage) {
        profileMessage.textContent =
          "Could not load your profile. Please try again.";
      }
    }
  });

// Return from My Profile
closeProfileButton?.addEventListener("click", () => {
  if (profileScreen) profileScreen.hidden = true;

  if (selectedGameMode === "demo" ||
      selectedGameMode === "real") {
    if (gameArea) gameArea.hidden = false;
  } else if (modeSelector) {
    modeSelector.hidden = false;
  }
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
await authReady;

const user = auth.currentUser;
if (!user) {
  throw new Error("Please sign in before starting a round.");
}

const idToken = await user.getIdToken();

const response = await fetch(`${SERVER_URL}/api/round/start`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${idToken}`,
    "Content-Type": "application/json"
  }
});


const responseText = await response.text();

let data;

try {
  data = JSON.parse(responseText);
} catch {
  console.error("Deposit response was not JSON:", {
    status: response.status,
    url: response.url,
    contentType: response.headers.get("content-type"),
    responsePreview: responseText.slice(0, 250)
  });

  throw new Error(
    `Server returned a non-JSON response (HTTP ${response.status}). Check the browser console.`
  );
}
  

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
if (message) message.textContent = error.message || "Could not start the demo round.";
} finally {
roundRequestInProgress = false;
if (goButton) goButton.disabled = false;
}
}
    

async function advanceServerRound() {
if (!demoRunning || roundRequestInProgress) return;

roundRequestInProgress = true;

try {
await authReady;

const user = auth.currentUser;
if (!user) {
  throw new Error("Please sign in again.");
}

const idToken = await user.getIdToken();

const response = await fetch(`${SERVER_URL}/api/round/advance`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${idToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    roundId: serverRoundId
  })
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
clearInterval(roundTimer);
roundTimer = null;
demoRunning = false;

if (cashoutButton) cashoutButton.disabled = true;
if (goButton) goButton.disabled = false;
if (statusText) statusText.textContent = "CONNECTION ERROR";

if (message) {
  message.textContent = error.message || "Could not update the round.";
}

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
await authReady;

const user = auth.currentUser;
if (!user) {
  throw new Error("Please sign in again.");
}

const idToken = await user.getIdToken();

const response = await fetch(`${SERVER_URL}/api/round/cashout`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${idToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    roundId: serverRoundId
  })
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
if (message) {
message.textContent = error.message || "Could not cash out.";
}
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
      message.textContent =
        "Could not find the road or chicken element.";
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
  if (goButton) goButton.disabled = true;
  if (stakeInput) stakeInput.disabled = true;

  if (statusText) statusText.textContent = "CHOOSE GAME MODE";
  if (payout) payout.textContent = "Choose a mode first";

  if (message) {
    message.textContent =
      "Choose Demo Mode or Real Money Mode to continue.";
  }
}
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

  // Wait until the player chooses a mode.
  if (mode === null) {
    if (modeMessage) {
      modeMessage.textContent =
        "Please choose a game mode.";
    }

    if (goButton) goButton.disabled = true;
    if (cashoutButton) cashoutButton.disabled = true;
    if (stakeInput) stakeInput.disabled = true;
    return;
  }

  // Demo Mode can be played using virtual stakes.
  if (mode === "demo") {
    if (modeMessage) {
      modeMessage.textContent =
        "Demo Mode selected. Virtual stakes only.";
    }

    if (message) {
      message.textContent =
        "Press GO when you are ready to play.";
    }
    if (modeSelector) modeSelector.hidden = true;
   if (gameArea) gameArea.hidden = false;

    if (goButton) goButton.disabled = false;
    if (stakeInput) stakeInput.disabled = false;
    return;
  }

  // Real Money Mode remains unavailable.
  if (mode === "real") {
    if (modeMessage) {
      modeMessage.textContent =
        "Real Money Mode is not available yet. " +
        "Deposits, wagers and withdrawals are disabled.";
    }

    if (message) {
      message.textContent =
        "Choose Demo Mode to play for now.";
    }

    if (goButton) goButton.disabled = true;
    if (cashoutButton) cashoutButton.disabled = true;
    if (stakeInput) stakeInput.disabled = true;
  }
}
demoModeButton?.addEventListener("click", () => {
  selectGameMode("demo");
});
backToModesButton?.addEventListener("click", () => {
if (demoRunning) {
if (message) {
message.textContent =
"Finish your current demo round before leaving.";
}
return;
}

if (gameArea) gameArea.hidden = true;
if (modeSelector) modeSelector.hidden = false;

selectGameMode(null);

if (statusText) statusText.textContent = "CHOOSE GAME MODE";
if (payout) payout.textContent = "Choose a mode first";
if (message) message.textContent = "Choose a game mode to continue.";
});
// Open Chicken Road board in Real Money Mode.
realModeButton?.addEventListener("click", () => {
  if (demoRunning || roundRequestInProgress) {
    if (modeMessage) {
      modeMessage.textContent =
        "Finish your current demo round first.";
    }
    return;
  }

  // Hide the mode selection and separate placeholder screen.
  if (modeSelector) modeSelector.hidden = true;
  if (realMoneyScreen) realMoneyScreen.hidden = true;

  // Show the existing Chicken Road game board.
  if (gameArea) gameArea.hidden = false;

  // Mark the selected mode.
  selectedGameMode = "real";

  if (realMoneyMessage) {
    realMoneyMessage.textContent =
      "Real Money Mode preview. Real-money betting, deposits and withdrawals are disabled.";
  }

  if (statusText) {
    statusText.textContent = "REAL MONEY MODE PREVIEW";
  }

  if (balance) {
    balance.textContent = "Real wallet not connected";
  }

  if (message) {
    message.textContent =
      "Game board preview only. Real-money play is unavailable.";
  }

  // Keep real-money gameplay controls disabled.
  if (goButton) goButton.disabled = true;
  if (cashoutButton) cashoutButton.disabled = true;
  if (stakeInput) stakeInput.disabled = true;
});

// Return to the game mode selection screen.
backToModesFromRealButton?.addEventListener("click", () => {
  if (realMoneyScreen) {
    realMoneyScreen.hidden = true;
  }

  if (modeSelector) {
    modeSelector.hidden = false;
  }

  selectGameMode(null);
});

selectGameMode(null);

initializeGame();
// ============================================
// WALLET AND ACCOUNT SCREEN NAVIGATION
// Demo interface only — no real-money transactions
// ============================================

const walletScreen = document.getElementById("walletScreen");
const depositScreen = document.getElementById("depositScreen");
const withdrawScreen = document.getElementById("withdrawScreen");
const historyScreen = document.getElementById("historyScreen");

const walletBalance = document.getElementById("walletBalance");
const transactionList = document.getElementById("transactionList");
const walletHistoryButton = document.getElementById("walletHistoryButton");

const accountScreens = [
  walletScreen,
  depositScreen,
  withdrawScreen,
  historyScreen
];

let demoWalletBalance = 0;
const demoTransactions = [];

function hideAccountScreens() {
  accountScreens.forEach(screen => {
    if (screen) screen.hidden = true;
  });
}

function openAccountScreen(screen) {
  if (!screen) return;

  hideAccountScreens();

  if (profileScreen) profileScreen.hidden = true;
  if (modeSelector) modeSelector.hidden = true;
  if (gameArea) gameArea.hidden = true;
  if (realMoneyScreen) realMoneyScreen.hidden = true;

  screen.hidden = false;

  if (accountMenu) accountMenu.hidden = true;
  menuButton?.setAttribute("aria-expanded", "false");

  updateWalletDisplay();
}

// Connect Wallet, Deposit, Withdraw, and History menu buttons
document.querySelectorAll("[data-open-screen]").forEach(button => {
  button.addEventListener("click", () => {
    const screenId = button.dataset.openScreen;

    const screen = document.getElementById(screenId);

    if (
      screenId === "walletScreen" ||
      screenId === "depositScreen" ||
      screenId === "withdrawScreen" ||
      screenId === "historyScreen"
    ) {
      openAccountScreen(screen);
    }
  });
});

// Display the demo balance
function updateWalletDisplay() {
  if (walletBalance) {
    walletBalance.textContent = demoWalletBalance.toFixed(2);
  }
}

// Return to the Wallet screen
document.querySelectorAll(".account-back-button").forEach(button => {
  button.addEventListener("click", () => {
    const currentScreen = button.closest(".account-screen");

    if (currentScreen === walletScreen) {
      hideAccountScreens();

      if (selectedGameMode === "demo" ||
          selectedGameMode === "real") {
        if (gameArea) gameArea.hidden = false;
      } else if (modeSelector) {
        modeSelector.hidden = false;
      }

      return;
    }

    openAccountScreen(walletScreen);
  });
});

// Open transaction history from Wallet
walletHistoryButton?.addEventListener("click", () => {
  openAccountScreen(historyScreen);
});

const depositButton = document.getElementById("demoDepositButton");

depositButton?.addEventListener("click", async () => {
  const amountInput = document.getElementById("depositAmount");
  const phoneInput = document.getElementById("mpesaPhone");
  const depositMessage = document.getElementById("depositMessage");

  const amount = Number(amountInput?.value);
  const phone = phoneInput?.value.trim();

  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 10000) {
    if (depositMessage) {
      depositMessage.textContent =
        "Enter a whole-number sandbox test amount between 1 and 10,000.";
    }
    return;
  }

  if (!/^254[17]\d{8}$/.test(phone || "")) {
    if (depositMessage) {
      depositMessage.textContent =
        "Enter a valid Kenyan number, for example 254712345678.";
    }
    return;
  }

  depositButton.disabled = true;

  if (depositMessage) {
    depositMessage.textContent = "Submitting sandbox payment request...";
  }

  try {
    await authReady;

    const user = auth.currentUser;

    if (!user) {
      throw new Error("Please sign in before requesting a payment.");
    }

    const idToken = await user.getIdToken();

    const response = await fetch(
      `${SERVER_URL}/api/wallet/deposit`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone, amount })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "The payment request failed.");
    }

    if (depositMessage) {
      depositMessage.textContent =
        data.customerMessage ||
        data.message ||
        "Sandbox request submitted. Follow the test instructions provided by Daraja.";
    }

    // Do not credit the wallet until payment is verified
    // and securely recorded by the server.
  } catch (error) {
    if (depositMessage) {
      depositMessage.textContent =
        error.message || "Could not submit the sandbox request.";
    }
  } finally {
    depositButton.disabled = false;
  }
});
// Render demo-only transaction history
function renderDemoTransactions() {
  if (!transactionList) return;

  if (demoTransactions.length === 0) {
    transactionList.innerHTML = "<p>No demo transactions yet.</p>";
    return;
  }

  transactionList.replaceChildren();

  demoTransactions.forEach(transaction => {
    const item = document.createElement("div");
    item.className = "demo-transaction";

    const title = document.createElement("strong");
    title.textContent = transaction.type;

    const amount = document.createElement("p");
    amount.textContent = `+${transaction.amount.toFixed(2)} demo funds`;

    const date = document.createElement("small");
    date.textContent = transaction.date;

    item.append(title, amount, date);
    transactionList.appendChild(item);
  });
}

updateWalletDisplay();
renderDemoTransactions();
