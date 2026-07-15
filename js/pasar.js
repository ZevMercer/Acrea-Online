'use strict';
/* ============================================================
   ACREA ONLINE — pasar.js
   Order book dua arah: Ask (jual) & Bid (beli).
   Pajak transaksi 2% masuk Kas Desa (/world/vault).
   ============================================================ */
var PAJAK = 0.02;
var _pasarAsk = {};
var _pasarBid = {};

function pasarRef() { return firebase.database().ref('market'); }

/* ---------- Subscribe realtime ---------- */
function subscribePasar() {
  pasarRef().child('listings').on('value', function (snap) {
    _pasarAsk = snap.val() || {};
    if (Acrea.current() === 'pasar') renderAskList();
  });
  pasarRef().child('bids').on('value', function (snap) {
    _pasarBid = snap.val() || {};
    if (Acrea.current() === 'pasar') renderBidList();
  });
}

/* ---------- Render Ask (jual) ---------- */
function renderAskList() {
  var box = Acrea.el('ask-list');
  if (!box) return;
  box.innerHTML = '';
  var uid = currentUser && currentUser.uid;
  var rows = Object.keys(_pasarAsk).filter(function (id) {
    return _pasarAsk[id] && _pasarAsk[id].seller !== uid;
  });
  if (!rows.length) { box.innerHTML = '<p class="empty">Belum ada yang jual.</p>'; return; }
  rows.forEach(function (id) {
    var l = _pasarAsk[id];
    var total = l.harga * l.qty;
    var row = Acrea.create('div', {
      class: 'card',
      html: '<div class="card-row"><div class="ico">' + (l.icon || '📦') + '</div>' +
            '<div class="meta"><div class="name">' + Acrea.escapeHtml(l.item) + '</div>' +
            '<div class="sub">' + l.qty + ' x ' + Acrea.formatCAC(l.harga) + ' = ' + Acrea.formatCAC(total) + '</div></div>' +
            '<button class="btn small">Beli</button></div>'
    });
    row.querySelector('button').addEventListener('click', function () { beliListing(id, l); });
    box.appendChild(row);
  });
}

/* ---------- Render Bid (beli) ---------- */
function renderBidList() {
  var box = Acrea.el('bid-list');
  if (!box) return;
  box.innerHTML = '';
  var rows = Object.keys(_pasarBid);
  if (!rows.length) { box.innerHTML = '<p class="empty">Belum ada permintaan beli.</p>'; return; }
  rows.forEach(function (id) {
    var b = _pasarBid[id];
    var row = Acrea.create('div', {
      class: 'card',
      html: '<div class="card-row"><div class="ico">🙋</div>' +
            '<div class="meta"><div class="name">' + Acrea.escapeHtml(b.item) + '</div>' +
            '<div class="sub">Mau beli ' + b.qty + ' @ ' + Acrea.formatCAC(b.harga) + '</div></div>' +
            '<span class="qty">' + Acrea.formatCAC(b.harga * b.qty) + '</span></div>'
    });
    box.appendChild(row);
  });
}

/* ---------- Beli listing (Firebase transaction) ---------- */
function beliListing(listingId, listing) {
  if (!listing) listing = _pasarAsk[listingId];
  if (!listing) return;
  var buyer = currentUser.uid;
  if (listing.seller === buyer) { Acrea.toastError('Ini listing kamu sendiri.'); return; }
  var total = listing.harga * listing.qty;
  var pajak = Math.ceil(total * PAJAK);
  var db = firebase.database();

  // atomic: cek koin pembeli, pindah koin, pindah barang, catat trade, hapus listing
  db.ref('players/' + buyer + '/coins').transaction(function (koin) {
    koin = koin || 0;
    if (koin < total + pajak) return; // abort if insufficient (returning undefined rolls back)
    return koin - total - pajak;
  }, function (err, committed) {
    if (err) { Acrea.toastError('Gagal: ' + err.message); return; }
    if (!committed) { Acrea.toastError('Koin tidak cukup! (butuh ' + Acrea.formatCAC(total + pajak) + ')'); return; }
    // credit seller
    db.ref('players/' + listing.seller + '/coins').transaction(function (v) { return (v || 0) + total; });
    // add item to buyer inventory
    db.ref('players/' + buyer + '/inventory/' + listing.itemKey).transaction(function (v) { return (v || 0) + listing.qty; });
    // vault (tax)
    db.ref('world/vault').transaction(function (v) { return (v || 0) + pajak; });
    // remove listing
    db.ref('market/listings/' + listingId).remove();
    // trade log
    db.ref('trades').push({
      type: 'ask', buyer: buyer, seller: listing.seller,
      item: listing.item, itemKey: listing.itemKey, qty: listing.qty,
      harga: listing.harga, pajak: pajak, at: Date.now()
    });
    // bump transaction counts
    db.ref('players/' + buyer + '/transactions').transaction(function (v) { return (v || 0) + 1; });
    db.ref('players/' + listing.seller + '/transactions').transaction(function (v) { return (v || 0) + 1; });
    Acrea.toastSuccess('Beli ' + listing.qty + ' ' + listing.item + '!');
  });
}

