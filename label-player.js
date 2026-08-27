(function () {
  var mount = document.getElementById('label-player-mount');
  if (!mount) return;

  var privateReleasePage = document.body.classList.contains('private-single-page');
  var privateReleaseLocked = privateReleasePage && document.body.classList.contains('private-locked');
  var tracks = privateReleasePage
    ? [{ id:'10-20', name: '10:20', artist: 'MT', src: 'MT - 1020.MP3', art: '1020.png', length: '00:02:43', bitrate: '192kbps', channels: '2 (stereo)', sampleRate: '44.100 kHz' }]
    : [
        { id:'01', name: 'A Dreams A Mystery', artist: 'Osama, MT', src: 'a-dreams-a-mystery.mp3', art: 'album-cover.png' },
        { id:'02', name: 'Nightmare Fuel', artist: 'Osama, MT and Adam', src: 'Nightmare Fuel.MP3', art: 'Nightmare Fuel.png' },
        { id:'11', name: "Nawaf's Stole Pain", artist: 'Bassam', src: "Nawaf's Stole Pain.MP3", art: "Nawaf's Stole Pain.png", exclusive: true }
      ];
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  var PREV = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM20 6L9 12l11 6z"/></svg>';
  var NEXT = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4 6l11 6-11 6z"/></svg>';
  var VOL = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16.2 9.5a4 4 0 010 5M18.5 7a7.5 7.5 0 010 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';
  var MUTE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';

  var bars = '';
  for (var i = 0; i < 64; i++) bars += '<i style="--bar-delay:' + (i % 9) * 0.08 + 's;--bar-height:' + (8 + ((i * 17) % 20)) + '%"></i>';
  mount.innerHTML = '<div class="label-player" id="labelPlayer" role="region" aria-label="Melation Sound audio player">' +
    '<div class="label-player-inner">' +
      '<div class="label-player-track"><img src="album-cover.png" alt="" id="labelPlayerArt"><div><p id="labelPlayerName">Choose a track</p><p id="labelPlayerArtist">Melation Sound</p></div></div>' +
      '<div class="label-player-controls"><div class="label-player-buttons">' +
        '<button type="button" class="label-player-btn" id="labelPlayerPrev" aria-label="Previous track">' + PREV + '</button>' +
        '<button type="button" class="label-player-btn label-player-play" id="labelPlayerPlay" aria-label="Play" disabled>' + PLAY + '</button>' +
        '<button type="button" class="label-player-btn" id="labelPlayerNext" aria-label="Next track">' + NEXT + '</button>' +
      '</div><div class="label-player-seek-row"><span id="labelPlayerCurrent">0:00</span><input type="range" id="labelPlayerSeek" min="0" max="100" value="0" step="0.1" aria-label="Seek through track"><span id="labelPlayerDuration">0:00</span></div></div>' +
      '<div class="label-player-volume"><button type="button" class="label-player-volume-button" id="labelPlayerVolume" aria-label="Mute">' + VOL + '</button><div class="label-volume-track" id="labelVolumeTrack" role="slider" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="label-volume-fill" id="labelVolumeFill"></div><div class="label-volume-thumb" id="labelVolumeThumb"></div></div></div>' +
      '<button type="button" class="label-player-close" id="labelPlayerClose" aria-label="Close player">✕</button>' +
    '</div><div class="label-player-visualizer" aria-hidden="true">' + bars + '</div></div>';

  var player = document.getElementById('labelPlayer');
  var art = document.getElementById('labelPlayerArt');
  var name = document.getElementById('labelPlayerName');
  var artist = document.getElementById('labelPlayerArtist');
  var play = document.getElementById('labelPlayerPlay');
  var prev = document.getElementById('labelPlayerPrev');
  var next = document.getElementById('labelPlayerNext');
  var close = document.getElementById('labelPlayerClose');
  var volumeButton = document.getElementById('labelPlayerVolume');
  var volumeTrack = document.getElementById('labelVolumeTrack');
  var volumeFill = document.getElementById('labelVolumeFill');
  var volumeThumb = document.getElementById('labelVolumeThumb');
  var seek = document.getElementById('labelPlayerSeek');
  var current = document.getElementById('labelPlayerCurrent');
  var duration = document.getElementById('labelPlayerDuration');
  var audio = new Audio();
  audio.preload = 'auto';
  var currentIndex = -1;
  var volume = 1;
  var muted = false;
  var seeking = false;
  var communityPlayedFor = '';
  var communityLastReportedTime = 0;
  var STATE_KEY = 'melationPlayerState';

  function readState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch (e) { return null; }
  }
  function saveState() {
    if (currentIndex < 0) return;
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ src: tracks[currentIndex].src, currentTime: audio.currentTime || 0, volume: volume, muted: muted, open: player.classList.contains('open') }));
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
  }
  function updateNavState() {
    var disabled = tracks.length <= 1;
    prev.disabled = disabled;
    next.disabled = disabled;
    prev.classList.toggle('disabled', disabled);
    next.classList.toggle('disabled', disabled);
  }
  window.melationPreparePrivateAudio = function () {
    if (!privateReleasePage || !tracks[0] || !audio.paused || audio.src) return;
    audio.src = tracks[0].src;
    audio.load();
  };
  function loadTrack(index, autoplay) {
    if (!tracks[index]) return;
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
    player.classList.add('open');
    play.disabled = false;
    document.body.classList.add('has-label-player');
    updateSeekFill(0);
    updateButtons();
    updateNavState();
    if (autoplay) audio.play().catch(function () {});
    saveState();
  }
  window.melationPlayTrack = function (index) {
    if (!tracks[index]) return;
    if (index === currentIndex) {
      if (audio.paused) audio.play().catch(function () {}); else audio.pause();
    } else {
      loadTrack(index, true);
    }
  };

  play.addEventListener('click', function () {
    if (currentIndex < 0) loadTrack(0, false);
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
  });
  prev.addEventListener('click', function () { if (currentIndex >= 0 && tracks.length > 1) loadTrack((currentIndex - 1 + tracks.length) % tracks.length, true); });
  next.addEventListener('click', function () { if (currentIndex >= 0 && tracks.length > 1) loadTrack((currentIndex + 1) % tracks.length, true); });
  close.addEventListener('click', function () { audio.pause(); player.classList.remove('open'); document.body.classList.remove('has-label-player'); saveState(); });
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
  audio.addEventListener('play', function () { if (currentIndex >= 0 && communityPlayedFor !== tracks[currentIndex].id) { communityPlayedFor = tracks[currentIndex].id; if (window.MelationCommunity) window.MelationCommunity.recordPlay(tracks[currentIndex].id); } updateButtons(); });
  audio.addEventListener('pause', function () { updateButtons(); saveState(); });
  audio.addEventListener('ended', function () { loadTrack((currentIndex + 1) % tracks.length, true); });
  window.addEventListener('pagehide', saveState);
  updateVolume();
  updateNavState();
  document.querySelectorAll('.js-label-play').forEach(function (button) {
    button.addEventListener('click', function () {
      var index = parseInt(button.getAttribute('data-label-track') || '0', 10);
      index = isFinite(index) && tracks[index] ? index : 0;
      if (index === currentIndex) {
        if (audio.paused) audio.play().catch(function () {}); else audio.pause();
      } else {
        loadTrack(index, true);
      }
    });
  });
  var songTopButton = document.getElementById('songPlayTop');
  if (songTopButton && mount.getAttribute('data-song-track') !== null) {
    songTopButton.addEventListener('click', function () {
      window.melationPlayTrack(parseInt(mount.getAttribute('data-song-track') || '0', 10));
    });
  }

  var saved = readState();
  if (saved && saved.open && !privateReleaseLocked) {
    var savedIndex = tracks.findIndex(function (track) { return track.src === saved.src; });
    if (savedIndex >= 0) {
      volume = typeof saved.volume === 'number' ? saved.volume : 1;
      muted = !!saved.muted;
      updateVolume();
      loadTrack(savedIndex, false);
      audio.addEventListener('loadedmetadata', function () { if (saved.currentTime && audio.duration) audio.currentTime = Math.min(saved.currentTime, audio.duration); }, { once: true });
    }
  } else if (!saved && !privateReleaseLocked) {
    var initialIndex = parseInt(mount.getAttribute('data-label-start') || '0', 10);
    if (isFinite(initialIndex) && initialIndex >= 0 && tracks[initialIndex]) loadTrack(initialIndex, false);
  } else if (privateReleasePage && !privateReleaseLocked) {
    window.melationPreparePrivateAudio();
  }
}());
