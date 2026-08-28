import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const config = window.MELATION_FIREBASE_CONFIG || {};
const ROOT = 'melationSound';
const ROOT_ID = 'main';
const ROOM_OWNER_KEY = 'melationRoomOwnerKey';
const tracks = {
  '01': { title:'A Dreams A Mystery', artist:'Osama, MT', src:'albums/a-broken-dream/assets/a-dreams-a-mystery.mp3', art:'albums/a-broken-dream/assets/album-cover.png', page:'songs/song.html?track=01', seconds:20 },
  '02': { title:'Nightmare Fuel', artist:'Osama, MT and Adam', src:'albums/a-broken-dream/assets/Nightmare Fuel.MP3', art:'albums/a-broken-dream/assets/Nightmare Fuel.png', page:'songs/song.html?track=02', seconds:37 },
  '11': { title:"Nawaf's Stole Pain", artist:'Bassam', src:"albums/a-broken-dream/assets/Nawaf's Stole Pain.MP3", art:"albums/a-broken-dream/assets/Nawaf's Stole Pain.png", page:'songs/song.html?track=11', seconds:87 },
  '10-20': { title:'10:20', artist:'MT', src:'singles/10-20/assets/MT - 1020.MP3', art:'singles/10-20/assets/1020.png', page:'songs/song.html?track=10-20', seconds:163 }
};
const releases = {
  'album-a-broken-dream': { ids:['01','02','11'] },
  'single-10-20': { ids:['10-20'] }
};
const OFFICIAL_ROOMS = [
  { id:'melation-signal-bloom', name:'Signal Bloom', mood:'Official replay', trackIds:['01','02','11'], maxListeners:100, host:'Melation Sound', sponsor:'@RealAcronix', sponsorAvatar:'assets/reala-cronix.png', loopStartedAtMs:Date.UTC(2026,7,28,0,0,0), official:true, active:true },
  { id:'melation-midnight-dial', name:'Midnight Dial', mood:'After-hours replay', trackIds:['02','11','01'], maxListeners:100, host:'Melation Sound', loopStartedAtMs:Date.UTC(2026,7,28,0,0,0), official:true, active:true }
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
let lastPlaybackSignature = '';
let lastPlaybackSyncMs = 0;
let lastPresenceHeartbeatMs = 0;
let sharedRoomsReady = false;
let sharedRoomsError = '';
const PRESENCE_HEARTBEAT_MS = 4000;
const PRESENCE_STALE_AFTER_MS = 12000;

function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function readLocal() { try { const value = JSON.parse(localStorage.getItem('melationListeningRooms') || '[]'); return Array.isArray(value) ? value.filter(room => room && room.owner === 'local' && room.active !== false) : []; } catch (error) { return []; } }
function writeLocal(value) { try { localStorage.setItem('melationListeningRooms', JSON.stringify(value)); } catch (error) {} }
function getOwnerKey() { try { let key = sessionStorage.getItem(ROOM_OWNER_KEY); if (!key) { key = crypto.randomUUID ? crypto.randomUUID() : 'owner-' + Date.now() + '-' + Math.random().toString(36).slice(2); sessionStorage.setItem(ROOM_OWNER_KEY, key); } return key; } catch (error) { return 'owner-' + Date.now(); } }
function currentUser() { return window.MelationCommunity?.user?.() || (() => { try { return JSON.parse(sessionStorage.getItem('melationSoundAccount') || 'null'); } catch (error) { return null; } })(); }
function hasAccount() { return !!currentUser(); }
function roomTrackIds(room) { return Array.isArray(room.trackIds) && room.trackIds.length ? room.trackIds.filter(id => tracks[id]) : ['01']; }
function roomPlayback(room, nowMs=Date.now()) { const ids=roomTrackIds(room); const total=ids.reduce((sum,id)=>sum+(Number(tracks[id]?.seconds)||1),0)||1; let remaining=((Math.max(0,nowMs-Number(room.loopStartedAtMs||room.createdAtMs||nowMs))/1000)%total); for(let index=0;index<ids.length;index+=1){const seconds=Number(tracks[ids[index]]?.seconds)||1;if(remaining<seconds)return { index, offset:remaining, track:tracks[ids[index]]||tracks['01'] };remaining-=seconds;}return { index:0, offset:0, track:tracks[ids[0]]||tracks['01'] }; }
function roomTrack(room) { return roomPlayback(room).track; }
function roomCapacity(room) { return Math.max(2, Math.min(100, Number(room.maxListeners) || 100)); }
function allRooms() { const combined = new Map(); remoteRooms.forEach(room => combined.set(room.id, room)); readLocal().forEach(room => { if (!combined.has(room.id)) combined.set(room.id, room); }); OFFICIAL_ROOMS.forEach(room => combined.set(room.id, room)); return Array.from(combined.values()).filter(room => room.active !== false); }
function isOwner(room) { return room.owner === 'local' || (room.ownerKey && room.ownerKey === getOwnerKey()); }
function listenerLabel(room) { if (Object.prototype.hasOwnProperty.call(roomCounts, room.id) && roomCounts[room.id] !== null) return roomCounts[room.id] + (roomCounts[room.id] === 1 ? ' listener' : ' listeners'); return 'Live count unavailable'; }
function viewerEntries(room) { return Array.isArray(roomViewers[room.id]) ? roomViewers[room.id] : []; }
function viewerNames(room) { return viewerEntries(room).map(viewer => viewer.viewerName).filter(Boolean); }
function livePayload(room) { return { id:room.id, name:room.name, viewerCount:Number(roomCounts[room.id]) || 0, viewers:viewerNames(room) }; }
function syncLivePlayer(room) { if (window.melationUpdateLiveRoom) window.melationUpdateLiveRoom(livePayload(room)); }
function ensureLiveStatus() { let element=document.getElementById('roomsLiveStatus'); if (element) return element; const heading=document.querySelector('.rooms-section-head'); if (!heading) return null; element=document.createElement('p'); element.id='roomsLiveStatus'; element.className='rooms-live-status'; element.setAttribute('role','status'); element.setAttribute('aria-live','polite'); heading.insertAdjacentElement('afterend',element); return element; }
function setStatus(message, isError=false) { const element = document.getElementById('roomStatus'); if (element) element.textContent = message; const live=ensureLiveStatus(); if (live) { live.textContent=message||''; live.classList.toggle('is-error',!!isError); } }
function ensureHostRailStyles() { if (document.getElementById('roomHostRailStyles')) return; const style=document.createElement('style'); style.id='roomHostRailStyles'; style.textContent='.room-card-top{position:relative!important;min-height:20px!important;padding-top:0!important}.room-listeners{position:absolute!important;top:2px!important;right:0!important;text-align:right!important}.room-live-badge{top:0!important;left:0!important}.room-host-open-button{margin-left:auto;min-height:38px;padding:0 15px;border:1px solid #1979c9;background:#071624;color:#92cbff;font:700 10px/1 "Space Mono",monospace;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.room-host-open-button:hover,.room-host-open-button:focus-visible{background:#0c2942;color:#fff;outline:none}@media (max-width:640px){.rooms-command-bar{align-items:flex-start!important;gap:12px!important}.room-host-open-button{min-height:36px;padding:0 11px;font-size:9px}}@media (min-width:1281px){.rooms-stage.has-host-panel{display:block!important}.rooms-stage.has-host-panel .rooms-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.room-host-panel{position:fixed!important;left:10px!important;top:120px!important;width:272px!important;max-height:calc(100vh - 140px)!important;overflow:auto!important;z-index:350!important}.room-host-panel h3{font-size:30px!important}.room-host-panel-meta{font-size:8px!important}.room-host-viewer{padding:10px!important}.room-host-panel-note{font-size:8px!important}}'; document.head.appendChild(style); }

function ensureHostPanel() {
  const list = document.getElementById('roomsList'); if (!list) return null;
  let stage = document.getElementById('roomsStage');
  if (!stage) { stage=document.createElement('div'); stage.id='roomsStage'; stage.className='rooms-stage'; list.parentNode.insertBefore(stage,list); stage.appendChild(list); }
  let panel = document.getElementById('roomHostPanel');
  if (!panel) { panel=document.createElement('aside'); panel.id='roomHostPanel'; panel.className='room-host-panel'; panel.hidden=true; stage.insertBefore(panel,list); }
  return panel;
}
function renderHostPanel(rooms) {
  ensureHostRailStyles();
  const panel=ensureHostPanel(); if (!panel) return;
  const room=rooms.find(isOwner);
  const stage=panel.parentElement;
  if (!room) { panel.hidden=true; stage.classList.remove('has-host-panel'); return; }
  const viewers=viewerEntries(room); panel.hidden=false; stage.classList.add('has-host-panel');
  panel.innerHTML='<p class="label-kicker">Host controls</p><h3>'+escapeHtml(room.name)+'</h3><p class="room-host-panel-meta">'+viewers.length+' of '+roomCapacity(room)+' listeners · live room</p><div class="room-host-viewer-list">'+(viewers.length ? viewers.map(viewer=>'<div class="room-host-viewer"><span><strong>'+escapeHtml(viewer.viewerName||'Listener')+'</strong><small>Listening now</small></span>'+(viewer.id===presenceId?'<em>You</em>':'<button type="button" data-room-kick="'+escapeHtml(room.id)+'" data-viewer-id="'+escapeHtml(viewer.id)+'" data-viewer-name="'+escapeHtml(viewer.viewerName||'Listener')+'">Kick</button>')+'</div>').join(''):'<p class="room-host-empty">No listeners are in your room yet.</p>')+'</div><p class="room-host-panel-note">Kicked listeners are removed from this live session.</p>';
  panel.querySelectorAll('[data-room-kick]').forEach(button=>button.addEventListener('click',()=>kickViewer(button.dataset.roomKick,button.dataset.viewerId,button.dataset.viewerName)));
}
function ensureFullDialog() {
  let dialog=document.getElementById('roomFullDialog'); if (dialog) return dialog;
  dialog=document.createElement('div'); dialog.id='roomFullDialog'; dialog.className='room-full-dialog'; dialog.hidden=true;
  dialog.innerHTML='<div class="room-full-backdrop" data-room-full-close></div><section class="room-full-card" role="dialog" aria-modal="true" aria-labelledby="roomFullTitle"><button type="button" class="room-full-close" data-room-full-close aria-label="Close">×</button><p class="label-kicker">Listening Rooms · live capacity</p><h2 id="roomFullTitle">This Room Is Full.</h2><p id="roomFullCopy">This room has reached its listener limit.</p><div class="room-full-actions"><button type="button" id="roomFullAsk">Ask To Join</button><button type="button" class="secondary" data-room-full-close>Find another room</button></div><p id="roomFullStatus" role="status" aria-live="polite"></p></section>';
  document.body.appendChild(dialog); dialog.querySelectorAll('[data-room-full-close]').forEach(button=>button.addEventListener('click',()=>{dialog.hidden=true;})); return dialog;
}
function showFullDialog(room) { const dialog=ensureFullDialog(); dialog.dataset.roomId=room.id; dialog.querySelector('#roomFullCopy').textContent=room.name+' has reached its '+roomCapacity(room)+' listener limit.'; dialog.querySelector('#roomFullStatus').textContent=''; dialog.hidden=false; dialog.querySelector('#roomFullAsk').onclick=()=>requestToJoin(room,dialog); dialog.querySelector('#roomFullAsk').focus(); }
async function requestToJoin(room,dialog) { const status=dialog.querySelector('#roomFullStatus'); if (!db) { status.textContent='Your request is saved only on this device until Firebase reconnects.'; return; } const user=currentUser(); try { await setDoc(doc(db,ROOT,ROOT_ID,'rooms',room.id,'requests',getOwnerKey()),{viewerName:String(user?.displayName||user?.username||'Listener').slice(0,40),viewerKey:String(user?.usernameKey||getOwnerKey()),createdAtMs:Date.now(),status:'pending'}); status.textContent='Request sent to the host.'; } catch (error) { status.textContent='Could not send your request. Try again shortly.'; } }
async function kickViewer(roomId,viewerId,viewerName) { if (!db) { setStatus('Viewer controls need Firebase to remove a listener.'); return; } try { await setDoc(doc(db,ROOT,ROOT_ID,'rooms',roomId,'presence',viewerId),{kicked:true,kickedAtMs:Date.now()},{merge:true}); setStatus(viewerName+' was removed from your room.'); } catch (error) { setStatus('Could not remove that listener.'); } }

function render() {
  const list = document.getElementById('roomsList'); if (!list) return;
  const rooms = allRooms();
  const count = document.getElementById('roomsOnlineCount');
  if (count) count.textContent = rooms.length + (rooms.length === 1 ? ' room active' : ' rooms active');
  list.innerHTML = rooms.length ? rooms.map((room, index) => {
    const track = roomTrack(room); const ids = roomTrackIds(room); const names = viewerNames(room); const capacity = roomCapacity(room);
    const sponsor = room.sponsor ? '<div class="room-sponsor"><img src="' + escapeHtml(room.sponsorAvatar || 'assets/reala-cronix.png') + '" alt=""><span>Sponsored by <strong>' + escapeHtml(room.sponsor) + '</strong></span></div>' : '';
    const viewers = names.length ? names.join(', ') : 'No listeners yet';
    return '<article class="room-card ' + (room.sponsor ? 'is-sponsored' : '') + '" style="--room-delay:' + (index * .08) + 's"><div class="room-card-top"><span class="room-status room-live-badge"><i></i> Live now</span><span class="room-listeners">' + escapeHtml(listenerLabel(room)) + ' · ' + capacity + ' max</span></div><h3>' + escapeHtml(room.name) + '</h3><p class="room-host">Hosted by ' + escapeHtml(room.host || 'Listener') + '</p>' + sponsor + '<p class="room-viewers"><span>Viewers</span><strong>' + escapeHtml(viewers) + '</strong></p><div class="room-track"><span>Now playing</span><strong>' + escapeHtml(track.title) + '</strong><small>' + escapeHtml(track.artist) + '</small></div><div class="room-card-bottom"><span>' + escapeHtml(room.mood || 'Open studio') + ' · ' + ids.length + ' ' + (ids.length === 1 ? 'track' : 'tracks') + '</span><div class="room-card-actions"><button type="button" data-room-id="' + escapeHtml(room.id) + '">Join room →</button>' + (isOwner(room) ? '<button type="button" class="room-turn-off" data-room-off="' + escapeHtml(room.id) + '">Turn off</button>' : '') + '</div></div></article>';
  }).join('') : '<p class="rooms-empty">No live rooms yet. Create the first one.</p>';
  list.querySelectorAll('[data-room-id]').forEach(button => button.addEventListener('click', () => join(button.dataset.roomId)));
  list.querySelectorAll('[data-room-off]').forEach(button => button.addEventListener('click', () => turnOff(button.dataset.roomOff)));
  renderHostPanel(rooms);
}

function watchPresence(roomList) {
  const ids = new Set(roomList.map(room => room.id));
  presenceUnsubscribers.forEach((unsubscribe, id) => { if (!ids.has(id)) { unsubscribe(); presenceUnsubscribers.delete(id); delete roomCounts[id]; } });
  roomList.forEach(room => {
    if (presenceUnsubscribers.has(room.id) || !db) return;
    const presenceRef = collection(db, ROOT, ROOT_ID, 'rooms', room.id, 'presence');
    const unsubscribe = onSnapshot(presenceRef, snapshot => {
      const cutoff = Date.now() - PRESENCE_STALE_AFTER_MS;
      const entries = snapshot.docs.map(item => ({ id:item.id, ...item.data() }));
      const kicked = entries.find(item => item.id === presenceId && item.kicked === true);
      if (kicked) { leavePresence(); if (window.melationLeaveLiveRoom) window.melationLeaveLiveRoom(); setStatus('You were removed from this listening room by its host.'); }
      const liveListeners = entries.filter(item => !item.kicked && Number(item.lastSeenMs) > cutoff);
      roomCounts[room.id] = liveListeners.length;
      roomViewers[room.id] = liveListeners.map(item => ({ id:item.id, viewerName:String(item.viewerName || '').trim(), viewerKey:String(item.viewerKey || '') })).filter(item => item.viewerName).slice(0, 40);
      syncLivePlayer(room);
      render();
    }, () => { roomCounts[room.id] = null; roomViewers[room.id] = []; syncLivePlayer(room); render(); });
    presenceUnsubscribers.set(room.id, unsubscribe);
  });
}

async function leavePresence() {
  if (!activePresenceRef) return;
  const previous = activePresenceRef;
  const roomId = previous.parent.parent.id;
  activePresenceRef = null;
  lastPresenceHeartbeatMs = 0;
  if (presenceId && Array.isArray(roomViewers[roomId])) {
    roomViewers[roomId] = roomViewers[roomId].filter(viewer => viewer.id !== presenceId);
    roomCounts[roomId] = roomViewers[roomId].length;
    render();
  }
  try { await deleteDoc(previous); } catch (error) {}
}
async function joinPresence(roomId) {
  if (!db) return;
  await leavePresence();
  presenceId = presenceId || getOwnerKey() + '-' + Math.random().toString(36).slice(2);
  const reference = doc(db, ROOT, ROOT_ID, 'rooms', roomId, 'presence', presenceId);
  activePresenceRef = reference;
  const user = currentUser();
  const viewerName = String(user?.displayName || user?.username || 'Listener').slice(0, 40);
  try {
    const now = Date.now();
    await setDoc(reference, { joinedAtMs: now, lastSeenMs: now, viewerName, viewerKey:String(user?.usernameKey || presenceId), kicked:false }, { merge:true });
    lastPresenceHeartbeatMs = now;
    const viewers = Array.isArray(roomViewers[roomId]) ? roomViewers[roomId].filter(viewer => viewer.id !== presenceId) : [];
    roomViewers[roomId] = viewers.concat({ id:presenceId, viewerName, viewerKey:String(user?.usernameKey || presenceId) });
    roomCounts[roomId] = roomViewers[roomId].length;
    render();
  } catch (error) { activePresenceRef = null; lastPresenceHeartbeatMs = 0; }
}

async function join(id) {
  const room = allRooms().find(item => item.id === id); if (!room) return;
  if (!hasAccount()) { if (window.melationOpenAccountGate) window.melationOpenAccountGate(); setStatus('Make an account or sign in to join this room.'); return; }
  const liveCount = roomCounts[room.id];
  if (Number.isFinite(liveCount) && liveCount >= roomCapacity(room)) { showFullDialog(room); return; }
  const queue = roomTrackIds(room).map(trackId => { const item = tracks[trackId]; return { id:trackId, name:item.title, artist:item.artist, src:item.src, art:item.art, page:item.page }; });
  if (window.melationLeaveLiveRoom) window.melationLeaveLiveRoom();
  if (window.melationSetQueue) window.melationSetQueue(queue);
  if (window.melationSetShuffle) window.melationSetShuffle(false);
  if (window.melationSetRepeat) window.melationSetRepeat(false);
  const playback=roomPlayback(room);
  const index = Math.max(0, Math.min(playback.index, queue.length - 1));
  if (window.melationPlayTrack) window.melationPlayTrack(index);
  if (window.melationSetLiveRoom) window.melationSetLiveRoom(livePayload(room));
  if (window.melationSyncLiveRoomTrack) window.melationSyncLiveRoomTrack(index,playback.offset);
  await joinPresence(room.id);
  syncLivePlayer(room);
  setStatus('You joined “' + room.name + '” in progress. Playing ' + playback.track.title + '.');
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
  if (!hasAccount()) { if (window.melationOpenAccountGate) window.melationOpenAccountGate(); setStatus('Make an account or sign in before opening a room.'); return; }
  if (!db || !roomsRef) { setStatus(sharedRoomsError || 'Shared rooms are still connecting. Please try again in a moment.',true); return; }
  const name = document.getElementById('roomName').value.trim();
  const maxListeners = roomCapacity({ maxListeners:document.getElementById('roomLimit').value });
  const selected = Array.from(document.querySelectorAll('input[name="roomRelease"]:checked')).map(input => releases[input.value]).filter(Boolean);
  if (!name || !selected.length) { setStatus('Choose at least one album or single.'); return; }
  const ids = selected.reduce((all, release) => all.concat(release.ids), []);
  const user = currentUser();
  const createdAtMs=Date.now();
  const room = { id:'room-' + createdAtMs, name, mood:document.getElementById('roomMood').value, trackIds:ids, currentIndex:0, maxListeners, host:user.displayName || user.username || 'Listener', ownerKey:getOwnerKey(), active:true, loopStartedAtMs:createdAtMs, createdAtMs, updatedAtMs:createdAtMs };
  try { await setDoc(doc(roomsRef, room.id), room); } catch (error) { setStatus('Could not create a shared room. Publish the current Firestore rules, then try again.',true); return; }
  const local = readLocal(); local.unshift({ ...room, owner:'local' }); writeLocal(local);
  event.target.reset(); updateLimitValue(); document.querySelector('input[name="roomRelease"][value="album-a-broken-dream"]').checked = true; document.getElementById('roomCreatePanel').hidden = true; render(); setStatus('Your room is live.');
}

function initRemote() {
  if (!config.apiKey || !config.projectId || !config.appId) { sharedRoomsError='Shared rooms need Firebase before rooms can be created for everyone.'; render(); setStatus(sharedRoomsError,true); return; }
  try {
    const app = getApps().find(item => item.name === 'listeningRooms') || initializeApp(config, 'listeningRooms');
    db = getFirestore(app); roomsRef = collection(db, ROOT, ROOT_ID, 'rooms');
    render();
    watchPresence(allRooms());
    onSnapshot(roomsRef, snapshot => { remoteRoomsReady = true; sharedRoomsReady = true; sharedRoomsError = ''; remoteRooms = snapshot.docs.map(item => ({ id:item.id, ...item.data() })).filter(room => room.active !== false); watchPresence(allRooms()); render(); }, () => { remoteRoomsReady = false; sharedRoomsReady = false; sharedRoomsError = 'Shared rooms are unavailable. Publish the current Firestore rules, then reload.'; remoteRooms = []; watchPresence(allRooms()); render(); setStatus(sharedRoomsError,true); });
  } catch (error) { db = null; sharedRoomsError='Shared rooms could not connect. Check Firebase, then reload.'; render(); setStatus(sharedRoomsError,true); }
}

const panel = document.getElementById('roomCreatePanel');
function ensureRoomCreateToggle() {
  let toggle = document.getElementById('roomCreateToggle');
  if (!toggle) {
    const commandBar = document.querySelector('.rooms-command-bar');
    if (!commandBar) return;
    ensureHostRailStyles();
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'roomCreateToggle';
    toggle.className = 'room-host-open-button';
    toggle.textContent = 'Host a room';
    toggle.setAttribute('aria-controls', 'roomCreatePanel');
    commandBar.appendChild(toggle);
  }
  if (!panel) return;
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) document.getElementById('roomName').focus();
  });
}
ensureRoomCreateToggle();
const form = document.getElementById('roomCreateForm');
if (form) form.addEventListener('submit', createRoom);
const limitInput = document.getElementById('roomLimit');
const limitValue = document.getElementById('roomLimitValue');
function updateLimitValue() { if (limitInput && limitValue) limitValue.textContent = limitInput.value + ' user limit'; }
if (limitInput) limitInput.addEventListener('input', updateLimitValue);
updateLimitValue();
setInterval(() => { const now=Date.now(); if (activePresenceRef && now-lastPresenceHeartbeatMs>=PRESENCE_HEARTBEAT_MS) { lastPresenceHeartbeatMs=now; setDoc(activePresenceRef, { lastSeenMs:now }, { merge:true }).catch(() => { lastPresenceHeartbeatMs=0; }); } const signature=allRooms().map(room=>room.id+':'+roomPlayback(room,now).index).join('|'); const changed=signature!==lastPlaybackSignature; if(changed){lastPlaybackSignature=signature;render();} if(activePresenceRef && (changed || now-lastPlaybackSyncMs>=10000)){const room=allRooms().find(item=>item.id===activePresenceRef.parent.parent.id);const playback=room&&roomPlayback(room,now);if(playback&&window.melationSyncLiveRoomTrack){window.melationSyncLiveRoomTrack(playback.index,playback.offset);lastPlaybackSyncMs=now;}} }, 1000);
window.addEventListener('pagehide', () => { if (activePresenceRef) deleteDoc(activePresenceRef).catch(() => {}); });
window.addEventListener('melation:leave-live-room', () => { leavePresence(); });
initRemote();
