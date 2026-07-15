'use strict';
/* ============================================================
   ACREA ONLINE — kebun.js
   Sistem kebun: 3 tanaman, timer, panen, mutasi, Firebase txn.
   Plot states: null (kosong), {jenis, tanamAt, waktu} (tumbuh),
   siap panen ditandai saat now >= tanamAt + waktu.
   ============================================================ */
var TANAMAN = {
  tomat:  { icon: '🍅', waktu: 30,  min: 2, max: 4, exp: 10, hasil: 'tomat' },
  cabai:  { icon: '🌶️', waktu: 60,  min: 1, max: 3, exp: 20, hasil: 'cabai' },
  bawang: { icon: '🧅', waktu: 90,  min: 1, max: 2, exp: 30, hasil: 'bawang' }
};
var BIBIT_TO_TANAMAN = { bibit_tomat: 'tomat', bibit_cabai: 'cabai', bibit_bawang: 'bawang' };
var MUTASI_SAMA = 0.05;   // 5% dapat bibit sama
var MUTASI_BEDA = 0.02;   // 2% dapat bibit beda

var _timers = [];

function kebunRef() { return firebase.database().ref('players/' + currentUser.uid + '/lahan'); }

/* ---------- Render grid lahan 2x2 ---------- */
function renderKebun() {
  var grid = Acrea.el('kebun-grid');
  if (!grid) return;
  var lahan = (playerCache && playerCache.lahan) || [null, null];
  // ensure 2 slots
  if (lahan.length < 2) lahan = lahan.concat([null, null]).slice(0, 2);
  grid.innerHTML = '';
  lahan.forEach(function (plot, i) {
    grid.appendChild(buildLahan(i, plot));
  });
}

function buildLahan(i, plot) {
  if (!plot) {
    // kosong
    return Acrea.create('div', {
      class: 'lahan kosong',
      html: '<div style="font-size:2rem">➕</div><div>Tanam</div>',
      on: { click: function () { bukaTanamModal(i); } }
    });
  }
  var now = Date.now();
  var matang = plot.tanamAt + TANAMAN[plot.jenis].waktu * 1000;
  if (now >= matang) {
    // siap panen
    return Acrea.create('div', {
      class: 'lahan siap',
      html: '<div class="tanaman-ico">' + TANAMAN[plot.jenis].icon + '</div>' +
            '<div style="color:var(--gold);font-weight:600">Siap Panen!</div>',
      on: { click: function () { panen(i); } }
    });
  }
  // tumbuh
  var node = Acrea.create('div', {
    class: 'lahan tumbuh',
    html: '<div class="tanaman-ico">' + TANAMAN[plot.jenis].icon + '</div>' +
          '<div class="timer" id="timer-' + i + '">...</div>'
  });
  startTimer(i, matang);
  return node;
}

/* ---------- Timer per lahan ---------- */
function startTimer(i, matang) {
  // clear existing
  if (_timers[i]) { clearInterval(_timers[i]); }
  function tick() {
    var left = Math.ceil((matang - Date.now()) / 1000);
    var t = Acrea.el('timer-' + i);
    if (!t) { clearInterval(_timers[i]); _timers[i] = null; return; }
    if (left <= 0) {
      clearInterval(_timers[i]); _timers[i] = null;
      renderKebun();   // refresh to siap-panen state
      return;
    }
    t.textContent = Acrea.formatTime(left);
  }
  tick();
  _timers[i] = setInterval(tick, 1000);
}

/* ---------- Modal pilih bibit ---------- */
function bukaTanamModal(index) {
  if (!playerCache) return;
  var bibit = playerCache.bibit || {};
  var keys = Object.keys(bibit).filter(function (k) { return bibit[k] > 0; });
  if (!keys.length) { Acrea.toastError('Bibit habis! Panen dulu atau dapatkan bibit.'); return; }

  var body = Acrea.create('div');
  keys.forEach(function (k) {
    var jenis = BIBIT_TO_TANAMAN[k];
    if (!jenis) return;
    var t = TANAMAN[jenis];
    var row = Acrea.create('div', {
      class: 'item',
      html: '<div class="ico">' + t.icon + '</div><div class="nm">' +
            cap(jenis) + ' <small style="color:var(--text-dim)">(' + t.waktu + 's)</small></div>' +
            '<div class="qty">x' + bibit[k] + '</div>'
    });
    row.style.cursor = 'pointer';
    row.addEventListener('click', function () { Acrea.hideModal(); tanam(index, k); });
    body.appendChild(row);
  });
  Acrea.showModal('Pilih Bibit', body, [{ label: 'Batal', cls: 'secondary', onClick: Acrea.hideModal }]);
}

/* ---------- Tanam ---------- */
function tanam(index, jenisBibit) {
  var jenis = BIBIT_TO_TANAMAN[jenisBibit];
  if (!jenis) return;
  kebunRef().transaction(function (lahan) {
    lahan = lahan || [null, null];
    if (lahan[index]) return; // already planted, abort
    lahan[index] = { jenis: jenis, tanamAt: Date.now() };
    return lahan;
  }, function (err) {
    if (err) { Acrea.toastError('Gagal tanam: ' + err.message); return; }
    // decrement seed
    firebase.database().ref('players/' + currentUser.uid + '/bibit/' + jenisBibit)
      .transaction(function (v) { return (v || 0) - 1; });
    Acrea.toastSuccess('Ditanam ' + cap(jenis) + ' ' + TANAMAN[jenis].icon);
    renderKebun();
  });
}

/* ---------- Panen ---------- */
function panen(index) {
  var lahan = playerCache.lahan;
  var plot = lahan && lahan[index];
  if (!plot) return;
  var t = TANAMAN[plot.jenis];
  var jumlah = Acrea.random(t.min, t.max);

  // mutasi bibit
  var mutasi = cekMutasi(plot.jenis);
  kebunRef().transaction(function (lh) {
    lh = lh || [];
    if (!lh[index] || lh[index].jenis !== plot.jenis) return; // changed meanwhile
    lh[index] = null; // reset lahan
    return lh;
  }, function (err) {
    if (err) { Acrea.toastError('Gagal panen: ' + err.message); return; }
    var uid = currentUser.uid;
    var root = firebase.database().ref('players/' + uid);
    root.child('inventory/' + t.hasil).transaction(function (v) { return (v || 0) + jumlah; });
    root.child('exp').transaction(function (v) { return (v || 0) + t.exp; });
    if (mutasi) {
      root.child('bibit/' + mutasi).transaction(function (v) { return (v || 0) + 1; });
      Acrea.toastInfo('Mutasi! Dapat bibit ' + cap(BIBIT_TO_TANAMAN[mutasi] || mutasi) + ' 🧬');
    }
    Acrea.toastSuccess('Panen ' + jumlah + ' ' + t.hasil + ' ' + t.icon);
    renderKebun();
  });
}

/* ---------- Cek mutasi bibit ---------- */
function cekMutasi(tanaman) {
  var bibitKey = 'bibit_' + tanaman;
  if (Acrea.randomChance(MUTASI_SAMA)) return bibitKey;
  if (Acrea.randomChance(MUTASI_BEDA)) {
    var others = Object.keys(BIBIT_TO_TANAMAN).filter(function (k) { return k !== bibitKey; });
    return Acrea.pick(others);
  }
  return null;
}

/* ---------- util ---------- */
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
