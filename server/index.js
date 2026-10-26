const express = require("express");
const helmet = require("helmet");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security configuration
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));

// Serve the Chicken Road frontend
app.use(express.static(path.join(__dirname, "..", "public")));

// Check whether the backend is running
app.get("/api/health", (req, res) => {
res.json({
success: true,
application: "Chicken Road",
status: "online"
});
});

// Keep live-money functions disabled until the secure
// game engine, financial ledger, and payment integration
// have been implemented and tested.
app.post("/api/game/start", (req, res) => {
res.status(503).json({
success: false,
message: "Game engine setup is not complete."
});
});

app.post("/api/wallet/deposit", (req, res) => {
res.status(503).json({
success: false,
message: "Payment integration is not configured."
});
});

app.post("/api/wallet/withdraw", (req, res) => {
res.status(503).json({
success: false,
message: "Withdrawal processing is not configured."
});
});

// Serve the application
app.get("*", (req, res) => {
res.sendFile(
path.join(__dirname, "..", "public", "index.html")
);
});

app.listen(PORT, () => {
console.log("Chicken Road server running on port ${PORT}");
});
