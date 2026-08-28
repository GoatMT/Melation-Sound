import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const config = window.MELATION_FIREBASE_CONFIG || {};
const ROOT = 'melationSound';
const ROOT_ID = 'main';
const ROOM_OWNER_KEY = 'melationRoomOwnerKey';
const tracks = {
  '01': { title:'A Dreams A Mystery', artist:'Osama, MT', src:'albums/a-broken-dream/assets/a-dreams-a-mystery.mp3', art:'albums/a-broken-dream/assets/album-cover.png', page:'songs/song.html?track=01' },
  '02': { title:'Nightmare Fuel', artist:'Osama, MT and Adam', src:'albums/a-broken-dream/assets/Nightmare Fuel.MP3', art:'albums/a-broken-dream/assets/Nightmare Fuel.png', page:'songs/song.html?track=02' },
  '11': { title:"Nawaf's Stole Pain", artist:'Bassam', src:"albums/a-broken-dream/assets/Nawaf's Stole Pain.MP3", art:"albums/a-broken-dream/assets/Nawaf's Stole Pain.png", page:'songs/song.html?track=11' },
  '10-20': { title:'10:20', artist:'MT', src:'singles/10-20/assets/MT - 1020.MP3', art:'singles/10-20/assets/1020.png', page:'songs/song.html?track=10-20' }
};
const releases = {
  'album-a-broken-dream': { ids:['01','02','11'] },
  'single-10-20': { ids:['10-20'] }
};
const OFFICIAL_ROOMS = [
  { id:'melation-signal-bloom', name:'Signal Bloom', mood:'Official replay', trackIds:['01','02','11'], currentIndex:0, maxListeners:100, host:'Melation Sound', sponsor:'@RealAcronix', sponsorAvatar:'assets/reala-cronix.png', official:true, active:true },
  { id:'melation-midnight-dial', name:'Midnight Dial', mood:'After-hours replay', trackIds:['02','11','01'], currentIndex:0, maxListeners:100, host:'Melation Sound', official:true, active:true }
];
let db = null;
let roomsRef = null;
let remoteRooms = [];
let remoteRoomsReady = false;
let roomCounts = {};
let roomViewers = {};
let presenceUnsubscribers = new Map();
let activePresenceRef = null;
let presenceId = '';

function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function readLocal() { try { const value = JSON.parse(localStorage.getItem('melationListeningRooms') || '[]'); return Array.isArray(value) ? value.filter(room => room && room.owner === 'local' && room.active !== false) : []; } catch (error) { return []; } }
function writeLocal(value) { try { localStorage.setItem('melationListeningRooms', JSON.stringify(value)); } catch (error) {} }
function getOwnerKey() { try { let key = sessionStorage.getItem(ROOM_OWNER_KEY); if (!key) { key = crypto.randomUUID ? crypto.randomUUID() : 'owner-' + Date.now() + '-' + Math.random().toString(36).slice(2); sessionStorage.setItem(ROOM_OWNER_KEY, key); } return key; } catch (error) { return 'owner-' + Date.now(); } }
function currentUser() { return window.MelationCommunity?.user?.() || (() => { try { return JSON.parse(sessionStorage.getItem('melationSoundAccount') || 'null'); } catch (error) { return null; } })(); }
function hasAccount() { return !!currentUser(); }
function roomTrackIds(room) { return Array.isArray(room.trackIds) && room.trackIds.length ? room.trackIds.filter(id => tracks[id]) : ['01']; }
function roomTrack(room) { const ids = roomTrackIds(room); return tracks[ids[Math.max(0, Number(room.currentIndex) || 0) % ids.length]] || tracks['01']; }
function roomCapacity(room) { return Math.max(2, Math.min(100, Number(room.maxListeners) || 100)); }
function allRooms() { const combined = new Map(); remoteRooms.forEach(room => combined.set(room.id, room)); readLocal().forEach(room => { if (!combined.has(room.id)) combined.set(room.id, room); }); OFFICIAL_ROOMS.forEach(room => combined.set(room.id, room)); return Array.from(combined.values()).filter(room => room.active !== false); }
function isOwner(room) { return room.owner === 'local' || (room.ownerKey && room.ownerKey === getOwnerKey()); }
function listenerLabel(room) { if (Object.prototype.hasOwnProperty.call(roomCounts, room.id) && roomCounts[room.id] !== null) return roomCounts[room.id] + (roomCounts[room.id] === 1 ? ' listener' : ' listeners'); return 'Live count unavailable'; }
function viewerNames(room) { return Array.isArray(roomViewers[room.id]) ? roomViewers[room.id] : []; }
function livePayload(room) { return { id:room.id, name:room.name, viewerCount:Number(roomCounts[room.id]) || 0, viewers:viewerNames(room) }; }
function syncLivePlayer(room) { if (window.melationUpdateLiveRoom) window.melationUpdateLiveRoom(livePayload(room)); }
function setStatus(message) { const element = document.getElementById('roomStatus'); if (element) element.textContent = message; }

