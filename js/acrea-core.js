'use strict';
/* ============================================================
   ACREA ONLINE — acrea-core.js
   Micro-utility toolkit: Screen, Modal, Toast, Tabs,
   Formatters, Random. Vanilla JS, no dependencies.
   Exposes global `Acrea`.
   ============================================================ */
var Acrea = (function () {
  var TAB_ORDER = [];        // filled by init()
  var currentTab = null;

  /* ---------- DOM helpers ---------- */
  function el(id) { return document.getElementById(id); }
  function create(tag, opts) {
    opts = opts || {};
    var node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.attrs) {
      for (var k in opts.attrs) { if (opts.attrs.hasOwnProperty(k)) node.setAttribute(k, opts.attrs[k]); }
    }
    if (opts.on) {
      for (var ev in opts.on) { if (opts.on.hasOwnProperty(ev)) node.addEventListener(ev, opts.on[ev]); }
    }
    return node;
  }

  /* ---------- Screen management ---------- */
  function showScreen(name) {
    // screens: 'loading' | 'login' | 'game'
    ['loading', 'login', 'game'].forEach(function (s) {
      var node = el(s);
      if (node) node.classList.toggle('hidden', s !== name);
    });
  }

  /* ---------- Modal ---------- */
  var modalOverlay, modalBox;
  function initModal() {
    modalOverlay = el('modal-overlay');
    modalBox = el('modal');
    if (!modalOverlay) return;
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) hideModal();
    });
  }
  function showModal(title, bodyNode, actions) {
    if (!modalOverlay) initModal();
    modalBox.innerHTML = '';
    if (title) modalBox.appendChild(create('h3', { text: title }));
    if (bodyNode) modalBox.appendChild(bodyNode);
    if (actions && actions.length) {
      var row = create('div', { class: 'actions' });
      actions.forEach(function (a) {
        row.appendChild(create('button', {
          class: 'btn ' + (a.cls || ''),
          text: a.label,
          on: { click: function () { if (a.onClick) a.onClick(); } }
        }));
      });
      modalBox.appendChild(row);
    }
    modalOverlay.classList.add('show');
  }
  function hideModal() { if (modalOverlay) modalOverlay.classList.remove('show'); }

  /* ---------- Toast ---------- */
  var toastBox;
  function ensureToastBox() {
    if (toastBox) return;
    toastBox = el('toast-container');
    if (!toastBox) {
      toastBox = create('div', { attrs: { id: 'toast-container' } });
      document.body.appendChild(toastBox);
    }
  }
  function toast(msg, type) {
    ensureToastBox();
    var t = create('div', { class: 'toast ' + (type || ''), text: msg });
    toastBox.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, 2600);
  }
  function toastSuccess(m) { toast(m, 'success'); }
  function toastError(m) { toast(m, 'error'); }
  function toastInfo(m) { toast(m, 'info'); }

    /* ---------- Tabs ---------- */
  function initTabs() {
    var tabsEl = el('tabs');
    if (!tabsEl) return;
    var tabs = tabsEl.querySelectorAll('.tab');
    TAB_ORDER = [];
    tabs.forEach(function (t) { TAB_ORDER.push(t.getAttribute('data-tab')); });
    tabsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab');
      if (!btn) return;
      switchTab(btn.getAttribute('data-tab'));
    });
  }
  function switchTab(name) {
    currentTab = name;
    var tabsEl = el('tabs');
    if (tabsEl) {
      tabsEl.querySelectorAll('.tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === name);
      });
    }
    var panels = document.querySelectorAll('.panel');
    panels.forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + name); });
    // notify listeners (each module owns its render)
    if (Acrea.onTabSwitch) Acrea.onTabSwitch(name);
  }
  function current() { return currentTab; }

  /* ---------- Formatters ---------- */
  function formatCAC(n) {
    n = Math.floor(Number(n) || 0);
    return n.toLocaleString('id-ID') + ' CAC';
  }
  function formatTime(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function formatDate(ts) {
    var d = ts ? new Date(ts) : new Date();
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  // maps like count -> css class index per GDD pilar sosial
  function getLikeClass(likes) {
    likes = Number(likes) || 0;
    if (likes >= 10000) return 'like-6';   // pelangi 👑
    if (likes >= 5000) return 'like-5';    // emas ✨
    if (likes >= 1000) return 'like-4';    // oranye 🔥
    if (likes >= 500) return 'like-3';     // biru ⭐
    if (likes >= 100) return 'like-2';     // hijau 🌱
    return 'like-0';                        // putih biasa
  }
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- Random helpers ---------- */
  function random(min, max) {
    // inclusive integer range
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randomChance(p) { return Math.random() < p; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------- Init ---------- */
  function init() {
    initModal();
    initTabs();
  }

  return {
    el: el, create: create,
    showScreen: showScreen,
    showModal: showModal, hideModal: hideModal,
    toast: toast, toastSuccess: toastSuccess, toastError: toastError, toastInfo: toastInfo,
    switchTab: switchTab, current: current,
    formatCAC: formatCAC, formatTime: formatTime, formatDate: formatDate,
    getLikeClass: getLikeClass, escapeHtml: escapeHtml,
    random: random, randomChance: randomChance, pick: pick,
    init: init,
    onTabSwitch: null   // assigned by app.js
  };
})();

