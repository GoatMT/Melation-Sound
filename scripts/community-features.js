import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, collection } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const config = window.MELATION_FIREBASE_CONFIG || {};
const ROOT = 'melationSound';
const ROOT_ID = 'main';
const SESSION_KEY = 'melationSoundAccount';
const LOCAL_KEY = 'melationCommunityDemo';
const catalog = [
  { id: '01', title: 'A Dreams A Mystery', artist: 'Osama, MT', art: 'albums/a-broken-dream/assets/album-cover.png', href: 'songs/song.html?track=01', seconds: 20 },
  { id: '02', title: 'Nightmare Fuel', artist: 'Osama, MT and Adam', art: 'albums/a-broken-dream/assets/Nightmare Fuel.png', href: 'songs/song.html?track=02', seconds: 37 },
  { id: '11', title: "Nawaf's Stole Pain", artist: 'Bassam', art: "albums/a-broken-dream/assets/Nawaf's Stole Pain.png", href: 'songs/song.html?track=11', seconds: 87 },
  { id: '10-20', title: '10:20', artist: 'MT', art: 'singles/10-20/assets/1020.png', href: 'songs/song.html?track=10-20', seconds: 163 }
];
const byId = Object.fromEntries(catalog.map(item => [item.id, item]));
let db = null;
let accounts = null;
let lastUserKey = null;
let lastProfileKey = null;
let ownPlaylist = null;
let playlistBound = false;

function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]); }
function getLocal() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); } catch (error) { return null; } }
function getSessionUser() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (error) { return null; } }
function user() { return window.MelationCommunity && typeof window.MelationCommunity.user === 'function' ? window.MelationCommunity.user() || getSessionUser() : getSessionUser(); }
function normalizePlaylist(value, displayName) { const fallback = (displayName || 'User') + "'s Playlist"; return { name: String(value?.name || fallback).slice(0, 50), trackIds: Array.isArray(value?.trackIds) ? value.trackIds.filter(id => byId[id]) : [], updatedAtMs: Number(value?.updatedAtMs) || 0 }; }
function duration(ids) { return ids.reduce((sum, id) => sum + (byId[id]?.seconds || 0), 0); }
function durationLabel(seconds) { const value = Math.max(0, Math.round(seconds || 0)); const minutes = Math.floor(value / 60); const secs = value % 60; return minutes ? minutes + 'm ' + String(secs).padStart(2, '0') + 's' : secs + 's'; }
function readLocalPlaylist(displayName) { return normalizePlaylist(getLocal()?.playlist, displayName); }
function writeLocalPlaylist(playlist) { const data = getLocal() || { uid: 'local-listener', username: 'local-listener', displayName: 'Local listener' }; data.playlist = playlist; try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch (error) {} }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }

function updateAccountLink(current) {
  document.querySelectorAll('.label-links a').forEach(link => {
    const isAccount = link.dataset.accountLink === 'true' || link.getAttribute('href') === 'community.html' || link.textContent.trim() === 'Account' || link.textContent.trim() === 'Your Profile';
    if (!isAccount) return;
    link.dataset.accountLink = 'true';
    if (!link.dataset.accountDefaultHref) link.dataset.accountDefaultHref = 'community.html';
    if (!link.dataset.accountDefaultText) link.dataset.accountDefaultText = 'Account';
    if (current?.usernameKey) {
      link.href = 'profile.html?uid=' + encodeURIComponent(current.usernameKey);
      link.textContent = 'Your Profile';
      link.setAttribute('aria-label', 'Open your profile');
    } else {
      link.href = link.dataset.accountDefaultHref;
      link.textContent = link.dataset.accountDefaultText;
      link.removeAttribute('aria-label');
    }
  });
}

async function initRemote() {
  if (!config.apiKey || !config.projectId || !config.appId) return;
  try {
    const app = getApps().find(item => item.name === 'playlistFeatures') || initializeApp(config, 'playlistFeatures');
    db = getFirestore(app);
    accounts = collection(db, ROOT, ROOT_ID, 'accounts');
  } catch (error) { db = null; }
}
async function readPlaylist(current) {
  if (!current) return null;
  if (!db) return readLocalPlaylist(current.displayName || current.username);
  try { const snapshot = await getDoc(doc(accounts, current.usernameKey)); return normalizePlaylist(snapshot.exists() ? snapshot.data().playlist : null, current.displayName || current.username); } catch (error) { return normalizePlaylist(null, current.displayName || current.username); }
}
async function saveOwnPlaylist(playlist) {
  const current = user();
  if (!current) return false;
  playlist.updatedAtMs = Date.now();
  ownPlaylist = normalizePlaylist(playlist, current.displayName || current.username);
  if (db) await setDoc(doc(accounts, current.usernameKey), { playlist: ownPlaylist }, { merge: true });
  else writeLocalPlaylist(ownPlaylist);
  renderOwnPlaylist();
  return true;
}

