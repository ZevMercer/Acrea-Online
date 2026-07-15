'use strict';
/* ============================================================
   ACREA ONLINE — app.js
   Main controller: init, subscribe, render semua tab.
   ============================================================ */
var App = {
  onUser: null
};

function initFirebase() {
  if (typeof firebase === 'undefined' || !firebase.app) {
    throw new Error('Firebase SDK (gstatic) gagal dimuat — cek koneksi internet / jaringan ke gstatic.com');
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
}

function init() {
  try {
    initFirebase();
    Acrea.init();
    Acrea.onTabSwitch = function (name) {
      if (name === 'kebun') renderKebun();
      else if (name === 'inventori') { renderInventori(); renderBibit(); }
      else if (name === 'pasar') { renderAskList(); renderBidList(); }
      else if (name === 'chat') { /* messages auto-render via listener */ }
      else if (name === 'profil') renderProfil();
    };

    // wire static buttons
    var loginBtn = Acrea.el('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', login);
    var logoutBtn = Acrea.el('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    var tanamBtn = Acrea.el('pasar-jual-btn');
    if (tanamBtn) tanamBtn.addEventListener('click', bukaFormJual);
    var bidBtn = Acrea.el('pasar-bid-btn');
    if (bidBtn) bidBtn.addEventListener('click', bukaFormBeli);
    var likeBtn = Acrea.el('p-like-btn');
    if (likeBtn) likeBtn.addEventListener('click', likePlayer);
    initChatInput();
    Acrea.switchTab('kebun');

    // Firebase auth (might throw if config bad or firebase not loaded)
    initAuth();
  } catch (err) {
    showBootError(err && err.message ? err.message : String(err));
  }
}

// tampilkan error di layar loading (bukan spinner abadi)
function showBootError(msg) {
  var box = Acrea.el('loading-error');
  var spin = document.querySelector('#loading .spinner');
  if (spin) spin.style.display = 'none';
  if (box) {
    box.style.display = 'block';
    box.innerHTML = '⚠️ Gagal muat: ' + Acrea.escapeHtml(msg) +
      '<br><br>Buka lewat <b>http://</b> (local server), BUKAN file://.<br>' +
      'Contoh: <code>python3 -m http.server</code> lalu buka <code>http://localhost:8000</code><br>' +
      'Pastikan juga Firebase Console → Authentication → Anonymous = ON.';
  }
}

// fallback: kalau dalam 8 detik loading belum hilang, kasih tahu
setTimeout(function () {
  var loading = Acrea.el('loading');
  if (loading && !loading.classList.contains('hidden')) {
    showBootError('Firebase tidak merespons dalam 8 detik. Cek koneksi internet & config Firebase.');
  }
}, 8000);

/* ---------- Subscribe semua ---------- */
function subscribeAll() {
  subscribePasar();
  subscribeChat();
  subscribePlayerData();
  subscribePlayerCount();
}

function subscribePlayerData() {
  if (!currentUser) return;
  firebase.database().ref('players/' + currentUser.uid)
    .on('value', function (snap) {
      playerCache = snap.val() || {};
      // header coin + username
      var coinEl = Acrea.el('header-coin');
      if (coinEl) coinEl.textContent = Acrea.formatCAC(playerCache.coins || 0);
      var nameEl = Acrea.el('header-user');
      if (nameEl) nameEl.textContent = playerCache.username || '';
      // re-render active tab content
      if (Acrea.current() === 'kebun') renderKebun();
      else if (Acrea.current() === 'inventori') { renderInventori(); renderBibit(); }
      else if (Acrea.current() === 'profil') renderProfil();
    });
}

function subscribePlayerCount() {
  firebase.database().ref('players').on('value', function (snap) {
    var n = snap.numChildren ? snap.numChildren() : 0;
    var el = Acrea.el('header-online');
    if (el) el.textContent = n + ' pemain';
  });
}

/* ---------- Inisialisasi data dunia (cuaca, totalCoinsMinted) ---------- */
function initWorldData() {
  var db = firebase.database();
  db.ref('world/cuaca').transaction(function (v) { return (v === null || v === undefined) ? 0 : v; });
  db.ref('world/totalCoinsMinted').transaction(function (v) { return (v === null || v === undefined) ? 0 : v; });
  db.ref('world/vault').transaction(function (v) { return (v === null || v === undefined) ? 0 : v; });
}

/* ---------- Hook dari auth: saat user siap, subscribe + world ---------- */
App.onUser = function (user) {
  currentUser = user;
  initWorldData();
  subscribeAll();
};

// boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
