(function () {
  'use strict';

  var catalog = Array.isArray(window.OVO_DRAKE_CATALOG) ? window.OVO_DRAKE_CATALOG : [];
  var list = document.getElementById('ovoTracklist');
  var search = document.getElementById('ovoTrackSearch');
  var count = document.getElementById('ovoTrackCount');
  var playCollection = document.getElementById('ovoPlayCollection');
  if (!list) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character];
    });
  }

  function groupTracks(items) {
    var groups = [];
    var byArtist = new Map();
    items.forEach(function (track) {
      var key = String(track.artist || 'Drake').trim().toLowerCase();
      var group = byArtist.get(key);
      if (!group) {
        group = { name:String(track.artist || 'Drake').trim(), tracks:[] };
        byArtist.set(key, group);
        groups.push(group);
      }
      group.tracks.push(track);
    });
    return groups;
  }

  function updatePlayingState(trackId) {
    list.querySelectorAll('[data-ovo-row]').forEach(function (row) {
      row.classList.toggle('is-playing', row.getAttribute('data-ovo-row') === trackId);
    });
  }

  function render() {
    var query = String(search && search.value || '').trim().toLowerCase();
    var filtered = catalog.filter(function (track) {
      return !query || (String(track.name) + ' ' + String(track.artist)).toLowerCase().indexOf(query) !== -1;
    });
    if (count) count.textContent = filtered.length + (filtered.length === 1 ? ' track' : ' tracks');
    if (!filtered.length) {
      list.innerHTML = '<p class="ovo-empty">No OVO tracks match that search.</p>';
      return;
    }
    var number = 0;
    list.innerHTML = groupTracks(filtered).map(function (group) {
      var rows = group.tracks.map(function (track) {
        var index = catalog.indexOf(track);
        number += 1;
        return '<div class="ovo-track-row" data-ovo-row="' + escapeHtml(track.id) + '">' +
          '<button type="button" class="ovo-track-play" data-ovo-index="' + index + '" aria-label="Play ' + escapeHtml(track.name) + '"><span class="ovo-track-play-icon" aria-hidden="true"></span><span>Play</span></button>' +
          '<span class="ovo-track-number">' + String(number).padStart(3, '0') + '</span>' +
          '<div class="ovo-track-copy"><strong>' + escapeHtml(track.name) + '</strong><small>' + escapeHtml(track.artist) + '</small></div>' +
          '<span class="ovo-track-format">' + escapeHtml(track.format || 'AUDIO') + '</span>' +
          '</div>';
      }).join('');
      return '<section class="ovo-artist-group"><div class="ovo-artist-group-head"><h3>' + escapeHtml(group.name) + '</h3><span>' + group.tracks.length + (group.tracks.length === 1 ? ' track' : ' tracks') + '</span></div>' + rows + '</section>';
    }).join('');
  }

  list.addEventListener('click', function (event) {
    var button = event.target.closest('[data-ovo-index]');
    if (!button || !window.melationPlayTrack) return;
    window.melationPlayTrack(Number(button.getAttribute('data-ovo-index')));
  });
  if (search) search.addEventListener('input', render);
  if (playCollection) playCollection.addEventListener('click', function () {
    if (window.melationPlayTrack && catalog.length) window.melationPlayTrack(0);
  });
  window.addEventListener('melation:playerstate', function (event) {
    var track = event.detail && event.detail.track;
    updatePlayingState(track && track.id ? track.id : '');
    if (playCollection) playCollection.textContent = event.detail && event.detail.playing ? 'Pause current track' : 'Play collection';
  });
  render();
}());