function populateTrackSelect() {
  const select = document.getElementById('playlistTrackSelect');
  if (!select || select.options.length) return;
  select.innerHTML = catalog.map(item => '<option value="' + item.id + '">' + escapeHtml(item.title) + ' · ' + escapeHtml(item.artist) + '</option>').join('');
}
function renderOwnPlaylist() {
  const form = document.getElementById('playlistForm');
  const state = document.getElementById('playlistAuthState');
  const list = document.getElementById('playlistTrackList');
  if (!form || !state || !list) return;
  const current = user();
  if (!current) { form.hidden = true; state.textContent = 'Sign in to create your playlist.'; list.innerHTML = ''; return; }
  form.hidden = false;
  state.textContent = 'One public playlist · ' + (ownPlaylist?.trackIds.length || 0) + ' tracks · ' + durationLabel(duration(ownPlaylist?.trackIds || []));
  const name = document.getElementById('playlistName');
  if (name && document.activeElement !== name) name.value = ownPlaylist?.name || (current.displayName || current.username) + "'s Playlist";
  populateTrackSelect();
  const ids = ownPlaylist?.trackIds || [];
  list.innerHTML = ids.length ? ids.map((id, index) => { const item = byId[id]; return '<li class="playlist-track-row"><img src="' + escapeHtml(item.art) + '" alt=""><span class="playlist-track-copy"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.artist) + '</small></span><span class="playlist-track-duration">' + durationLabel(item.seconds) + '</span><button type="button" class="playlist-remove" data-playlist-remove="' + index + '">Remove</button></li>'; }).join('') : '<li class="community-empty">Your playlist is empty. Add a song to get started.</li>';
}
async function addTrack(id) {
  const current = user();
  if (!current) { if (window.MelationCommunity?.openAuthPrompt) window.MelationCommunity.openAuthPrompt(); return false; }
  const playlist = ownPlaylist || await readPlaylist(current);
  if (!playlist.trackIds.includes(id)) playlist.trackIds.push(id);
  await saveOwnPlaylist(playlist);
  return true;
}
async function renderProfilePlaylist() {
  const list = document.getElementById('profilePlaylistList');
  if (!list) return;
  const uid = new URLSearchParams(window.location.search).get('uid') || user()?.usernameKey;
  if (!uid) { list.innerHTML = '<li class="community-empty">Open a listener profile to see their playlist.</li>'; setText('profilePlaylistMeta', ''); return; }
  try {
    let data = null;
    if (db) { const snapshot = await getDoc(doc(accounts, uid)); data = snapshot.exists() ? snapshot.data() : null; }
    else if (uid === (getLocal()?.uid || 'local-listener')) data = getLocal();
    const playlist = normalizePlaylist(data?.playlist, data?.displayName || data?.username || uid);
    setText('profilePlaylistTitle', playlist.name);
    setText('profilePlaylistMeta', playlist.trackIds.length + ' tracks · ' + durationLabel(duration(playlist.trackIds)));
    list.innerHTML = playlist.trackIds.length ? playlist.trackIds.map(id => { const item = byId[id]; return '<li class="profile-song"><img src="' + escapeHtml(item.art) + '" alt=""><span class="profile-song-copy"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.artist) + '</small></span><a class="profile-song-value" href="' + item.href + '">Open</a></li>'; }).join('') : '<li class="community-empty">This playlist is empty.</li>';
  } catch (error) { list.innerHTML = '<li class="community-empty">Playlist data is temporarily unavailable.</li>'; }
}
function bindPlaylistUi() {
  if (playlistBound) return;
  const form = document.getElementById('playlistForm');
  const add = document.getElementById('playlistAddButton');
  const list = document.getElementById('playlistTrackList');
  if (!form || !add || !list) return;
  playlistBound = true;
  form.addEventListener('submit', async event => { event.preventDefault(); const input = document.getElementById('playlistName'); const status = document.getElementById('playlistStatus'); const playlist = ownPlaylist || await readPlaylist(user()); playlist.name = (input?.value || '').trim().slice(0, 50) || ((user()?.displayName || user()?.username || 'User') + "'s Playlist"); status.textContent = 'Saving…'; try { await saveOwnPlaylist(playlist); status.textContent = 'Playlist saved.'; } catch (error) { status.textContent = 'Could not save your playlist.'; } });
  add.addEventListener('click', async () => { const id = document.getElementById('playlistTrackSelect')?.value; const status = document.getElementById('playlistStatus'); if (!id) return; status.textContent = 'Adding…'; try { await addTrack(id); status.textContent = 'Song added to your playlist.'; } catch (error) { status.textContent = 'Could not update your playlist.'; } });
  list.addEventListener('click', async event => { const button = event.target.closest('[data-playlist-remove]'); if (!button || !ownPlaylist) return; ownPlaylist.trackIds.splice(Number(button.dataset.playlistRemove), 1); try { await saveOwnPlaylist(ownPlaylist); setText('playlistStatus', 'Song removed.'); } catch (error) { setText('playlistStatus', 'Could not update your playlist.'); } });
}
function bindSongPlaylist() {
  const button = document.getElementById('songPlaylistAdd');
  if (!button || button.dataset.bound) return;
  button.dataset.bound = 'true';
  const key = new URLSearchParams(window.location.search).get('track') || '01';
  button.addEventListener('click', async () => { const current = user(); if (!current) { if (window.MelationCommunity?.openAuthPrompt) window.MelationCommunity.openAuthPrompt(); return; } try { await addTrack(key); button.textContent = 'In your playlist'; button.disabled = true; } catch (error) { button.textContent = 'Try again'; } });
}
async function refresh() {
  const current = user();
  updateAccountLink(current);
  bindPlaylistUi();
  bindSongPlaylist();
  if (current?.usernameKey && current.usernameKey !== lastUserKey) { lastUserKey = current.usernameKey; ownPlaylist = await readPlaylist(current); renderOwnPlaylist(); }
  if (!current && lastUserKey) { lastUserKey = null; ownPlaylist = null; renderOwnPlaylist(); }
  const profileKey = document.getElementById('profilePlaylistList') ? (new URLSearchParams(window.location.search).get('uid') || current?.usernameKey || '') : '';
  if (profileKey && profileKey !== lastProfileKey) { lastProfileKey = profileKey; renderProfilePlaylist(); }
}

await initRemote();
setInterval(refresh, 700);
refresh();
