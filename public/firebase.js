// public/firebase.js
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7Iru7qxk7pvkN9p9sCITk5TXKbzqEF_M",
  authDomain: "chickenroad-66a40.firebaseapp.com",
  projectId: "chickenroad-66a40",
  storageBucket: "chickenroad-66a40.firebasestorage.app",
  messagingSenderId: "931130172675",
  appId: "1:931130172675:web:1424da76004db8bf0e7536"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const authReady = setPersistence(
  auth,
  browserLocalPersistence
);
