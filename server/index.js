const express = require("express");
const helmet = require("helmet");
const path = require("path");
const crypto = require("crypto");
const admin = require("firebase-admin");
const axios = require("axios");

async function getMpesaAccessToken() {
const key = process.env.MPESA_CONSUMER_KEY;
const secret = process.env.MPESA_CONSUMER_SECRET;

if (!key || !secret) {
throw new Error("M-Pesa sandbox credentials are missing.");
}

const credentials = Buffer.from("${key}:${secret}").toString("base64");

const response = await axios.get(
"https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
{
headers: {
Authorization: "Basic ${credentials}"
},
timeout: 15000
}
);

return response.data.access_token;
}

function getMpesaTimestamp() {
const date = new Date();
const parts = [
date.getFullYear(),
String(date.getMonth() + 1).padStart(2, "0"),
String(date.getDate()).padStart(2, "0"),
String(date.getHours()).padStart(2, "0"),
String(date.getMinutes()).padStart(2, "0"),
String(date.getSeconds()).padStart(2, "0")
];

return parts.join("");
       }

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));

// Firebase Admin: credentials must be stored in Render Environment.
try {
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing.");
}

const serviceAccount = JSON.parse(serviceAccountJson);

admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});
} catch (error) {
console.error("Firebase Admin initialization failed:", error.message);
}

// Authenticate users with Firebase ID tokens.
async function requireLogin(req, res, next) {
try {
if (!admin.apps.length) {
return res.status(503).json({
success: false,
error: "Authentication service is unavailable."
});
}

const header = req.headers.authorization || "";
const match = header.match(/^Bearer (.+)$/);

if (!match) {
  return res.status(401).json({
    success: false,
    error: "Please sign in to continue."
  });
}

const decoded = await admin.auth().verifyIdToken(match[1]);
req.user = { uid: decoded.uid };
next();

} catch (error) {
return res.status(401).json({
success: false,
error: "Your session is invalid or expired. Please sign in again."
});
}
}

// Demo game configuration only.
const STEP = 0.25;
const MIN_CRASH = 1.25;
const MAX_CRASH = 10;
const HISTORY_LIMIT = 50;

// Each signed-in user has a separate in-memory demo round.
const rounds = new Map();
const history = new Map();

function generateCrashPoint() {
const count = Math.floor((MAX_CRASH - MIN_CRASH) / STEP) + 1;
return Number(
(MIN_CRASH + crypto.randomInt(0, count) * STEP).toFixed(2)
);
}

function publicRound(round) {
if (!round) return null;

const result = {
id: round.id,
status: round.status,
multiplier: round.multiplier,
startedAt: round.startedAt,
demoMode: true
};

if (round.status === "crashed") {
result.crashPoint = round.crashPoint;
result.crashedAt = round.crashedAt;
}

if (round.status === "cashed_out") {
result.cashedOutAt = round.cashedOutAt;
result.cashoutMultiplier = round.cashoutMultiplier;
}

return result;
}

function addHistory(uid, entry) {
if (!history.has(uid)) history.set(uid, []);

const entries = history.get(uid);
entries.unshift(entry);

if (entries.length > HISTORY_LIMIT) {
entries.length = HISTORY_LIMIT;
}
}

// Health check.
app.get("/api/health", (req, res) => {
res.json({
success: true,
application: "Chicken Road",
status: "online",
demoMode: true,
realMoneyEnabled: false
});
});

// Start a demo round.
app.post("/api/round/start", requireLogin, (req, res) => {
const uid = req.user.uid;
const existing = rounds.get(uid);

if (existing && existing.status === "running") {
return res.status(409).json({
success: false,
error: "You already have a running demo round.",
round: publicRound(existing)
});
}

const round = {
id: crypto.randomUUID(),
uid,
status: "running",
multiplier: 1.00,
crashPoint: generateCrashPoint(),
startedAt: Date.now()
};

rounds.set(uid, round);

res.json({
success: true,
round: publicRound(round)
});
});

// Advance only the signed-in user's running demo round.
app.post("/api/round/advance", requireLogin, (req, res) => {
const uid = req.user.uid;
const round = rounds.get(uid);

if (!round || round.id !== req.body.roundId) {
return res.status(404).json({
success: false,
error: "Demo round not found."
});
}

if (round.status !== "running") {
return res.status(409).json({
success: false,
error: "This demo round is no longer running.",
round: publicRound(round)
});
}

round.multiplier = Number((round.multiplier + STEP).toFixed(2));

if (round.multiplier >= round.crashPoint) {
round.multiplier = round.crashPoint;
round.status = "crashed";
round.crashedAt = Date.now();

addHistory(uid, {
  id: round.id,
  status: "crashed",
  crashPoint: round.crashPoint,
  endedAt: round.crashedAt
});

return res.json({
  success: true,
  crashed: true,
  round: publicRound(round)
});

}

res.json({
success: true,
crashed: false,
round: publicRound(round)
});
});

