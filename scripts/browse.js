import { byId, formatDuration, playlistDuration } from './community-data.js';

const config = window.MELATION_FIREBASE_CONFIG || {};
const ROOT = 'melationSound';
const ROOT_ID = 'main';
const SESSION_KEY = 'melationSoundAccount';

function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])); }
function normalize(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, '-'); }
function initials(value) { return String(value || 'Listener').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
function sessionUser() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (error) { return null; } }
function songFor(id) { return byId[id] || {id, title:id, artist:'Melation Sound', art:'assets/melation-sound.png', href:'songs/song.html?track=' + encodeURIComponent(id), seconds:0}; }
function validTrackIds(ids) { return Array.isArray(ids) ? ids.filter(id => byId[id]) : []; }
function decodeValue(value) { if (!value) return null; if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue; if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue); if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue); if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue; if (value.nullValue) return null; if (value.arrayValue) return (value.arrayValue.values || []).map(decodeValue); if (value.mapValue) return decodeFields(value.mapValue.fields || {}); return null; }
function decodeFields(fields) { return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, decodeValue(value)])); }
function firestoreDocument(document) { return {uid:(document.name || '').split('/').pop(), ...decodeFields(document.fields || {})}; }
function firestoreUrl(path, fields) { const url = new URL('https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(config.projectId) + '/databases/(default)/documents/' + path); url.searchParams.set('pageSize', '50'); fields.forEach(field => url.searchParams.append('mask.fieldPaths', field)); url.searchParams.set('key', config.apiKey); return url; }
async function readDocuments(path, fields) { const response = await fetch(firestoreUrl(path, fields)); if (!response.ok) throw new Error('Firestore request failed'); const payload = await response.json(); return payload.documents || []; }
function renderTrack(item, reaction) { return '<li class="browse-track"><img src="' + escapeHtml(item.art) + '" alt=""><span class="browse-track-copy"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.artist) + '</small></span><span class="browse-track-type">' + reaction + '</span></li>'; }
function renderList(items, reaction, empty) { return items.length ? '<ul class="browse-track-list">' + items.map(item => renderTrack(item, reaction)).join('') + '</ul>' : '<p class="browse-empty">' + empty + '</p>'; }
function renderCard(profile) {
  const playlistIds = validTrackIds(profile.playlist?.trackIds);
  const liked = profile.reactions.filter(item => item.type === 'like').map(item => songFor(item.songId));
  const disliked = profile.reactions.filter(item => item.type === 'dislike').map(item => songFor(item.songId));
  const displayName = profile.displayName || profile.username || profile.uid;
  const playlistName = String(profile.playlist?.name || displayName + "'s Playlist").slice(0, 50);
<<<<<<< HEAD
  return '<article class="browse-card"><header class="browse-card-head"><span class="browse-avatar" aria-hidden="true">' + escapeHtml(initials(displayName)) + '</span><div><h2>' + escapeHtml(displayName) + '</h2><p class="browse-handle">@' + escapeHtml(profile.username || profile.uid) + '</p></div><div class="browse-card-actions"><a href="playlist.html?uid=' + encodeURIComponent(profile.uid) + '">Playlist</a><a href="profile.html?uid=' + encodeURIComponent(profile.uid) + '">Profile</a><button type="button" data-copy-url="playlist.html?uid=' + encodeURIComponent(profile.uid) + '">Copy link</button></div></header><div class="browse-card-body"><section class="browse-section"><h3>' + escapeHtml(playlistName) + '</h3><p class="browse-section-meta">' + playlistIds.length + ' tracks · ' + formatDuration(playlistDuration(playlistIds)) + '</p>' + renderList(playlistIds.map(songFor), 'Playlist', 'This playlist is empty.') + '</section><section class="browse-section"><h3>Reactions.</h3><p class="browse-section-meta">' + liked.length + ' liked · ' + disliked.length + ' disliked</p>' + renderList(liked, 'Liked', 'No liked tracks yet.') + renderList(disliked, 'Disliked', 'No disliked tracks yet.') + '</section></div></article>';
}
function setState(message, error = false) { const element = document.getElementById('browseState'); if (element) { element.textContent = message; element.classList.toggle('browse-error', error); } }
function bindCopyLinks() { document.querySelectorAll('[data-copy-url]').forEach(button => button.addEventListener('click', async () => { const url = new URL(button.dataset.copyUrl, location.href); try { await navigator.clipboard.writeText(url.href); button.textContent = 'Copied'; } catch (error) { button.textContent = url.href; } setTimeout(() => { button.textContent = 'Copy link'; }, 1800); })); }
=======
  return '<article class="browse-card"><header class="browse-card-head"><span class="browse-avatar" aria-hidden="true">' + escapeHtml(initials(displayName)) + '</span><div><h2>' + escapeHtml(displayName) + '</h2><p class="browse-handle">@' + escapeHtml(profile.username || profile.uid) + '</p></div><div class="browse-card-actions"><a href="playlist.html?uid=' + encodeURIComponent(profile.uid) + '">Playlist</a><a href="profile.html?uid=' + encodeURIComponent(profile.uid) + '">Profile</a></div></header><div class="browse-card-body"><section class="browse-section"><h3>' + escapeHtml(playlistName) + '</h3><p class="browse-section-meta">' + playlistIds.length + ' tracks · ' + formatDuration(playlistDuration(playlistIds)) + '</p>' + renderList(playlistIds.map(songFor), 'Playlist', 'This playlist is empty.') + '</section><section class="browse-section"><h3>Reactions.</h3><p class="browse-section-meta">' + liked.length + ' liked · ' + disliked.length + ' disliked</p>' + renderList(liked, 'Liked', 'No liked tracks yet.') + renderList(disliked, 'Disliked', 'No disliked tracks yet.') + '</section></div></article>';
}
function setState(message, error = false) { const element = document.getElementById('browseState'); if (element) { element.textContent = message; element.classList.toggle('browse-error', error); } }
>>>>>>> a9a0613323984d442d6daa4717629e94e2d71b23

async function loadProfiles() {
  if (!config.apiKey || !config.projectId || !config.appId) { setState('Firebase is not configured. Public listener collections will appear after Firebase is connected.'); return []; }
  const current = sessionUser()?.usernameKey;
  const accountDocuments = await readDocuments(ROOT + '/' + ROOT_ID + '/accounts', ['displayName', 'username', 'profileImage', 'playlist']);
  const profiles = await Promise.all(accountDocuments.map(async accountDocument => {
    const profile = firestoreDocument(accountDocument);
    if (normalize(profile.uid) === normalize(current)) return null;
    const reactionDocuments = await readDocuments(ROOT + '/' + ROOT_ID + '/accounts/' + encodeURIComponent(profile.uid) + '/reactions', ['songId', 'type']);
    return {...profile, reactions:reactionDocuments.map(firestoreDocument)};
  }));
  return profiles.filter(Boolean).sort((a, b) => String(a.displayName || a.username || a.uid).localeCompare(String(b.displayName || b.username || b.uid)));
}

async function start() {
  try {
    const profiles = await loadProfiles();
    const target = document.getElementById('browseGrid');
    if (!target) return;
    target.innerHTML = profiles.length ? profiles.map(renderCard).join('') : '<p class="browse-empty-state">No other public listener collections are available yet. Create an account, build a playlist, and your public collection can appear here.</p>';
<<<<<<< HEAD
    bindCopyLinks();
=======
>>>>>>> a9a0613323984d442d6daa4717629e94e2d71b23
    if (profiles.length) setState(profiles.length + ' public listener ' + (profiles.length === 1 ? 'collection' : 'collections'));
  } catch (error) {
    setState('Public listener collections are temporarily unavailable. Check the Firestore rules and try again.', true);
  }
}

start();
<<<<<<< HEAD
=======

>>>>>>> a9a0613323984d442d6daa4717629e94e2d71b23
