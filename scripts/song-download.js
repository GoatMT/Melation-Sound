(function () {
  'use strict';
  var config = window.MELATION_FIREBASE_CONFIG || {};
  var tracks = {
    '01': { title: 'A Dreams A Mystery', audio: 'albums/a-broken-dream/assets/a-dreams-a-mystery.mp3' },
    '02': { title: 'Nightmare Fuel', audio: 'albums/a-broken-dream/assets/Nightmare Fuel.MP3' },
    '11': { title: "Nawaf's Stole Pain", audio: "albums/a-broken-dream/assets/Nawaf's Stole Pain.MP3" },
    '10-20': { title: '10:20', audio: 'singles/10-20/assets/MT - 1020.MP3' }
  };
  var params = new URLSearchParams(window.location.search);
  var songId = params.get('track') || '01';
  if (songId === '10:20' || songId === '1020') songId = '10-20';
  var track = tracks[songId];
  var button = document.getElementById('songDownload');
  var gate = document.getElementById('songDownloadGate');
  var close = document.getElementById('songDownloadClose');
  var form = document.getElementById('songDownloadForm');
  var input = document.getElementById('songDownloadKey');
  var status = document.getElementById('songDownloadStatus');
  if (!button || !gate || !close || !form || !input || !status) return;

  function digits(value) { return String(value || '').replace(/\D/g, '').slice(0, 13); }
  function formatKey(value) {
    var valueDigits = digits(value);
    return [valueDigits.slice(0, 3), valueDigits.slice(3, 6), valueDigits.slice(6, 9), valueDigits.slice(9, 13)].filter(Boolean).join(' ');
  }
  function decodeValue(value) {
    if (!value) return null;
    if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
    if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue);
    if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue;
    return null;
  }
  function decodeFields(fields) { return Object.fromEntries(Object.entries(fields || {}).map(function (entry) { return [entry[0], decodeValue(entry[1])]; })); }
  function keyDocumentUrl(hash) {
    return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(config.projectId) + '/databases/(default)/documents/melationSound/main/downloadKeys/' + encodeURIComponent(hash) + '?key=' + encodeURIComponent(config.apiKey);
  }
  function openGate() { gate.hidden = false; document.body.classList.add('has-download-gate'); status.textContent = ''; status.classList.remove('is-error'); input.value = ''; setTimeout(function () { input.focus(); }, 30); }
  function closeGate() { gate.hidden = true; document.body.classList.remove('has-download-gate'); }
  function triggerDownload() {
    var link = document.createElement('a');
    link.href = track.audio;
    link.download = track.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') + '.mp3';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  function updateUseCount(hash, data) {
    if (!config.apiKey || !config.projectId) return;
    var url = new URL(keyDocumentUrl(hash));
    ['uses', 'lastUsedAtMs', 'updatedAtMs'].forEach(function (field) { url.searchParams.append('updateMask.fieldPaths', field); });
    var now = Date.now();
    fetch(url.href, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { uses: { integerValue: String((Number(data.uses) || 0) + 1) }, lastUsedAtMs: { integerValue: String(now) }, updatedAtMs: { integerValue: String(now) } } }) }).catch(function () {});
  }

  if (!track) { button.disabled = true; button.textContent = 'Download unavailable'; }
  button.addEventListener('click', function () { if (track) openGate(); });
  close.addEventListener('click', closeGate);
  gate.addEventListener('click', function (event) { if (event.target === gate) closeGate(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !gate.hidden) closeGate(); });
  input.addEventListener('input', function () { var formatted = formatKey(input.value); if (input.value !== formatted) input.value = formatted; });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var keyDigits = digits(input.value);
    status.classList.remove('is-error');
    if (keyDigits.length !== 13) { status.textContent = 'Enter all 13 digits from your download key.'; status.classList.add('is-error'); return; }
    if (!config.apiKey || !config.projectId || !window.MelationAdminAuth) { status.textContent = 'The download-key service is unavailable right now.'; status.classList.add('is-error'); return; }
    status.textContent = 'Checking key…';
    window.MelationAdminAuth.hash(keyDigits).then(function (hash) {
      return fetch(keyDocumentUrl(hash)).then(function (response) { if (!response.ok) throw new Error('invalid'); return response.json(); }).then(function (documentData) { return { hash: hash, data: decodeFields(documentData.fields || {}) }; });
    }).then(function (result) {
      if (!result.data.active || result.data.songId !== songId) throw new Error('invalid');
      status.textContent = 'Key accepted. Your download is starting…';
      updateUseCount(result.hash, result.data);
      triggerDownload();
      setTimeout(closeGate, 900);
    }).catch(function () { status.textContent = 'That key is invalid, inactive, or belongs to another song.'; status.classList.add('is-error'); input.select(); });
  });
}());
