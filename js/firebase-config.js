'use strict';
/* ============================================================
   ACREA ONLINE — firebase-config.js
   ⚠️ ISI SENDIRI dengan config dari Firebase Console
   (Project Settings → Your apps → SDK setup & config).
   Pastikan Authentication → Sign-in method → Anonymous = ON,
   dan Realtime Database sudah dibuat.
   ============================================================ */
var firebaseConfig = {
  apiKey: "AIzaSyASCxRUhQtzz8LxdMAIMIEwrwWm2grLwag",
  authDomain: "acreaonline.firebaseapp.com",
  databaseURL: "https://acreaonline-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "acreaonline",
  storageBucket: "acreaonline.firebasestorage.app",
  messagingSenderId: "180903201944",
  appId: "1:180903201944:web:6ebb95c9b7c705af5914ed"
};

// Initialize Firebase (global `firebase` dari SDK compat di index.html)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
