'use strict';
/* ============================================================
   ACREA ONLINE — auth.js
   Firebase Anonymous Auth, starter pack, login/logout.
   Globals: currentUser (object), playerCache (object)
   ============================================================ */
var currentUser = null;   // { uid, username, ... }
var playerCache = null;   // live copy of /players/{uid}

var STARTER_BIBIT_POOL = ['bibit_tomat', 'bibit_cabai', 'bibit_bawang'];
var LS_UID = 'acrea_uid';
var LS_USERNAME = 'acrea_username';

function fbDb() { return firebase.database(); }
function fbAuth() { return firebase.auth(); }

/* ---------- Starter pack ---------- */
// 3 random bibit from pool (can repeat), 0 koin, 2 lahan kosong
function pickThree() {
  var counts = { bibit_tomat: 0, bibit_cabai: 0, bibit_bawang: 0 };
  for (var i = 0; i < 3; i++) {
    counts[Acrea.pick(STARTER_BIBIT_POOL)]++;
  }
  return counts;
}
function getStarterPack() {
  var b = pickThree();
  return {
    coins: 0,
    lahan: [null, null],          // 2 empty plots
    inventory: {},                // harvested goods
    bibit: b,                      // seeds
    exp: 0,
    level: 1,
    trust: 0,
    likes: 0,
    transactions: 0,
    joinedAt: Date.now(),
    lastEnergyReset: 0
  };
}

/* ---------- Init auth (auto-login if UID stored) ---------- */
function initAuth() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    if (window.showBootError) showBootError('Firebase SDK gagal dimuat (cek koneksi internet).');
    return;
  }
  try {
    fbAuth().onAuthStateChanged(function (user) {
      if (user) {
        currentUser = currentUser || { uid: user.uid };
        currentUser.uid = user.uid;
        var storedName = localStorage.getItem(LS_USERNAME);
        if (storedName) currentUser.username = storedName;
        if (window.App && App.onUser) App.onUser(currentUser);
        Acrea.showScreen('game');
      } else {
        currentUser = null;
        Acrea.showScreen('login');
      }
    }, function (err) {
      if (window.showBootError) showBootError('Auth error: ' + (err && err.message ? err.message : err));
    });
  } catch (err) {
    if (window.showBootError) showBootError('Auth init gagal: ' + (err && err.message ? err.message : err));
  }
}

/* ---------- Login / register ---------- */
function login() {
  var input = Acrea.el('login-username');
  var username = (input && input.value || '').trim();
  if (!username) { Acrea.toastError('Masukkan username dulu!'); return; }
  if (username.length > 20) { Acrea.toastError('Username maks 20 karakter'); return; }

  Acrea.toastInfo('Masuk ke Acrea...');
  fbAuth().signInAnonymously().then(function (res) {
    var uid = res.user.uid;
    localStorage.setItem(LS_UID, uid);
    localStorage.setItem(LS_USERNAME, username);
    currentUser = { uid: uid, username: username };

    var ref = fbDb().ref('players/' + uid);
    ref.once('value').then(function (snap) {
      if (!snap.exists()) {
        // new player -> write starter pack
        var data = getStarterPack();
        data.username = username;
        ref.set(data);
        Acrea.toastSuccess('Selamat datang, ' + username + '! 🌱');
      } else {
        // returning player
        currentUser.username = snap.val().username || username;
        Acrea.toastSuccess('Halo lagi, ' + currentUser.username + '!');
      }
      if (window.App && App.onUser) App.onUser(currentUser);
      Acrea.showScreen('game');
    });
  }).catch(function (err) {
    console.error(err);
    Acrea.toastError('Login gagal: ' + err.message);
  });
}

/* ---------- Logout ---------- */
function logout() {
  fbAuth().signOut().then(function () {
    localStorage.removeItem(LS_UID);
    localStorage.removeItem(LS_USERNAME);
    currentUser = null;
    playerCache = null;
    location.reload();
  });
}
