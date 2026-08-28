(function () {
  var mount = document.getElementById('label-player-mount');
  if (!mount) return;

  var privateReleasePage = document.body.classList.contains('private-single-page');
  var privateReleaseLocked = privateReleasePage && document.body.classList.contains('private-locked');
  var tracks = privateReleasePage
    ? [{ id:'10-20', name: '10:20', artist: 'MT', src: 'singles/10-20/assets/MT - 1020.MP3', art: 'singles/10-20/assets/1020.png', page: 'songs/song.html?track=10-20', length: '00:02:43', bitrate: '192kbps', channels: '2 (stereo)', sampleRate: '44.100 kHz' }]
    : [
        { id:'01', name: 'A Dreams A Mystery', artist: 'Osama, MT', src: 'albums/a-broken-dream/assets/a-dreams-a-mystery.mp3', art: 'albums/a-broken-dream/assets/album-cover.png', page: 'songs/song.html?track=01' },
        { id:'02', name: 'Nightmare Fuel', artist: 'Osama, MT and Adam', src: 'albums/a-broken-dream/assets/Nightmare Fuel.MP3', art: 'albums/a-broken-dream/assets/Nightmare Fuel.png', page: 'songs/song.html?track=02' },
        { id:'11', name: "Nawaf's Stole Pain", artist: 'Bassam', src: "albums/a-broken-dream/assets/Nawaf's Stole Pain.MP3", art: "albums/a-broken-dream/assets/Nawaf's Stole Pain.png", page: 'songs/song.html?track=11', exclusive: true }
      ];
  var ALL_TRACKS = [
    { id:'01', name:'A Dreams A Mystery', artist:'Osama, MT', src:'albums/a-broken-dream/assets/a-dreams-a-mystery.mp3', art:'albums/a-broken-dream/assets/album-cover.png', page:'songs/song.html?track=01' },
    { id:'02', name:'Nightmare Fuel', artist:'Osama, MT and Adam', src:'albums/a-broken-dream/assets/Nightmare Fuel.MP3', art:'albums/a-broken-dream/assets/Nightmare Fuel.png', page:'songs/song.html?track=02' },
    { id:'11', name:"Nawaf's Stole Pain", artist:'Bassam', src:"albums/a-broken-dream/assets/Nawaf's Stole Pain.MP3", art:"albums/a-broken-dream/assets/Nawaf's Stole Pain.png", page:'songs/song.html?track=11', exclusive:true },
    { id:'10-20', name:'10:20', artist:'MT', src:'singles/10-20/assets/MT - 1020.MP3', art:'singles/10-20/assets/1020.png', page:'songs/song.html?track=10-20' }
  ];
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  var PREV = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM20 6L9 12l11 6z"/></svg>';
  var NEXT = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4 6l11 6-11 6z"/></svg>';
  var EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5M3 3l7 7M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7M16 21h5v-5M21 21l-7-7"/></svg>';
  var SHUFFLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3c4 0 6 10 10 10h3M17 4l3 3-3 3M17 14l3 3-3 3M4 17h3c1.2 0 2.1-.5 2.9-1.3M14.1 8.3C15 7.5 15.8 7 17 7h3"/></svg>';
  var REPEAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l3 3-3 3M4 12V9a4 4 0 014-4h12M7 22l-3-3 3-3M20 12v3a4 4 0 01-4 4H4"/></svg>';
  var QUEUE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>';
  var CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a7.5 7.5 0 01-7.8 7.5 8.6 8.6 0 01-3.6-.8L4 20l1.6-4.1A7.1 7.1 0 014 11.5 7.5 7.5 0 0111.8 4 7.5 7.5 0 0120 11.5Z"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="2.6"/></svg>';
  var VOL = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16.2 9.5a4 4 0 010 5M18.5 7a7.5 7.5 0 010 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';
  var MUTE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';

  var bars = '';
  for (var i = 0; i < 64; i++) bars += '<i style="--bar-delay:' + (i % 9) * 0.08 + 's;--bar-height:' + (8 + ((i * 17) % 20)) + '%"></i>';
  mount.innerHTML = '<div class="label-player" id="labelPlayer" role="region" aria-label="Melation Sound audio player">' +
    '<div class="label-player-inner">' +
      '<div class="label-player-track"><img src="albums/a-broken-dream/assets/album-cover.png" alt="" id="labelPlayerArt"><div><p id="labelPlayerName">Choose a track</p><p id="labelPlayerArtist">Melation Sound</p><div class="label-player-live" id="labelPlayerLive" hidden><span>LIVE</span><div><strong id="labelPlayerLiveRoom">Listening Room</strong><small id="labelPlayerLiveViewers">0 viewers</small></div><button type="button" id="labelPlayerLeaveRoom">Leave</button></div></div><a class="label-player-expand" id="labelPlayerExpand" href="songs/song.html?track=01" aria-label="Open current song page" title="Open current song page" hidden>' + EXPAND + '</a></div>' +
      '<div class="label-player-controls"><div class="label-player-buttons">' +
        '<button type="button" class="label-player-btn" id="labelPlayerPrev" aria-label="Previous track">' + PREV + '</button>' +
        '<button type="button" class="label-player-btn label-player-play" id="labelPlayerPlay" aria-label="Play" disabled>' + PLAY + '</button>' +
        '<button type="button" class="label-player-btn" id="labelPlayerNext" aria-label="Next track">' + NEXT + '</button>' +
        '<button type="button" class="label-player-btn label-player-mode" id="labelPlayerShuffle" aria-label="Shuffle off" aria-pressed="false">' + SHUFFLE + '</button>' +
        '<button type="button" class="label-player-btn label-player-mode" id="labelPlayerRepeat" aria-label="Repeat off" aria-pressed="false">' + REPEAT + '</button>' +
        '<button type="button" class="label-player-btn label-player-mode" id="labelPlayerQueue" aria-label="Show queue" aria-expanded="false">' + QUEUE + '</button>' +
        '<button type="button" class="label-player-btn label-player-room-chat" id="labelPlayerRoomChat" aria-label="Open room chat" aria-expanded="false" hidden>' + CHAT + '<span>Chat</span></button>' +
      '</div><div class="label-player-seek-row"><span id="labelPlayerCurrent">0:00</span><input type="range" id="labelPlayerSeek" min="0" max="100" value="0" step="0.1" aria-label="Seek through track"><span id="labelPlayerDuration">0:00</span></div></div>' +
      '<div class="label-player-volume"><button type="button" class="label-player-volume-button" id="labelPlayerVolume" aria-label="Mute">' + VOL + '</button><div class="label-volume-track" id="labelVolumeTrack" role="slider" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="label-volume-fill" id="labelVolumeFill"></div><div class="label-volume-thumb" id="labelVolumeThumb"></div></div></div>' +
      '<button type="button" class="label-player-close" id="labelPlayerClose" aria-label="Close player">✕</button>' +
      '<div class="label-player-queue" id="labelPlayerQueuePanel" hidden><div class="label-player-queue-head"><strong>Up next.</strong><button type="button" id="labelPlayerQueueClose" aria-label="Close queue">✕</button></div><ol id="labelPlayerQueueList"></ol></div>' +
      '<section class="label-room-chat" id="labelRoomChat" aria-label="Live room chat" hidden><header class="label-room-chat-head"><div><span>Live room</span><strong id="labelRoomChatTitle">Room chat</strong></div><button type="button" id="labelRoomChatClose" aria-label="Close room chat">✕</button></header><div class="label-room-chat-messages" id="labelRoomChatMessages" aria-live="polite"><p class="label-room-chat-empty">Open chat to talk with the listeners in this room.</p></div><p class="label-room-chat-status" id="labelRoomChatStatus" role="status"></p><form class="label-room-chat-form" id="labelRoomChatForm"><label class="sr-only" for="labelRoomChatInput">Message the room</label><input id="labelRoomChatInput" type="text" maxlength="300" autocomplete="off" placeholder="Message the room" disabled><button type="submit" id="labelRoomChatSend" disabled>Send</button></form></section>' +
    '</div><div class="label-player-visualizer" aria-hidden="true">' + bars + '</div></div>';

  var player = document.getElementById('labelPlayer');
  var art = document.getElementById('labelPlayerArt');
  var name = document.getElementById('labelPlayerName');
  var artist = document.getElementById('labelPlayerArtist');
  var expand = document.getElementById('labelPlayerExpand');
  var play = document.getElementById('labelPlayerPlay');
  var prev = document.getElementById('labelPlayerPrev');
  var next = document.getElementById('labelPlayerNext');
  var shuffleButton = document.getElementById('labelPlayerShuffle');
  var repeatButton = document.getElementById('labelPlayerRepeat');
  var queueButton = document.getElementById('labelPlayerQueue');
  var queuePanel = document.getElementById('labelPlayerQueuePanel');
  var queueList = document.getElementById('labelPlayerQueueList');
  var queueClose = document.getElementById('labelPlayerQueueClose');
  var roomChatButton = document.getElementById('labelPlayerRoomChat');
  var roomChatPanel = document.getElementById('labelRoomChat');
  var roomChatClose = document.getElementById('labelRoomChatClose');
  var roomChatTitle = document.getElementById('labelRoomChatTitle');
  var roomChatMessages = document.getElementById('labelRoomChatMessages');
  var roomChatStatus = document.getElementById('labelRoomChatStatus');
  var roomChatForm = document.getElementById('labelRoomChatForm');
  var roomChatInput = document.getElementById('labelRoomChatInput');
  var roomChatSend = document.getElementById('labelRoomChatSend');
  var close = document.getElementById('labelPlayerClose');
  var volumeButton = document.getElementById('labelPlayerVolume');
  var volumeTrack = document.getElementById('labelVolumeTrack');
  var volumeFill = document.getElementById('labelVolumeFill');
  var volumeThumb = document.getElementById('labelVolumeThumb');
  var seek = document.getElementById('labelPlayerSeek');
  var current = document.getElementById('labelPlayerCurrent');
  var duration = document.getElementById('labelPlayerDuration');
  var live = document.getElementById('labelPlayerLive');
  var liveRoomName = document.getElementById('labelPlayerLiveRoom');
  var liveViewers = document.getElementById('labelPlayerLiveViewers');
  var leaveRoomButton = document.getElementById('labelPlayerLeaveRoom');
  var audio = new Audio();
  audio.preload = 'auto';
  var currentIndex = -1;
  var volume = 1;
  var muted = false;
  var shuffle = false;
  var repeat = false;
  var seeking = false;
  var communityPlayedFor = '';
  var communityLastReportedTime = 0;
  var STATE_KEY = 'melationPlayerState';
  var accountGate = null;
  var navigationResumeIntent = false;
  var liveRoom = null;
  var roomChatApi = null;
  var roomChatLoad = null;
  var roomChatUnsubscribe = null;
  var roomChatRoomId = '';

  function hasListenerAccount() {
    var service = window.MelationCommunity;
    var adminUnlocked = false;
    try { adminUnlocked = sessionStorage.getItem('melationAdminUnlocked') === 'yes'; } catch (e) {}
    return adminUnlocked || !!(service && typeof service.user === 'function' && service.user());
  }
  function closeAccountGate() {
    if (!accountGate) return;
    accountGate.hidden = true;
    document.body.classList.remove('has-account-gate');
  }
  function showAccountGate() {
    if (!accountGate) {
      accountGate = document.createElement('div');
      accountGate.className = 'label-account-gate';
      accountGate.id = 'labelAccountGate';
      accountGate.hidden = true;
      accountGate.setAttribute('role', 'dialog');
      accountGate.setAttribute('aria-modal', 'true');
      accountGate.setAttribute('aria-labelledby', 'labelAccountGateTitle');
      accountGate.innerHTML = '<div class="label-account-gate-card"><button type="button" class="label-account-gate-close" data-account-gate-close aria-label="Close account prompt">✕</button><p class="label-account-gate-kicker">Melation Sound · listener access</p><h2 id="labelAccountGateTitle">Make an account to listen.</h2><p>Create a free account or sign in before streaming songs, saving listening history, liking tracks, disliking tracks, or commenting.</p><div class="label-account-gate-actions"><div class="label-account-gate-main-actions"><a class="label-account-gate-primary" href="community.html">Go to Account</a><button type="button" class="label-account-gate-secondary" data-account-gate-close>Keep browsing</button></div><a class="label-account-gate-admin" href="admin-login.html">I\'m An Admin</a></div></div>';
      document.body.appendChild(accountGate);
      accountGate.querySelectorAll('[data-account-gate-close]').forEach(function (button) { button.addEventListener('click', closeAccountGate); });
      accountGate.addEventListener('click', function (event) { if (event.target === accountGate) closeAccountGate(); });
    }
    accountGate.hidden = false;
    document.body.classList.add('has-account-gate');
    var destination = accountGate.querySelector('.label-account-gate-primary');
    if (destination) destination.focus();
  }
  function requireListenerAccount() {
    if (hasListenerAccount()) return true;
    showAccountGate();
    return false;
  }

  function escapeChatText(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character];
    });
  }
  function chatUser() {
    var user = null;
    try { user = window.MelationCommunity && typeof window.MelationCommunity.user === 'function' ? window.MelationCommunity.user() : null; } catch (error) {}
    if (!user) {
      try { user = JSON.parse(sessionStorage.getItem('melationSoundAccount') || 'null'); } catch (error) {}
    }
    var name = user && (user.displayName || user.username) ? (user.displayName || user.username) : (sessionStorage.getItem('melationAdminUnlocked') === 'yes' ? 'Melation Admin' : 'Listener');
    return { name:String(name).slice(0, 40), key:String((user && (user.usernameKey || user.username)) || name).toLowerCase().slice(0, 60) };
  }
  function setRoomChatStatus(message) { if (roomChatStatus) roomChatStatus.textContent = message || ''; }
  function stopRoomChat() {
    if (roomChatUnsubscribe) roomChatUnsubscribe();
    roomChatUnsubscribe = null;
    roomChatRoomId = '';
  }
  function renderRoomChat(messages) {
    if (!roomChatMessages) return;
    if (!messages.length) {
      roomChatMessages.innerHTML = '<p class="label-room-chat-empty">No messages yet. Say hi to the room.</p>';
      return;
    }
    roomChatMessages.innerHTML = messages.map(function (message) {
      var author = escapeChatText(message.author || 'Listener');
      var body = escapeChatText(message.body || '');
      return '<article class="label-room-chat-message"><strong>' + author + '</strong><p>' + body + '</p></article>';
    }).join('');
    roomChatMessages.scrollTop = roomChatMessages.scrollHeight;
  }
  function loadRoomChatApi() {
    if (roomChatApi) return Promise.resolve(roomChatApi);
    if (roomChatLoad) return roomChatLoad;
    var firebaseConfig = window.MELATION_FIREBASE_CONFIG || {};
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) return Promise.reject(new Error('Room chat is not configured.'));
    roomChatLoad = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')
    ]).then(function (modules) {
      var firebaseApp = modules[0];
      var firestore = modules[1];
      var app = firebaseApp.getApps().find(function (item) { return item.name === 'labelRoomChat'; }) || firebaseApp.initializeApp(firebaseConfig, 'labelRoomChat');
      roomChatApi = { db:firestore.getFirestore(app), collection:firestore.collection, addDoc:firestore.addDoc, query:firestore.query, orderBy:firestore.orderBy, limitToLast:firestore.limitToLast, onSnapshot:firestore.onSnapshot };
      return roomChatApi;
    }).catch(function (error) { roomChatLoad = null; throw error; });
    return roomChatLoad;
  }
  function roomChatReference(api, roomId) {
    return api.collection(api.db, 'melationSound', 'main', 'rooms', roomId, 'chat');
  }
  function startRoomChat(roomId) {
    if (!roomId || roomChatRoomId === roomId) return;
    stopRoomChat();
    roomChatRoomId = roomId;
    setRoomChatStatus('Connecting…');
    loadRoomChatApi().then(function (api) {
      if (!isLiveRoom() || liveRoom.id !== roomId || roomChatRoomId !== roomId) return;
      var messages = api.query(roomChatReference(api, roomId), api.orderBy('createdAtMs', 'asc'), api.limitToLast(80));
      roomChatUnsubscribe = api.onSnapshot(messages, function (snapshot) {
        renderRoomChat(snapshot.docs.map(function (item) { return item.data(); }));
        setRoomChatStatus('');
      }, function () {
        setRoomChatStatus('Chat is unavailable right now.');
      });
    }).catch(function () {
      setRoomChatStatus('Chat is unavailable right now.');
    });
  }
  function openRoomChat() {
    if (!isLiveRoom()) return;
    roomChatPanel.hidden = false;
    roomChatButton.setAttribute('aria-expanded', 'true');
    roomChatTitle.textContent = liveRoom.name || 'Room chat';
    roomChatInput.disabled = false;
    roomChatSend.disabled = false;
    startRoomChat(liveRoom.id);
    roomChatInput.focus();
  }
  function closeRoomChat() {
    roomChatPanel.hidden = true;
    roomChatButton.setAttribute('aria-expanded', 'false');
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch (e) { return null; }
  }
  function saveState(playingOverride) {
    try {
      var state = readState() || {};
      state.volume = volume;
      state.muted = muted;
      state.shuffle = shuffle;
      state.repeat = repeat;
      state.liveRoom = liveRoom ? { id:liveRoom.id, name:liveRoom.name, viewerCount:liveRoom.viewerCount, viewers:liveRoom.viewers || [] } : null;
      if (currentIndex >= 0) {
        state.src = tracks[currentIndex].src;
        state.currentTime = audio.currentTime || 0;
        state.playing = typeof playingOverride === 'boolean' ? playingOverride : !audio.paused;
        state.open = player.classList.contains('open');
        state.updatedAtMs = Date.now();
        state.queue = tracks.map(function (track) { return { id:track.id, name:track.name, artist:track.artist, src:track.src, art:track.art, page:track.page, exclusive:!!track.exclusive }; });
      }
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {}
  }
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }
  function updateSeekFill(value) {
    var color = player.classList.contains('is-exclusive') ? '#ff8585' : '#62b2ff';
    seek.style.background = 'linear-gradient(to right,' + color + ' 0%,' + color + ' ' + value + '%,#183451 ' + value + '%,#183451 100%)';
  }
  function updateVolume() {
    audio.volume = muted ? 0 : volume;
    volumeButton.innerHTML = muted || volume === 0 ? MUTE : VOL;
    volumeButton.setAttribute('aria-label', muted || volume === 0 ? 'Unmute' : 'Mute');
    var percent = muted ? 0 : Math.round(volume * 100);
    volumeFill.style.height = percent + '%';
    volumeThumb.style.bottom = percent + '%';
    volumeTrack.classList.toggle('is-muted', muted || volume === 0);
    volumeTrack.setAttribute('aria-valuenow', percent);
  }
  function updateModes() {
    shuffleButton.classList.toggle('is-active', shuffle);
    shuffleButton.setAttribute('aria-pressed', String(shuffle));
    shuffleButton.setAttribute('aria-label', shuffle ? 'Shuffle on' : 'Shuffle off');
    repeatButton.classList.toggle('is-active', repeat);
    repeatButton.setAttribute('aria-pressed', String(repeat));
    repeatButton.setAttribute('aria-label', repeat ? 'Repeat on' : 'Repeat off');
  }
  function isLiveRoom() { return !!(liveRoom && liveRoom.id); }
  function updateLiveRoom() {
    var active = isLiveRoom();
    player.classList.toggle('is-live-room', active);
    live.hidden = !active;
    roomChatButton.hidden = !active;
    if (active) {
      var count = Math.max(0, Number(liveRoom.viewerCount) || 0);
      var names = Array.isArray(liveRoom.viewers) ? liveRoom.viewers.filter(Boolean) : [];
      liveRoomName.textContent = liveRoom.name || 'Listening Room';
      liveViewers.textContent = count + (count === 1 ? ' viewer' : ' viewers') + (names.length ? ' · ' + names.join(', ') : '');
      liveViewers.title = names.length ? 'In this room: ' + names.join(', ') : 'No listeners are in this room yet.';
      if (!roomChatPanel.hidden) {
        roomChatTitle.textContent = liveRoom.name || 'Room chat';
        startRoomChat(liveRoom.id);
      }
    } else {
      closeRoomChat();
      stopRoomChat();
      roomChatInput.disabled = true;
      roomChatSend.disabled = true;
    }
    updateNavState();
  }
  function renderQueue() {
    queueList.innerHTML = tracks.length ? tracks.map(function (track, index) {
      return '<li class="label-player-queue-item ' + (index === currentIndex ? 'is-current' : '') + '"><button type="button" data-queue-index="' + index + '"><span>' + (index + 1) + '</span><strong>' + track.name + '</strong><small>' + track.artist + '</small></button></li>';
    }).join('') : '<li class="label-player-queue-empty">No tracks in the queue.</li>';
  }
  function nextTrackIndex(direction) {
    if (tracks.length <= 1) return currentIndex;
    if (direction > 0 && shuffle) {
      var choices = tracks.map(function (_, index) { return index; }).filter(function (index) { return index !== currentIndex; });
      return choices[Math.floor(Math.random() * choices.length)];
    }
    return (currentIndex + direction + tracks.length) % tracks.length;
  }
  function updateButtons() {
    play.innerHTML = audio.paused ? PLAY : PAUSE;
    play.setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
    player.classList.toggle('is-playing', !audio.paused && currentIndex >= 0);
    var songTop = document.getElementById('songPlayTop');
    if (songTop && currentIndex >= 0) songTop.textContent = audio.paused ? 'Play song' : 'Pause song';
    var songDisc = document.getElementById('songDisc');
    if (songDisc) songDisc.classList.toggle('is-playing', !audio.paused && currentIndex >= 0);
    document.querySelectorAll('.js-label-play').forEach(function (button) {
      var index = parseInt(button.getAttribute('data-label-track') || '0', 10);
      var isCurrent = index === currentIndex;
      var isPlaying = isCurrent && !audio.paused;
      button.innerHTML = isPlaying ? PAUSE : PLAY;
      button.classList.toggle('is-playing', isPlaying);
      var row = button.closest('.single-track-row');
      if (row) row.classList.toggle('is-playing', isPlaying);
      if (tracks[index]) button.setAttribute('aria-label', isPlaying ? 'Pause ' + tracks[index].name : 'Play ' + tracks[index].name);
    });
    window.dispatchEvent(new CustomEvent('melation:playerstate', { detail: { playing: !audio.paused && currentIndex >= 0, hasTrack: currentIndex >= 0, track: currentIndex >= 0 ? tracks[currentIndex] : null } }));
  }
  function updateNavState() {
    var disabled = tracks.length <= 1 || isLiveRoom();
    prev.disabled = disabled;
    next.disabled = disabled;
    shuffleButton.disabled = isLiveRoom();
    repeatButton.disabled = isLiveRoom();
    queueButton.disabled = isLiveRoom();
    if (isLiveRoom()) { queuePanel.hidden = true; queueButton.setAttribute('aria-expanded', 'false'); }
    prev.classList.toggle('disabled', disabled);
    next.classList.toggle('disabled', disabled);
  }
  window.melationPreparePrivateAudio = function () {
    if (!privateReleasePage || !tracks[0] || !audio.paused || audio.src) return;
    audio.src = tracks[0].src;
    audio.load();
  };
  function loadTrack(index, autoplay, preserveSavedPlayback) {
    if (!tracks[index]) return;
    if (autoplay && !requireListenerAccount()) return;
    currentIndex = index;
    var track = tracks[index];
    communityPlayedFor = '';
    communityLastReportedTime = 0;
    var trackUrl = new URL(track.src, document.baseURI).href;
    if (audio.src !== trackUrl) audio.src = track.src;
    art.src = track.art;
    name.textContent = track.name;
    artist.textContent = track.artist;
    seek.value = 0;
    current.textContent = '0:00';
    duration.textContent = '0:00';
    player.classList.toggle('is-exclusive', !!track.exclusive);
    expand.href = track.page || ('songs/song.html?track=' + encodeURIComponent(track.id));
    expand.hidden = false;
    expand.setAttribute('aria-label', 'Open ' + track.name + ' song page');
    expand.setAttribute('title', 'Open ' + track.name + ' song page');
    player.classList.add('open');
    play.disabled = false;
    document.body.classList.add('has-label-player');
    updateSeekFill(0);
    updateButtons();
    updateNavState();
    renderQueue();
    if (autoplay) audio.play().catch(function () {});
    if (!preserveSavedPlayback) saveState();
  }
  window.melationPlayTrack = function (index) {
    if (!tracks[index]) return;
    if (isLiveRoom() && index !== currentIndex) return false;
    if (index === currentIndex) {
      if (audio.paused) { if (!requireListenerAccount()) return; audio.play().catch(function () {}); } else audio.pause();
    } else {
      loadTrack(index, true);
    }
  };
  window.melationPlayTrackById = function (trackId) {
    var index = tracks.findIndex(function (track) { return track.id === trackId; });
    if (isLiveRoom() && (index < 0 || index !== currentIndex)) return false;
    if (index < 0) {
      // A playlist may not contain the song whose own page was opened. Restore
      // the appropriate catalog queue so the page can always play its own song.
      tracks = (privateReleasePage ? [{ id:'10-20', name:'10:20', artist:'MT', src:'singles/10-20/assets/MT - 1020.MP3', art:'singles/10-20/assets/1020.png', page:'songs/song.html?track=10-20' }] : ALL_TRACKS)
        .map(function (track) { return Object.assign({}, track); });
      index = tracks.findIndex(function (track) { return track.id === trackId; });
      currentIndex = -1;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      renderQueue();
      updateNavState();
    }
    if (index >= 0) window.melationPlayTrack(index);
  };
  window.melationSetQueue = function (queue) {
    if (privateReleasePage || isLiveRoom() || !Array.isArray(queue) || !queue.length) return false;
    tracks = queue.map(function (track) { return { id:track.id, name:track.name || track.title, artist:track.artist, src:track.src, art:track.art, page:track.page || track.href }; });
    currentIndex = -1;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    player.classList.remove('open', 'is-playing');
    updateNavState();
    updateButtons();
    renderQueue();
    return true;
  };
  window.melationPlayerIsPlaying = function () { return !audio.paused && currentIndex >= 0; };
  window.melationPlayerHasTrack = function () { return currentIndex >= 0; };
  window.melationPausePlayer = function () { audio.pause(); };
  window.melationResumePlayer = function () { if (!requireListenerAccount()) return false; if (currentIndex < 0) return window.melationPlayAllShuffled(); audio.play().catch(function () {}); return true; };
  window.melationSetShuffle = function (value) { shuffle = !!value; updateModes(); saveState(); };
  window.melationSetLiveRoom = function (room) {
    if (!room || !room.id) return false;
    liveRoom = { id:String(room.id), name:String(room.name || 'Listening Room'), viewerCount:Math.max(0, Number(room.viewerCount) || 0), viewers:Array.isArray(room.viewers) ? room.viewers.filter(Boolean).slice(0, 12) : [] };
    updateLiveRoom(); saveState(); return true;
  };
  window.melationUpdateLiveRoom = function (room) {
    if (!isLiveRoom() || !room || String(room.id) !== liveRoom.id) return false;
    liveRoom.viewerCount = Math.max(0, Number(room.viewerCount) || 0);
    liveRoom.viewers = Array.isArray(room.viewers) ? room.viewers.filter(Boolean).slice(0, 12) : [];
    updateLiveRoom(); saveState(); return true;
  };
  window.melationLeaveLiveRoom = function () {
    if (!isLiveRoom()) return false;
    var previousRoom = liveRoom;
    var keepPlaying = !audio.paused;
    liveRoom = null;
    updateLiveRoom(); saveState();
    window.dispatchEvent(new CustomEvent('melation:leave-live-room', { detail:{ id:previousRoom.id } }));
    if (keepPlaying) audio.play().catch(function () {});
    return true;
  };
  window.melationPlayAllShuffled = function () {
    if (isLiveRoom()) return false;
    if (!requireListenerAccount()) return false;
    tracks = ALL_TRACKS.map(function (track) { return Object.assign({}, track); });
    currentIndex = -1;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    shuffle = true;
    updateModes();
    renderQueue();
    updateNavState();
    loadTrack(Math.floor(Math.random() * tracks.length), true);
    return true;
  };

  play.addEventListener('click', function () {
    if (!requireListenerAccount()) return;
    if (currentIndex < 0) loadTrack(0, false);
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
  });
  prev.addEventListener('click', function () { if (!isLiveRoom() && currentIndex >= 0 && tracks.length > 1) loadTrack(nextTrackIndex(-1), true); });
  next.addEventListener('click', function () { if (!isLiveRoom() && currentIndex >= 0 && tracks.length > 1) loadTrack(nextTrackIndex(1), true); });
  shuffleButton.addEventListener('click', function () { if (isLiveRoom()) return; shuffle = !shuffle; updateModes(); saveState(); });
  repeatButton.addEventListener('click', function () { if (isLiveRoom()) return; repeat = !repeat; updateModes(); saveState(); });
  queueButton.addEventListener('click', function () { if (isLiveRoom()) return; var open = queuePanel.hidden; queuePanel.hidden = !open; queueButton.setAttribute('aria-expanded', String(open)); });
  queueClose.addEventListener('click', function () { queuePanel.hidden = true; queueButton.setAttribute('aria-expanded', 'false'); });
  queueList.addEventListener('click', function (event) { if (isLiveRoom()) return; var item = event.target.closest('[data-queue-index]'); if (!item) return; var index = Number(item.getAttribute('data-queue-index')); if (isFinite(index)) loadTrack(index, true); });
  roomChatButton.addEventListener('click', function () { if (!isLiveRoom()) return; if (roomChatPanel.hidden) openRoomChat(); else closeRoomChat(); });
  roomChatClose.addEventListener('click', closeRoomChat);
  roomChatForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var body = roomChatInput.value.trim();
    if (!body || !isLiveRoom()) return;
    if (!requireListenerAccount()) return;
    roomChatSend.disabled = true;
    setRoomChatStatus('Sending…');
    var roomId = liveRoom.id;
    loadRoomChatApi().then(function (api) {
      if (!isLiveRoom() || liveRoom.id !== roomId) return Promise.reject(new Error('You left the room.'));
      var user = chatUser();
      return api.addDoc(roomChatReference(api, roomId), { author:user.name, authorKey:user.key, body:body.slice(0, 300), createdAtMs:Date.now() });
    }).then(function () {
      roomChatInput.value = '';
      setRoomChatStatus('');
    }).catch(function () {
      setRoomChatStatus('Could not send your message.');
    }).finally(function () {
      if (isLiveRoom()) roomChatSend.disabled = false;
    });
  });
  leaveRoomButton.addEventListener('click', function () { window.melationLeaveLiveRoom(); });
  close.addEventListener('click', function () {
    if (isLiveRoom()) { window.melationLeaveLiveRoom(); return; }
    audio.pause(); player.classList.remove('open'); document.body.classList.remove('has-label-player'); saveState();
  });
  volumeButton.addEventListener('click', function () { muted = !muted; if (!muted && volume === 0) volume = 1; updateVolume(); saveState(); });
  function volumeFromPointer(event) {
    var rect = volumeTrack.getBoundingClientRect();
    return Math.max(0, Math.min(1, (rect.bottom - event.clientY) / rect.height));
  }
  var volumeDragging = false;
  var volumeMoved = false;
  var volumeStartY = 0;
  volumeTrack.addEventListener('pointerdown', function (event) {
    volumeDragging = true;
    volumeMoved = false;
    volumeStartY = event.clientY;
    volumeTrack.setPointerCapture(event.pointerId);
  });
  volumeTrack.addEventListener('pointermove', function (event) {
    if (!volumeDragging) return;
    if (Math.abs(event.clientY - volumeStartY) > 4) volumeMoved = true;
    if (volumeMoved) { volume = volumeFromPointer(event); muted = false; updateVolume(); }
  });
  volumeTrack.addEventListener('pointerup', function () {
    if (!volumeDragging) return;
    volumeDragging = false;
    if (!volumeMoved) { muted = !muted; if (!muted && volume === 0) volume = 1; updateVolume(); }
    saveState();
  });
  volumeTrack.addEventListener('pointercancel', function () { volumeDragging = false; });
  seek.addEventListener('input', function () { seeking = true; updateSeekFill(seek.value); if (audio.duration) current.textContent = formatTime((seek.value / 100) * audio.duration); });
  seek.addEventListener('change', function () { if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration; seeking = false; saveState(); });
  audio.addEventListener('timeupdate', function () { if (!seeking && audio.duration) { var pct = (audio.currentTime / audio.duration) * 100; seek.value = pct; updateSeekFill(pct); current.textContent = formatTime(audio.currentTime); } if (window.MelationCommunity && currentIndex >= 0 && !audio.paused && audio.currentTime - communityLastReportedTime >= 10) { var listenedSeconds = audio.currentTime - communityLastReportedTime; communityLastReportedTime = audio.currentTime; window.MelationCommunity.recordListen(tracks[currentIndex].id, listenedSeconds); } });
  audio.addEventListener('loadedmetadata', function () { duration.textContent = formatTime(audio.duration); });
  audio.addEventListener('play', function () { if (currentIndex >= 0 && communityPlayedFor !== tracks[currentIndex].id) { communityPlayedFor = tracks[currentIndex].id; if (window.MelationCommunity) window.MelationCommunity.recordPlay(tracks[currentIndex].id); } updateButtons(); saveState(); });
  audio.addEventListener('pause', function () { updateButtons(); saveState(navigationResumeIntent ? true : undefined); });
  audio.addEventListener('ended', function () { if (repeat && currentIndex >= 0) loadTrack(currentIndex, true); else if (tracks.length > 1) loadTrack(nextTrackIndex(1), true); else { audio.currentTime = 0; updateButtons(); } });
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    var href = link.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;
    if (currentIndex >= 0 && !audio.paused) {
      navigationResumeIntent = true;
      saveState(true);
    }
  }, true);
  window.addEventListener('beforeunload', function () {
    if (currentIndex >= 0 && !audio.paused) navigationResumeIntent = true;
    saveState(navigationResumeIntent ? true : undefined);
  });
  window.addEventListener('pagehide', function () { saveState(navigationResumeIntent ? true : undefined); });
  updateVolume();
  updateModes();
  renderQueue();
  updateNavState();
  document.querySelectorAll('.js-label-play').forEach(function (button) {
    button.addEventListener('click', function () {
      var index = parseInt(button.getAttribute('data-label-track') || '0', 10);
      index = isFinite(index) && tracks[index] ? index : 0;
      if (index === currentIndex) {
        if (audio.paused) { if (!requireListenerAccount()) return; audio.play().catch(function () {}); } else audio.pause();
      } else if (!isLiveRoom()) {
        loadTrack(index, true);
      }
    });
  });
  var songTopButton = document.getElementById('songPlayTop');
  if (songTopButton && mount.getAttribute('data-song-track') !== null) {
    songTopButton.addEventListener('click', function () {
      var trackId = mount.getAttribute('data-song-track-id');
      if (trackId && window.melationPlayTrackById) {
        window.melationPlayTrackById(trackId);
      } else {
        window.melationPlayTrack(parseInt(mount.getAttribute('data-song-track') || '0', 10));
      }
    });
  }

  var saved = readState();
  if (saved) {
    volume = typeof saved.volume === 'number' ? saved.volume : volume;
    muted = !!saved.muted;
    shuffle = !!saved.shuffle;
    repeat = !!saved.repeat;
    liveRoom = saved.liveRoom && saved.liveRoom.id ? saved.liveRoom : null;
    updateVolume();
    updateModes();
    updateLiveRoom();
  }
  if (saved && saved.open && !privateReleaseLocked) {
    var shouldResume = !!saved.playing;
    // 10:20 is deliberately a one-song release: never import another page's
    // queue into it, or its play/next/previous controls can point at album songs.
    if (!privateReleasePage && Array.isArray(saved.queue) && saved.queue.length) tracks = saved.queue.map(function (track) { return { id:track.id, name:track.name, artist:track.artist, src:track.src, art:track.art, page:track.page, exclusive:!!track.exclusive }; });
    var savedIndex = tracks.findIndex(function (track) { return track.src === saved.src; });
    if (savedIndex >= 0) {
      loadTrack(savedIndex, false, true);
      audio.addEventListener('loadedmetadata', function () { if (saved.currentTime && audio.duration) audio.currentTime = Math.min(saved.currentTime, audio.duration); }, { once: true });
      if (shouldResume) {
        var resumeSavedTrack = function () {
          audio.play().catch(function () {
            var resumeOnGesture = function () { audio.play().catch(function () {}); };
            document.addEventListener('pointerdown', resumeOnGesture, { once: true, capture: true });
            document.addEventListener('keydown', resumeOnGesture, { once: true, capture: true });
          });
        };
        if (audio.readyState >= 2) resumeSavedTrack(); else audio.addEventListener('canplay', resumeSavedTrack, { once: true });
      }
    }
  } else if (!saved && !privateReleaseLocked) {
    var initialIndex = parseInt(mount.getAttribute('data-label-start') || '0', 10);
    if (isFinite(initialIndex) && initialIndex >= 0 && tracks[initialIndex]) loadTrack(initialIndex, false);
  } else if (privateReleasePage && !privateReleaseLocked) {
    window.melationPreparePrivateAudio();
  }
}());
