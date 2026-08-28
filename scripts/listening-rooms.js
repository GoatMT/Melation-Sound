(function () {
  var KEY = 'melationListeningRooms';
  var seeded = [
    { id:'studio', name:'Open Studio', mood:'Open studio', listeners:3, track:'A Dreams A Mystery', host:'Melation Sound' },
    { id:'broken-dream', name:'A Broken Dream · first listen', mood:'Album deep dive', listeners:7, track:'Nightmare Fuel', host:'Melation Sound' }
  ];
  function read() { try { var stored = JSON.parse(localStorage.getItem(KEY) || 'null'); return Array.isArray(stored) && stored.length ? stored : seeded; } catch (e) { return seeded; } }
  function write(value) { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (e) {} }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function render() {
    var list = document.getElementById('roomsList'); if (!list) return;
    var rooms = read();
    document.getElementById('roomsOnlineCount').textContent = rooms.length + (rooms.length === 1 ? ' room active' : ' rooms active');
    list.innerHTML = rooms.map(function (room, index) {
      return '<article class="room-card" style="--room-delay:' + (index * .08) + 's"><div class="room-card-top"><span class="room-status"><i></i> Live</span><span class="room-listeners">' + escapeHtml(room.listeners || 1) + ' listening</span></div><h3>' + escapeHtml(room.name) + '</h3><p class="room-host">Hosted by ' + escapeHtml(room.host || 'listener') + '</p><div class="room-track"><span>Now circling</span><strong>' + escapeHtml(room.track || 'A Dreams A Mystery') + '</strong></div><div class="room-card-bottom"><span>' + escapeHtml(room.mood || 'Open studio') + '</span><button type="button" data-room-id="' + escapeHtml(room.id) + '">Join room →</button></div></article>';
    }).join('');
    list.querySelectorAll('[data-room-id]').forEach(function (button) { button.addEventListener('click', function () { join(button.dataset.roomId); }); });
  }
  function join(id) {
    var rooms = read(); var room = rooms.find(function (item) { return item.id === id; });
    if (room) { room.listeners = Math.max(1, Number(room.listeners || 0) + 1); write(rooms); render(); }
    var started = window.melationPlayAllShuffled ? window.melationPlayAllShuffled() : false;
    var status = document.getElementById('roomStatus'); if (status) status.textContent = room ? (started ? 'You joined “' + room.name + '”. The shuffle mix is ready below.' : 'Sign in or create an account to start listening in this room.') : '';
  }
  var toggle = document.getElementById('roomCreateToggle');
  var panel = document.getElementById('roomCreatePanel');
  if (toggle && panel) toggle.addEventListener('click', function () { panel.hidden = !panel.hidden; if (!panel.hidden) document.getElementById('roomName').focus(); });
  var form = document.getElementById('roomCreateForm');
  if (form) form.addEventListener('submit', function (event) { event.preventDefault(); var name = document.getElementById('roomName').value.trim(); if (!name) return; var rooms = read(); rooms.unshift({ id:'room-' + Date.now(), name:name, mood:document.getElementById('roomMood').value, listeners:1, track:'A Dreams A Mystery', host:'You' }); write(rooms); form.reset(); panel.hidden = true; render(); });
  render();
}());
