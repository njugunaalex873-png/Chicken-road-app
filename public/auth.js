// public/auth.js
import { auth, authReady } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const $ = id => document.getElementById(id);

function showMessage(text, error = false) {
  const el = $("authMessage");
  if (!el) return;

  el.textContent = text;
  el.style.color = error ? "#ff6b6b" : "#00e59b";
}

function showForm(form) {
  $("loginForm").hidden = form !== "login";
  $("registerForm").hidden = form !== "register";
  showMessage("");
}

$("showRegister")?.addEventListener("click", () => showForm("register"));
$("showLogin")?.addEventListener("click", () => showForm("login"));

$("registerForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("confirmPassword").value;
  const button = $("registerButton");

  if (!name || !email || !password || !confirm) {
    showMessage("Please complete every field.", true);
    return;
  }

  if (password.length < 6) {
    showMessage("Password must contain at least 6 characters.", true);
    return;
  }

  if (password !== confirm) {
    showMessage("Passwords do not match.", true);
    return;
  }

  button.disabled = true;

  try {
    await authReady;

    const result = await createUserWithEmailAndPassword(
      auth, email, password
    );

    await updateProfile(result.user, { displayName: name });
    showMessage("Account created successfully!");
  } catch (error) {
    showMessage(error.message || "Registration failed.", true);
  } finally {
    button.disabled = false;
  }
});

$("loginForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  const button = $("loginButton");

  button.disabled = true;

  try {
    await authReady;
    await signInWithEmailAndPassword(auth, email, password);
    showMessage("Signed in successfully!");
  } catch (error) {
    showMessage(error.message || "Login failed.", true);
  } finally {
    button.disabled = false;
  }
});

$("forgotPassword")?.addEventListener("click", async () => {
  const email = $("loginEmail").value.trim();

  if (!email) {
    showMessage("Enter your email address first.", true);
    return;
  }

  try {
    await authReady;
    await sendPasswordResetEmail(auth, email);
    showMessage("Password reset email sent. Check your inbox.");
  } catch (error) {
    showMessage(error.message || "Could not send reset email.", true);
  }
});

$("logoutButton")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    showMessage(error.message || "Sign out failed.", true);
  }
});

onAuthStateChanged(auth, async user => {
  await authReady;

  if ($("authScreen")) $("authScreen").hidden = !!user;
  if ($("gameScreen")) $("gameScreen").hidden = !user;

  if (user && $("signedInName")) {
    $("signedInName").textContent =
      user.displayName || user.email || "Player";
  }

  if (!user) showForm("login");
});
