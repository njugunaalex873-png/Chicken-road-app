const startButton = document.getElementById("startButton");
const cashoutButton = document.getElementById("cashoutButton");
const message = document.getElementById("message");
const accountButton = document.getElementById("accountButton");

accountButton.addEventListener("click", () => {
message.textContent =
"Secure account registration will be added in the next stage.";
});

startButton.addEventListener("click", async () => {
message.textContent =
"The game interface is ready. The secure game engine must be connected before gameplay can begin.";

startButton.disabled = true;

try {
const response = await fetch("/api/health");

if (response.ok) {
  message.textContent =
    "Backend connected. The game engine still needs to be configured.";
}

} catch (error) {
message.textContent =
"Backend not connected yet. We will configure the server next.";
}
});

cashoutButton.disabled = true;
