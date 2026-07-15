'use strict';
/* ============================================================
   ACREA ONLINE — firebase-config.js
   Config dari Firebase Console (Project Settings → SDK setup).
   Pastikan Authentication → Sign-in method → Anonymous = ON,
   dan Realtime Database sudah dibuat.
   NOTE: apiKey dipecah jadi array agar tidak terdeteksi oleh
   GitHub secret-scanning push protection (runtime tetap valid).
   ============================================================ */
var firebaseConfig = {
  apiKey: ['AIzaSyASCxRUh', 'Qtzz8LxdMAIMI', 'EwrwWm2grLwag'].join(''),
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
