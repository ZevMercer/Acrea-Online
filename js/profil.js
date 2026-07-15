'use strict';
/* ============================================================
   ACREA ONLINE — profil.js
   Profil pemain: avatar, like, trust, koin, join date, transaksi.
   Tombol like (maks 5/hari, track di localStorage).
   ============================================================ */
var LIKE_LIMIT = 5;
var LS_LIKE_KEY = 'acrea_likes_'; // + tanggal hari ini

function renderProfil() {
  if (!playerCache) return;
  setText('p-avatar', '🧑‍🌾');
  setText('p-username', currentUser ? currentUser.username : playerCache.username || '-');
  setText('p-like', '❤️ ' + (playerCache.likes || 0));
  setText('p-trust', '🏆 ' + (playerCache.trust || 0));
  setText('p-coin', Acrea.formatCAC(playerCache.coins || 0));
  setText('p-joined', '📅 ' + Acrea.formatDate(playerCache.joinedAt));
  setText('p-tx', '🔁 ' + (playerCache.transactions || 0));
  updateLikeButton();
}

function updateProfil(data) {
  // partial live update (called from firebase listener)
  if (data) Object.assign(playerCache || {}, data);
  renderProfil();
}

function updateLikeButton() {
  var btn = Acrea.el('p-like-btn');
  if (!btn) return;
  var used = todayLikes();
  if (used >= LIKE_LIMIT) {
    btn.disabled = true;
    btn.textContent = 'Like (' + used + '/' + LIKE_LIMIT + ')';
  } else {
    btn.disabled = false;
    btn.textContent = '❤️ Like (' + used + '/' + LIKE_LIMIT + ')';
  }
}

function likePlayer() {
  if (!playerCache || !currentUser) return;
  var used = todayLikes();
  if (used >= LIKE_LIMIT) { Acrea.toastError('Batas like harian tercapai.'); return; }
  firebase.database().ref('players/' + currentUser.uid + '/likes')
    .transaction(function (v) { return (v || 0) + 1; });
  bumpTodayLikes();
  Acrea.toastSuccess('Like dikirim! ❤️');
  updateLikeButton();
}

/* ---------- daily like tracking ---------- */
function todayKey() {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function todayLikes() {
  try {
    var raw = localStorage.getItem(LS_LIKE_KEY + todayKey());
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch (e) { return 0; }
}
function bumpTodayLikes() {
  var n = todayLikes() + 1;
  localStorage.setItem(LS_LIKE_KEY + todayKey(), String(n));
}

function setText(id, txt) { var n = Acrea.el(id); if (n) n.textContent = txt; }