function render() {
  const list = document.getElementById('roomsList'); if (!list) return;
  const rooms = allRooms();
  const count = document.getElementById('roomsOnlineCount');
  if (count) count.textContent = rooms.length + (rooms.length === 1 ? ' room active' : ' rooms active');
  list.innerHTML = rooms.length ? rooms.map((room, index) => {
    const track = roomTrack(room); const ids = roomTrackIds(room); const names = viewerNames(room); const capacity = roomCapacity(room);
    const sponsor = room.sponsor ? '<div class="room-sponsor"><img src="' + escapeHtml(room.sponsorAvatar || 'assets/reala-cronix.png') + '" alt=""><span>Sponsored by <strong>' + escapeHtml(room.sponsor) + '</strong></span></div>' : '';
    const viewers = names.length ? names.join(', ') : 'No listeners yet';
    return '<article class="room-card ' + (room.sponsor ? 'is-sponsored' : '') + '" style="--room-delay:' + (index * .08) + 's"><div class="room-card-top"><span class="room-status"><i></i> Live</span><span class="room-listeners">' + escapeHtml(listenerLabel(room)) + ' · ' + capacity + ' max</span></div><h3>' + escapeHtml(room.name) + '</h3><p class="room-host">Hosted by ' + escapeHtml(room.host || 'Listener') + '</p>' + sponsor + '<p class="room-viewers"><span>Viewers</span><strong>' + escapeHtml(viewers) + '</strong></p><div class="room-track"><span>Now playing</span><strong>' + escapeHtml(track.title) + '</strong><small>' + escapeHtml(track.artist) + '</small></div><div class="room-card-bottom"><span>' + escapeHtml(room.mood || 'Open studio') + ' · ' + ids.length + ' ' + (ids.length === 1 ? 'track' : 'tracks') + '</span><div class="room-card-actions"><button type="button" data-room-id="' + escapeHtml(room.id) + '">Join room →</button>' + (isOwner(room) ? '<button type="button" class="room-turn-off" data-room-off="' + escapeHtml(room.id) + '">Turn off</button>' : '') + '</div></div></article>';
  }).join('') : '<p class="rooms-empty">No live rooms yet. Create the first one.</p>';
  list.querySelectorAll('[data-room-id]').forEach(button => button.addEventListener('click', () => join(button.dataset.roomId)));
  list.querySelectorAll('[data-room-off]').forEach(button => button.addEventListener('click', () => turnOff(button.dataset.roomOff)));
}

function watchPresence(roomList) {
  const ids = new Set(roomList.map(room => room.id));
  presenceUnsubscribers.forEach((unsubscribe, id) => { if (!ids.has(id)) { unsubscribe(); presenceUnsubscribers.delete(id); delete roomCounts[id]; } });
  roomList.forEach(room => {
    if (presenceUnsubscribers.has(room.id) || !db) return;
    const presenceRef = collection(db, ROOT, ROOT_ID, 'rooms', room.id, 'presence');
    const unsubscribe = onSnapshot(presenceRef, snapshot => {
      const cutoff = Date.now() - 45000;
      const liveListeners = snapshot.docs.map(item => item.data()).filter(item => Number(item.lastSeenMs) > cutoff);
      roomCounts[room.id] = liveListeners.length;
      roomViewers[room.id] = Array.from(new Set(liveListeners.map(item => String(item.viewerName || '').trim()).filter(Boolean))).slice(0, 12);
      syncLivePlayer(room);
      render();
    }, () => { roomCounts[room.id] = null; roomViewers[room.id] = []; syncLivePlayer(room); render(); });
    presenceUnsubscribers.set(room.id, unsubscribe);
  });
}

async function leavePresence() { if (!activePresenceRef) return; const previous = activePresenceRef; activePresenceRef = null; try { await deleteDoc(previous); } catch (error) {} }
async function joinPresence(roomId) {
  if (!db) return;
  await leavePresence();
  presenceId = presenceId || getOwnerKey() + '-' + Math.random().toString(36).slice(2);
  const reference = doc(db, ROOT, ROOT_ID, 'rooms', roomId, 'presence', presenceId);
  activePresenceRef = reference;
  const user = currentUser();
  const viewerName = String(user?.displayName || user?.username || 'Listener').slice(0, 40);
  try { await setDoc(reference, { joinedAtMs: Date.now(), lastSeenMs: Date.now(), viewerName }, { merge:true }); } catch (error) { activePresenceRef = null; }
}