/* ---------- Jual barang (buka form) ---------- */
function bukaFormJual() {
  if (!playerCache) return;
  var inv = playerCache.inventory || {};
  var keys = Object.keys(inv).filter(function (k) { return inv[k] > 0; });
  if (!keys.length) { Acrea.toastError('Inventory kosong, panen dulu!'); return; }

  var body = Acrea.create('div');
  var sel = Acrea.create('select', { class: '', attrs: { id: 'jual-item' } });
  keys.forEach(function (k) {
    sel.appendChild(Acrea.create('option', { attrs: { value: k }, text: cap(k) + ' (x' + inv[k] + ')' }));
  });
  var qty = Acrea.create('input', { attrs: { id: 'jual-qty', type: 'number', min: '1', value: '1', placeholder: 'Jumlah' } });
  var harga = Acrea.create('input', { attrs: { id: 'jual-harga', type: 'number', min: '1', placeholder: 'Harga satuan (CAC)' } });
  body.appendChild(field('Barang', sel));
  body.appendChild(field('Jumlah', qty));
  body.appendChild(field('Harga /satuan', harga));

  Acrea.showModal('Jual Barang', body, [
    { label: 'Batal', cls: 'secondary', onClick: Acrea.hideModal },
    { label: 'Pasang', onClick: function () {
        var item = sel.value, q = parseInt(qty.value, 10), h = parseInt(harga.value, 10);
        if (!item || !(q > 0) || !(h > 0)) { Acrea.toastError('Isi dengan benar.'); return; }
        jualBarang(item, q, h);
        Acrea.hideModal();
      } }
  ]);
}

function jualBarang(itemKey, qty, harga) {
  var inv = (playerCache.inventory || {})[itemKey] || 0;
  if (inv < qty) { Acrea.toastError('Stok ' + itemKey + ' tidak cukup.'); return; }
  var db = firebase.database();
  db.ref('players/' + currentUser.uid + '/inventory/' + itemKey).transaction(function (v) {
    return (v || 0) - qty;
  }, function (err, committed) {
    if (err || !committed) { Acrea.toastError('Gagal kurangi stok.'); return; }
    db.ref('market/listings').push({
      seller: currentUser.uid, item: cap(itemKey), itemKey: itemKey,
      icon: ITEM_ICON[itemKey] || '📦', qty: qty, harga: harga,
      expiresAt: Date.now() + 24 * 3600 * 1000
    });
    Acrea.toastSuccess('Listing jual dipasang!');
  });
}

/* ---------- Pasang Bid (buka form) ---------- */
function bukaFormBeli() {
  var body = Acrea.create('div');
  var item = Acrea.create('input', { attrs: { id: 'bid-item', placeholder: 'Nama barang' } });
  var qty = Acrea.create('input', { attrs: { id: 'bid-qty', type: 'number', min: '1', value: '1', placeholder: 'Jumlah' } });
  var harga = Acrea.create('input', { attrs: { id: 'bid-harga', type: 'number', min: '1', placeholder: 'Harga /satuan' } });
  body.appendChild(field('Barang', item));
  body.appendChild(field('Jumlah', qty));
  body.appendChild(field('Harga /satuan', harga));
  Acrea.showModal('Pasang Permintaan Beli', body, [
    { label: 'Batal', cls: 'secondary', onClick: Acrea.hideModal },
    { label: 'Pasang', onClick: function () {
        var it = item.value.trim(), q = parseInt(qty.value, 10), h = parseInt(harga.value, 10);
        if (!it || !(q > 0) || !(h > 0)) { Acrea.toastError('Isi dengan benar.'); return; }
        pasangBid(it, q, h);
        Acrea.hideModal();
      } }
  ]);
}

function pasangBid(item, qty, harga) {
  firebase.database().ref('market/bids').push({
    buyer: currentUser.uid, item: item, qty: qty, harga: harga, at: Date.now()
  });
  Acrea.toastSuccess('Bid dipasang!');
}

/* ---------- helpers ---------- */
function field(label, input) {
  var wrap = Acrea.create('div', { class: 'field' });
  wrap.appendChild(Acrea.create('label', { text: label }));
  wrap.appendChild(input);
  return wrap;
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
var ITEM_ICON = { tomat: '🍅', cabai: '🌶️', bawang: '🧅' };
