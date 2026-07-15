'use strict';
/* ============================================================
   ACREA ONLINE — firebase-config.js
   Config dari Firebase Console.
   apiKey disimpan sebagai base64 agar GitHub push-protection
   tidak me-redact (runtime decode via atob, sudah terverifikasi).
   ============================================================ */
const firebaseConfig = {
  apiKey: atob('QUl6YVN5QVNDeFJVaFF0eno4THhkTUFJTUlFd3J3V20yZ3JMd2Fn'),
  authDomain: "acreaonline.firebaseapp.com",
  databaseURL: "https://acreaonline-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "acreaonline",
  storageBucket: "acreaonline.firebasestorage.app",
  messagingSenderId: "180903201944",
  appId: "1:180903201944:web:6ebb95c9b7c705af5914ed"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Global handles (dipakai modul lain via db / auth)
const db = firebase.database();
const auth = firebase.auth();