async function join(id) {
  const room = allRooms().find(item => item.id === id); if (!room) return;
  if (!hasAccount()) { if (window.MelationCommunity?.openAuthPrompt) window.MelationCommunity.openAuthPrompt(); setStatus('Sign in or create an account to start listening in this room.'); return; }
  const liveCount = roomCounts[room.id];
  if (Number.isFinite(liveCount) && liveCount >= roomCapacity(room)) { setStatus('This room is full (' + roomCapacity(room) + ' user limit).'); return; }
  const queue = roomTrackIds(room).map(trackId => { const item = tracks[trackId]; return { id:trackId, name:item.title, artist:item.artist, src:item.src, art:item.art, page:item.page }; });
  if (window.melationLeaveLiveRoom) window.melationLeaveLiveRoom();
  if (window.melationSetQueue) window.melationSetQueue(queue);
  if (window.melationSetShuffle) window.melationSetShuffle(false);
  const index = Math.max(0, Math.min(Number(room.currentIndex) || 0, queue.length - 1));
  if (window.melationPlayTrack) window.melationPlayTrack(index);
  if (window.melationSetLiveRoom) window.melationSetLiveRoom(livePayload(room));
  await joinPresence(room.id);
  syncLivePlayer(room);
  setStatus('You joined “' + room.name + '”. Playing ' + roomTrack(room).title + '.');
}

async function turnOff(id) {
  const room = allRooms().find(item => item.id === id); if (!room || !isOwner(room)) return;
  const local = readLocal().filter(item => item.id !== id); writeLocal(local);
  if (db && room.ownerKey) { try { await setDoc(doc(roomsRef, id), { active:false, updatedAtMs:Date.now() }, { merge:true }); } catch (error) { setStatus('Could not turn off the room.'); return; } }
  if (activePresenceRef && room.id === activePresenceRef.parent.parent.id) await leavePresence();
  render(); setStatus('Your room was turned off.');
}

async function createRoom(event) {
  event.preventDefault();
  if (!hasAccount()) { if (window.MelationCommunity?.openAuthPrompt) window.MelationCommunity.openAuthPrompt(); setStatus('Sign in or create an account before opening a room.'); return; }
  const name = document.getElementById('roomName').value.trim();
  const maxListeners = roomCapacity({ maxListeners:document.getElementById('roomLimit').value });
  const selected = Array.from(document.querySelectorAll('input[name="roomRelease"]:checked')).map(input => releases[input.value]).filter(Boolean);
  if (!name || !selected.length) { setStatus('Choose at least one album or single.'); return; }
  const ids = selected.reduce((all, release) => all.concat(release.ids), []);
  const user = currentUser();
  const room = { id:'room-' + Date.now(), name, mood:document.getElementById('roomMood').value, trackIds:ids, currentIndex:0, maxListeners, host:user.displayName || user.username || 'Listener', ownerKey:getOwnerKey(), active:true, createdAtMs:Date.now(), updatedAtMs:Date.now() };
  const local = readLocal(); local.unshift({ ...room, owner:'local' }); writeLocal(local);
  if (db) { try { await setDoc(doc(roomsRef, room.id), room); } catch (error) { setStatus('Room saved on this device. It could not be shared yet.'); } }
  event.target.reset(); updateLimitValue(); document.querySelector('input[name="roomRelease"][value="album-a-broken-dream"]').checked = true; document.getElementById('roomCreatePanel').hidden = true; render(); setStatus('Your room is live.');
}

function initRemote() {
  if (!config.apiKey || !config.projectId || !config.appId) { render(); return; }
  try {
    const app = getApps().find(item => item.name === 'listeningRooms') || initializeApp(config, 'listeningRooms');
    db = getFirestore(app); roomsRef = collection(db, ROOT, ROOT_ID, 'rooms');
    render();
    watchPresence(allRooms());
    onSnapshot(roomsRef, snapshot => { remoteRoomsReady = true; remoteRooms = snapshot.docs.map(item => ({ id:item.id, ...item.data() })).filter(room => room.active !== false); watchPresence(allRooms()); render(); }, () => { remoteRoomsReady = false; remoteRooms = []; watchPresence(allRooms()); render(); });
  } catch (error) { db = null; render(); }
}

const toggle = document.getElementById('roomCreateToggle');
const panel = document.getElementById('roomCreatePanel');
if (toggle && panel) toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; if (!panel.hidden) document.getElementById('roomName').focus(); });
const form = document.getElementById('roomCreateForm');
if (form) form.addEventListener('submit', createRoom);
const limitInput = document.getElementById('roomLimit');
const limitValue = document.getElementById('roomLimitValue');
function updateLimitValue() { if (limitInput && limitValue) limitValue.textContent = limitInput.value + ' user limit'; }
if (limitInput) limitInput.addEventListener('input', updateLimitValue);
updateLimitValue();
setInterval(() => { if (activePresenceRef) setDoc(activePresenceRef, { lastSeenMs:Date.now() }, { merge:true }).catch(() => {}); render(); }, 15000);
window.addEventListener('pagehide', () => { if (activePresenceRef) deleteDoc(activePresenceRef).catch(() => {}); });
window.addEventListener('melation:leave-live-room', () => { leavePresence(); });
initRemote();
