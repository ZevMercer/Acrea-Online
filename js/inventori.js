'use strict';
/* ============================================================
   ACREA ONLINE — inventori.js
   Tampilkan inventory hasil panen + bibit dari playerCache.
   ============================================================ */
var ITEM_ICON = (typeof ITEM_ICON !== 'undefined') ? ITEM_ICON : {};
var INV_ICONS = Object.assign({ tomat: '🍅', cabai: '🌶️', bawang: '🧅' }, ITEM_ICON);
var BIBIT_ICONS = { bibit_tomat: '🍅', bibit_cabai: '🌶️', bibit_bawang: '🧅' };

function renderInventori() {
  var box = Acrea.el('inventori-list');
  if (!box) return;
  box.innerHTML = '';
  var inv = (playerCache && playerCache.inventory) || {};
  var keys = Object.keys(inv).filter(function (k) { return inv[k] > 0; });
  if (!keys.length) { box.innerHTML = '<p class="empty">Inventory kosong. Panen dulu! 🌱</p>'; return; }
  keys.forEach(function (k) {
    box.appendChild(Acrea.create('div', {
      class: 'item',
      html: '<div class="ico">' + (INV_ICONS[k] || '📦') + '</div>' +
            '<div class="nm">' + cap(k) + '</div><div class="qty">x' + inv[k] + '</div>'
    }));
  });
}

function renderBibit() {
  var box = Acrea.el('bibit-list');
  if (!box) return;
  box.innerHTML = '';
  var b = (playerCache && playerCache.bibit) || {};
  var keys = Object.keys(b).filter(function (k) { return b[k] > 0; });
  if (!keys.length) { box.innerHTML = '<p class="empty">Tidak ada bibit.</p>'; return; }
  keys.forEach(function (k) {
    box.appendChild(Acrea.create('div', {
      class: 'item',
      html: '<div class="ico">' + (BIBIT_ICONS[k] || '🌱') + '</div>' +
            '<div class="nm">' + cap(k) + '</div><div class="qty">x' + b[k] + '</div>'
    }));
  });
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
