(function () {
  'use strict';
  var tools = document.getElementById('adminTools');
  if (!tools) return;
  var config = window.MELATION_FIREBASE_CONFIG || {};
  var LOCAL_KEY = 'melationAdminDownloadKeys';
  var SESSION_KEY = 'melationAdminUnlocked';
  var songs = [
    { id: '01', title: 'A Dreams A Mystery' },
    { id: '02', title: 'Nightmare Fuel' },
    { id: '11', title: "Nawaf's Stole Pain" },
    { id: '10-20', title: '10:20' }
  ];
  var section = document.createElement('section');
  section.className = 'admin-download-keys';
  section.innerHTML = '<div class="admin-key-head"><div><p class="label-kicker">Paid downloads</p><h2>Download keys.</h2></div><span>13 digits · $5 per song</span></div>' +
    '<p class="admin-key-intro">Generate a song-specific key after payment. Full keys stay visible in this admin browser; Firestore stores only a hash and the final four digits.</p>' +
    '<div class="admin-key-controls"><label>Song<select id="adminKeySong">' + songs.map(function (song) { return '<option value="' + song.id + '">' + song.title + '</option>'; }).join('') + '</select></label><label>Recipient note<input id="adminKeyRecipient" maxlength="60" placeholder="Optional name or note"></label><button type="button" id="adminKeyGenerate">Generate key</button></div>' +
    '<div class="admin-key-result" id="adminKeyResult" hidden><span>New key</span><code id="adminKeyValue"></code><button type="button" id="adminKeyCopy">Copy key</button></div>' +
    '<p class="admin-key-status" id="adminKeyStatus" role="status" aria-live="polite"></p><div class="admin-key-list" id="adminKeyList"><p class="admin-status">Unlock admin tools to load keys.</p></div>';
  var analytics = tools.querySelector('.admin-analytics');
  if (analytics) tools.insertBefore(section, analytics); else tools.appendChild(section);

  var songSelect = document.getElementById('adminKeySong');
  var recipientInput = document.getElementById('adminKeyRecipient');
  var generateButton = document.getElementById('adminKeyGenerate');
  var result = document.getElementById('adminKeyResult');
  var valueTarget = document.getElementById('adminKeyValue');
  var copyButton = document.getElementById('adminKeyCopy');
  var status = document.getElementById('adminKeyStatus');
  var list = document.getElementById('adminKeyList');
  var loaded = false;
  var rows = [];

  function readLocal() { try { var value = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch (error) { return []; } }
  function writeLocal(value) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(value.slice(0, 500))); } catch (error) {} }
  function digits(value) { return String(value || '').replace(/\D/g, '').slice(0, 13); }
  function formatKey(value) { var item = digits(value); return [item.slice(0, 3), item.slice(3, 6), item.slice(6, 9), item.slice(9, 13)].filter(Boolean).join(' '); }
  function randomKey() {
    var values = new Uint32Array(13);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(values); else for (var index = 0; index < values.length; index++) values[index] = Math.floor(Math.random() * 0xffffffff);
    return Array.from(values).map(function (value) { return String(value % 10); }).join('');
  }
  function decodeValue(value) {
    if (!value) return null;
    if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
    if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue);
    if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue;
    return null;
  }
  function decodeFields(fields) { return Object.fromEntries(Object.entries(fields || {}).map(function (entry) { return [entry[0], decodeValue(entry[1])]; })); }
  function collectionUrl() { return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(config.projectId) + '/databases/(default)/documents/melationSound/main/downloadKeys?pageSize=200&key=' + encodeURIComponent(config.apiKey); }
  function documentUrl(hash) { return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(config.projectId) + '/databases/(default)/documents/melationSound/main/downloadKeys/' + encodeURIComponent(hash) + '?key=' + encodeURIComponent(config.apiKey); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]; }); }
  function localByHash() { return Object.fromEntries(readLocal().map(function (item) { return [item.hash, item]; })); }
  function displayKey(item) { return item.key ? formatKey(item.key) : '••• ••• ••• ' + String(item.keyLast4 || '----'); }
  function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'; }
  function render() {
    list.innerHTML = rows.length ? rows.map(function (item) {
      return '<article class="admin-key-row ' + (item.active ? '' : 'is-inactive') + '"><div><span>' + escapeHtml(item.songTitle || item.songId) + '</span><code>' + escapeHtml(displayKey(item)) + '</code><small>' + escapeHtml(item.recipient || 'No recipient note') + ' · ' + formatDate(item.createdAtMs) + ' · ' + (Number(item.uses) || 0) + ' downloads</small></div><div class="admin-key-actions"><button type="button" data-copy-hash="' + item.hash + '" ' + (item.key ? '' : 'disabled') + '>Copy</button><button type="button" data-toggle-hash="' + item.hash + '">' + (item.active ? 'Deactivate' : 'Activate') + '</button>' + (item.active ? '' : '<button type="button" class="admin-key-delete" data-delete-hash="' + item.hash + '">Delete key</button>') + '</div></article>';
    }).join('') : '<p class="admin-status">No download keys have been generated yet.</p>';
  }
  async function copyText(value) {
    try { await navigator.clipboard.writeText(value); return true; } catch (error) {
      var temporary = document.createElement('input'); temporary.value = value; document.body.appendChild(temporary); temporary.select(); var copied = document.execCommand('copy'); temporary.remove(); return copied;
    }
  }
  async function loadKeys() {
    if (!config.apiKey || !config.projectId) { status.textContent = 'Firebase configuration is missing.'; status.classList.add('is-error'); return; }
    status.textContent = 'Loading download keys…'; status.classList.remove('is-error');
    var local = localByHash();
    try {
      var response = await fetch(collectionUrl());
      if (!response.ok) throw new Error('Publish the updated Firestore rules before using download keys.');
      var payload = await response.json();
      rows = (payload.documents || []).map(function (documentData) {
        var hash = documentData.name.split('/').pop();
        return Object.assign({ hash: hash }, decodeFields(documentData.fields || {}), local[hash] || {});
      }).sort(function (a, b) { return (Number(b.createdAtMs) || 0) - (Number(a.createdAtMs) || 0); });
      status.textContent = rows.length + ' download key' + (rows.length === 1 ? '' : 's') + ' loaded.';
      render(); loaded = true;
    } catch (error) {
      rows = readLocal().sort(function (a, b) { return (Number(b.createdAtMs) || 0) - (Number(a.createdAtMs) || 0); });
      render(); status.textContent = error.message || 'Could not load shared keys.'; status.classList.add('is-error'); loaded = true;
    }
  }
  async function generate() {
    if (!window.MelationAdminAuth) throw new Error('Key hashing is unavailable.');
    if (!config.apiKey || !config.projectId) throw new Error('Firebase configuration is missing.');
    var song = songs.find(function (item) { return item.id === songSelect.value; }) || songs[0];
    var keyDigits = randomKey();
    var hash = await window.MelationAdminAuth.hash(keyDigits);
    var now = Date.now();
    var entry = { hash: hash, key: keyDigits, songId: song.id, songTitle: song.title, keyLast4: keyDigits.slice(-4), active: true, uses: 0, recipient: recipientInput.value.trim(), createdAtMs: now, updatedAtMs: now };
    var body = { fields: { songId: { stringValue: entry.songId }, songTitle: { stringValue: entry.songTitle }, keyLast4: { stringValue: entry.keyLast4 }, active: { booleanValue: true }, uses: { integerValue: '0' }, createdAtMs: { integerValue: String(now) }, updatedAtMs: { integerValue: String(now) } } };
    var response = await fetch(documentUrl(hash), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error('Could not save the key. Publish the updated Firestore rules first.');
    var local = readLocal().filter(function (item) { return item.hash !== hash; }); local.unshift(entry); writeLocal(local);
    valueTarget.textContent = formatKey(keyDigits); result.dataset.keyHash = hash; result.hidden = false; recipientInput.value = ''; rows = [entry].concat(rows.filter(function (item) { return item.hash !== hash; })); render(); status.textContent = 'Key generated for ' + song.title + '. Give it to the buyer after payment.'; status.classList.remove('is-error');
  }
  async function toggle(hash) {
    var item = rows.find(function (row) { return row.hash === hash; });
    if (!item) return;
    var nextActive = !item.active; var now = Date.now();
    var url = new URL(documentUrl(hash)); ['active', 'updatedAtMs'].forEach(function (field) { url.searchParams.append('updateMask.fieldPaths', field); });
    var response = await fetch(url.href, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { active: { booleanValue: nextActive }, updatedAtMs: { integerValue: String(now) } } }) });
    if (!response.ok) throw new Error('Could not change this key.');
    item.active = nextActive; item.updatedAtMs = now;
    var local = readLocal(); var localItem = local.find(function (row) { return row.hash === hash; }); if (localItem) { localItem.active = nextActive; localItem.updatedAtMs = now; writeLocal(local); }
    render(); status.textContent = nextActive ? 'Key activated.' : 'Key deactivated.'; status.classList.remove('is-error');
  }
  async function removeKey(hash) {
    var item = rows.find(function (row) { return row.hash === hash; });
    if (!item) return;
    if (item.active) throw new Error('Deactivate this key before deleting it.');
    if (!window.confirm('Delete this deactivated download key? This cannot be undone.')) return;
    var response = await fetch(documentUrl(hash), { method: 'DELETE' });
    if (!response.ok) throw new Error('Could not delete this key.');
    rows = rows.filter(function (row) { return row.hash !== hash; });
    writeLocal(readLocal().filter(function (row) { return row.hash !== hash; }));
    if (result.dataset.keyHash === hash) { valueTarget.textContent = ''; result.dataset.keyHash = ''; result.hidden = true; }
    render(); status.textContent = 'Deactivated key deleted.'; status.classList.remove('is-error');
  }

  generateButton.addEventListener('click', async function () { generateButton.disabled = true; status.textContent = 'Generating key…'; status.classList.remove('is-error'); try { await generate(); } catch (error) { status.textContent = error.message || 'Could not generate a key.'; status.classList.add('is-error'); } finally { generateButton.disabled = false; } });
  copyButton.addEventListener('click', async function () { if (valueTarget.textContent) { await copyText(valueTarget.textContent); copyButton.textContent = 'Copied'; setTimeout(function () { copyButton.textContent = 'Copy key'; }, 1500); } });
  list.addEventListener('click', async function (event) {
    var copy = event.target.closest('[data-copy-hash]');
    if (copy) { var copyItem = rows.find(function (row) { return row.hash === copy.getAttribute('data-copy-hash'); }); if (copyItem && copyItem.key) { await copyText(formatKey(copyItem.key)); copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy'; }, 1200); } return; }
    var toggleButton = event.target.closest('[data-toggle-hash]');
    if (toggleButton) { toggleButton.disabled = true; try { await toggle(toggleButton.getAttribute('data-toggle-hash')); } catch (error) { status.textContent = error.message || 'Could not update this key.'; status.classList.add('is-error'); } }
    var deleteButton = event.target.closest('[data-delete-hash]');
    if (deleteButton) { deleteButton.disabled = true; try { await removeKey(deleteButton.getAttribute('data-delete-hash')); } catch (error) { status.textContent = error.message || 'Could not delete this key.'; status.classList.add('is-error'); } finally { if (deleteButton.isConnected) deleteButton.disabled = false; } }
  });
  function unlock() { if (!loaded) loadKeys(); }
  window.addEventListener('melation:admin-unlocked', unlock);
  try { if (sessionStorage.getItem(SESSION_KEY) === 'yes') unlock(); } catch (error) {}
}());