// Cash out a demo round.
app.post("/api/round/cashout", requireLogin, (req, res) => {
const uid = req.user.uid;
const round = rounds.get(uid);

if (!round || round.id !== req.body.roundId) {
return res.status(404).json({
success: false,
error: "Demo round not found."
});
}

if (round.status !== "running") {
return res.status(409).json({
success: false,
error: "This demo round has already ended.",
round: publicRound(round)
});
}

round.status = "cashed_out";
round.cashedOutAt = Date.now();
round.cashoutMultiplier = round.multiplier;

addHistory(uid, {
id: round.id,
status: "cashed_out",
multiplier: round.cashoutMultiplier,
endedAt: round.cashedOutAt
});

res.json({
success: true,
cashedOut: true,
round: publicRound(round)
});
});

// Get the signed-in user's current demo round.
app.get("/api/round/current", requireLogin, (req, res) => {
res.json({
success: true,
round: publicRound(rounds.get(req.user.uid))
});
});

// Get only the signed-in user's demo history.
app.get("/api/history", requireLogin, (req, res) => {
res.json({
success: true,
demoMode: true,
history: history.get(req.user.uid) || []
});
});
// M-Pesa callback endpoint.
// This acknowledges the callback but does NOT credit any wallet yet.
// Payment verification and secure, persistent wallet accounting
// must be implemented before accepting real deposits.
app.post("/api/mpesa/callback", (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      console.warn("Received an invalid M-Pesa callback.");
      return res.status(400).json({
        success: false,
        message: "Invalid callback payload."
      });
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;

    console.log("M-Pesa callback received:", {
      checkoutRequestId,
      resultCode,
      resultDescription: callback.ResultDesc
    });

    if (resultCode === 0) {
      const items =
        callback.CallbackMetadata?.Item || [];

      const getItem = (name) =>
        items.find((item) => item.Name === name)?.Value;

      console.log("M-Pesa payment reported successful:", {
        checkoutRequestId,
        amount: getItem("Amount"),
        receiptNumber: getItem("MpesaReceiptNumber")
      });

      // IMPORTANT:
      // Do not credit a wallet based only on this callback.
      // First verify the transaction with Safaricom and match it
      // to a pending deposit stored securely on the server.
    }

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Callback received."
    });
  } catch (error) {
    console.error("M-Pesa callback processing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Callback processing failed."
    });
  }
});

// Live-money operations stay disabled.
app.post("/api/game/start", (req, res) => {
res.status(503).json({
success: false,
realMoneyEnabled: false,
message: "Real-money game services are not enabled."
});
});

app.post("/api/wallet/deposit", requireLogin, async (req, res) => {
try {
const { phone, amount } = req.body || {};

// Sandbox testing limits only.
if (
  typeof phone !== "string" ||
  !/^254[17]\d{8}$/.test(phone) ||
  !Number.isSafeInteger(amount) ||
  amount < 1 ||
  amount > 10000
) {
  return res.status(400).json({
    success: false,
    message: "Enter a valid Kenyan phone number (2547XXXXXXXX or 2541XXXXXXXX) and a whole-number test amount between 1 and 10,000."
  });
}

const shortcode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const callbackUrl = process.env.MPESA_CALLBACK_URL;

if (!shortcode || !passkey || !callbackUrl) {
  return res.status(503).json({
    success: false,
    message: "M-Pesa sandbox configuration is incomplete."
  });
}

const parsedCallback = new URL(callbackUrl);

if (
  parsedCallback.protocol !== "https:" ||
  parsedCallback.hostname !== "chicken-road-server.onrender.com" ||
  parsedCallback.pathname !== "/api/mpesa/callback"
) {
  return res.status(503).json({
    success: false,
    message: "The configured callback URL is invalid."
  });
}

const accessToken = await getMpesaAccessToken();
const timestamp = getMpesaTimestamp();

const password = Buffer.from(
  `${shortcode}${passkey}${timestamp}`
).toString("base64");

const response = await axios.post(
  "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
  {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: `CR${req.user.uid.slice(0, 8)}`,
    TransactionDesc: "Chicken Road sandbox deposit"
  },
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    timeout: 20000
  }
);

console.log("M-Pesa sandbox STK request submitted:", {
  uid: req.user.uid,
  amount,
  responseCode: response.data.ResponseCode
});

return res.json({
  success: true,
  sandbox: true,
  message: response.data.ResponseDescription ||
    "Sandbox request submitted.",
  customerMessage: response.data.CustomerMessage || "",
  checkoutRequestId: response.data.CheckoutRequestID || null,
  merchantRequestId: response.data.MerchantRequestID || null,
  walletCredited: false
});

} catch (error) {
console.error("M-Pesa sandbox request failed:", {
status: error.response?.status,
message: error.response?.data?.errorMessage ||
error.response?.data?.ResponseDescription ||
error.message
});

return res.status(502).json({
  success: false,
  message: "The M-Pesa sandbox request failed. Check the Render logs and Daraja sandbox configuration."
});

}
});

app.post("/api/wallet/withdraw", (req, res) => {
res.status(503).json({
success: false,
realMoneyEnabled: false,
message: "Withdrawal processing is not configured."
});
});

// Serve the frontend.
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("*", (req, res) => {
res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
console.log("Chicken Road server running on port ${PORT}");
});
