'use strict';
/* ============================================================
   ACREA ONLINE — chat.js
   Chat global realtime, retensi 1 jam, username glow by like.
   ============================================================ */
var _chatUnsub = null;

function chatRef() { return firebase.database().ref('chat/messages'); }

/* ---------- Subscribe (only last 1 hour, max 50) ---------- */
function subscribeChat() {
  if (_chatUnsub) _chatUnsub.off && _chatUnsub.off();
  var cutoff = Date.now() - 3600 * 1000;
  _chatUnsub = chatRef()
    .orderByChild('timestamp')
    .startAt(cutoff)
    .limitToLast(50)
    .on('value', function (snap) { renderChat(snap); });
}

function renderChat(snapshot) {
  var box = Acrea.el('chat-messages');
  if (!box) return;
  box.innerHTML = '';
  var list = [];
  snapshot.forEach(function (c) { list.push(c.val()); });
  list.forEach(function (m) { box.appendChild(buildMsg(m)); });
  box.scrollTop = box.scrollHeight;
}

function buildMsg(m) {
  var line = Acrea.create('div', { class: 'chat-msg' });
  var uname = Acrea.create('span', {
    class: 'uname ' + Acrea.getLikeClass(m.likes || 0),
    text: m.username + ':'
  });
  var text = document.createTextNode(' ' + (m.text || ''));
  line.appendChild(uname);
  line.appendChild(text);
  return line;
}

/* ---------- Kirim chat (Enter or button) ---------- */
function kirimChat() {
  var input = Acrea.el('chat-input');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  if (!currentUser) { Acrea.toastError('Login dulu.'); return; }
  chatRef().push({
    username: currentUser.username,
    text: text,
    likes: (playerCache && playerCache.likes) || 0,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  input.value = '';
}

/* ---------- Enter key support (wired in app.js or here) ---------- */
function initChatInput() {
  var input = Acrea.el('chat-input');
  var btn = Acrea.el('chat-send');
  if (btn) btn.addEventListener('click', kirimChat);
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); kirimChat(); }
    });
  }
}
