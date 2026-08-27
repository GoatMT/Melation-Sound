import { initializeApp } from 'https://cdn.jsdelivr.net/npm/firebase@12.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'https://cdn.jsdelivr.net/npm/firebase@12.1.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, runTransaction, serverTimestamp } from 'https://cdn.jsdelivr.net/npm/firebase@12.1.0/firebase-firestore.js';

const catalog = [
  { id:'01', title:'A Dreams A Mystery', artist:'Osama, MT', art:'album-cover.png', href:'song.html?track=01' },
  { id:'02', title:'Nightmare Fuel', artist:'Osama, MT and Adam', art:'Nightmare Fuel.png', href:'song.html?track=02' },
  { id:'11', title:"Nawaf's Stole Pain", artist:'Bassam', art:"Nawaf's Stole Pain.png", href:'song.html?track=11' },
  { id:'10-20', title:'10:20', artist:'MT', art:'1020.png', href:'song.html?track=10-20', private:true }
];
const catalogById = Object.fromEntries(catalog.map(item => [item.id, item]));
const config = window.MELATION_FIREBASE_CONFIG || {};
const configured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
const LOCAL_KEY = 'melationCommunityDemo';
const AUTH_DOMAIN = 'accounts.melationsound.com';
let app = null;
let auth = null;
let db = null;
let currentUser = null;
let profile = null;

function localRead() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null') || { displayName:'Local listener', uid:'local-listener', totalSeconds:0, uniqueSongs:0, songs:{}, reactions:{} }; }
  catch (error) { return { displayName:'Local listener', uid:'local-listener', totalSeconds:0, uniqueSongs:0, songs:{}, reactions:{} }; }
}
function localWrite(value) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(value)); } catch (error) {} }
function formatDuration(seconds) {
  seconds = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return hours + 'h ' + minutes + 'm';
  return minutes + 'm ' + String(seconds % 60).padStart(2, '0') + 's';
}
function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])); }
function songInfo(id) { return catalogById[id] || { id, title:id, artist:'Melation Sound', art:'melation-sound.png', href:'song.html?track=' + encodeURIComponent(id) }; }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
function setSetup(message) { const element = document.getElementById('communitySetup'); if (element) { element.hidden = false; element.textContent = message; } const profileState = document.getElementById('profileState'); if (profileState) profileState.textContent = message; }
function normalizeUsername(value) { return String(value || '').trim().toLowerCase(); }
function authEmailFor(username) { return normalizeUsername(username) + '@' + AUTH_DOMAIN; }
function authPasswordFor(pin) { return 'MelationPIN:' + pin; }
function readCredentials() { const username = normalizeUsername(document.getElementById('communityDisplayName')?.value); const pin = document.getElementById('communityPassword')?.value || ''; if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new Error('Username must be 3–20 characters using letters, numbers, or underscores.'); if (!/^\d{6}$/.test(pin)) throw new Error('PIN must be exactly 6 digits.'); return {username, pin}; }

function setSongCounts(stats) {
  setText('songLikeCount', stats.likes || 0);
  setText('songDislikeCount', stats.dislikes || 0);
  const like = document.getElementById('songLike');
  const dislike = document.getElementById('songDislike');
  if (like) { like.classList.toggle('is-active', stats.reaction === 'like'); like.setAttribute('aria-pressed', String(stats.reaction === 'like')); }
  if (dislike) { dislike.classList.toggle('is-active', stats.reaction === 'dislike'); dislike.setAttribute('aria-pressed', String(stats.reaction === 'dislike')); }
}
function localSongStats(id) {
  const data = localRead();
  const engagement = window.MelationEngagement ? window.MelationEngagement.get(id) : { views:0, likes:0, dislikes:0 };
  return { views:engagement.views || 0, likes:engagement.likes || 0, dislikes:engagement.dislikes || 0, reaction:data.reactions[id] || engagement.reaction || null };
}
function localCommentData(id) {
  const data = localRead();
  data.comments = data.comments || {};
  data.comments[id] = data.comments[id] || [];
  return data;
}
function renderComments(comments) {
  const target = document.getElementById('songCommentList');
  if (!target) return;
  if (!comments.length) { target.innerHTML = '<p class="song-comment-empty">No comments yet. Start the conversation.</p>'; return; }
  target.innerHTML = comments.map(comment => '<article class="song-comment"><div class="song-comment-meta"><strong>' + escapeHtml(comment.displayName || 'Listener') + '</strong><span>' + escapeHtml(comment.createdLabel || 'Listener comment') + '</span></div><p>' + escapeHtml(comment.text) + '</p></article>').join('');
}
function localRenderComments(id) { renderComments(localCommentData(id).comments[id].slice().reverse()); }
function renderListenerRows(rows) {
  const target = document.getElementById('listenerChart');
  if (!target) return;
  if (!rows.length) { target.innerHTML = '<p class="community-empty">No listener profiles yet. Create an account and start playing.</p>'; return; }
  target.innerHTML = rows.map((row, index) => '<a class="listener-row" href="profile.html?uid=' + encodeURIComponent(row.uid) + '"><span class="listener-rank">' + String(index + 1).padStart(2, '0') + '</span><span class="listener-copy"><strong>' + escapeHtml(row.displayName || 'Listener') + '</strong><small>' + (row.uniqueSongs || 0) + ' songs · ' + (row.plays || 0) + ' plays</small></span><span class="listener-value">' + formatDuration(row.totalSeconds) + '<small>listened</small></span></a>').join('');
}
function localListenerRows() {
  const data = localRead();
  return [{ uid:data.uid, displayName:data.displayName, totalSeconds:data.totalSeconds || 0, uniqueSongs:data.uniqueSongs || Object.keys(data.songs || {}).length, plays:Object.values(data.songs || {}).reduce((total, song) => total + (song.plays || 0), 0) }];
}
function renderProfileLists(data) {
  const listened = Object.values(data.songs || {}).sort((a,b) => (b.seconds || 0) - (a.seconds || 0));
  const likes = Object.values(data.reactions || {}).filter(item => item.type === 'like').map(item => item.songId ? {...songInfo(item.songId), ...item} : item);
  const dislikes = Object.values(data.reactions || {}).filter(item => item.type === 'dislike').map(item => item.songId ? {...songInfo(item.songId), ...item} : item);
  const render = (targetId, items, value) => { const target = document.getElementById(targetId); if (!target) return; target.innerHTML = items.length ? items.map(item => '<li class="profile-song"><img src="' + escapeHtml(item.art || songInfo(item.songId).art) + '" alt=""><span class="profile-song-copy"><strong>' + escapeHtml(item.title || songInfo(item.songId).title) + '</strong><small>' + escapeHtml(item.artist || songInfo(item.songId).artist) + '</small></span><span class="profile-song-value">' + escapeHtml(value(item)) + '</span></li>').join('') : '<li class="community-empty">Nothing here yet.</li>'; };
  render('listenedList', listened, item => formatDuration(item.seconds) + ' · ' + (item.plays || 0) + ' plays');
  render('likedList', likes, () => 'Liked');
  render('dislikedList', dislikes, () => 'Disliked');
  setText('profileName', data.displayName || 'Listener');
  setText('profileHandle', '@' + (data.username || String(data.uid || 'listener').slice(0, 12)));
  const stats = document.getElementById('profileStats');
  if (stats) stats.innerHTML = '<div class="profile-stat"><strong>' + formatDuration(data.totalSeconds) + '</strong><span>listened</span></div><div class="profile-stat"><strong>' + (data.uniqueSongs || listened.length) + '</strong><span>songs</span></div><div class="profile-stat"><strong>' + (data.plays || listened.reduce((total, item) => total + (item.plays || 0), 0)) + '</strong><span>plays</span></div>';
}

async function ensureProfile(user, displayName) {
  const reference = doc(db, 'users', user.uid);
  const existing = await getDoc(reference);
  const name = displayName || (existing.exists() && existing.data().displayName) || user.displayName || 'Listener';
  await setDoc(reference, { uid:user.uid, username:normalizeUsername(name), displayName:name, totalSeconds:(existing.exists() && existing.data().totalSeconds) || 0, uniqueSongs:(existing.exists() && existing.data().uniqueSongs) || 0, plays:(existing.exists() && existing.data().plays) || 0, updatedAt:serverTimestamp() }, { merge:true });
}
async function loadRemoteProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  const data = {...snapshot.data(), uid};
  const listens = await getDocs(query(collection(db, 'users', uid, 'listens'), orderBy('seconds', 'desc'), limit(50)));
  const reactions = await getDocs(collection(db, 'users', uid, 'reactions'));
  data.songs = {}; listens.forEach(item => { data.songs[item.id] = {...item.data(), songId:item.id, ...songInfo(item.id)}; });
  data.reactions = {}; reactions.forEach(item => { data.reactions[item.id] = {...item.data(), songId:item.id, ...songInfo(item.id)}; });
  return data;
}
async function remoteReact(id, type) {
  if (!currentUser) { openAuthPrompt(); return null; }
  const songRef = doc(db, 'songs', id);
  const reactionRef = doc(db, 'users', currentUser.uid, 'reactions', id);
  const result = await runTransaction(db, async transaction => {
    const songSnapshot = await transaction.get(songRef);
    const reactionSnapshot = await transaction.get(reactionRef);
    const oldType = reactionSnapshot.exists() ? reactionSnapshot.data().type : null;
    const existing = songSnapshot.exists() ? songSnapshot.data() : {};
    let likes = Number(existing.likes) || 0;
    let dislikes = Number(existing.dislikes) || 0;
    if (oldType === type) { if (type === 'like') likes = Math.max(0, likes - 1); else dislikes = Math.max(0, dislikes - 1); transaction.delete(reactionRef); }
    else { if (oldType === 'like') likes = Math.max(0, likes - 1); if (oldType === 'dislike') dislikes = Math.max(0, dislikes - 1); if (type === 'like') likes += 1; else dislikes += 1; transaction.set(reactionRef, { type, songId:id, updatedAt:serverTimestamp() }); }
    transaction.set(songRef, { id, title:songInfo(id).title, artist:songInfo(id).artist, art:songInfo(id).art, likes, dislikes, updatedAt:serverTimestamp() }, { merge:true });
    return { likes, dislikes, reaction:oldType === type ? null : type };
  });
  setSongCounts(result);
  return result;
}
async function recordListen(id, seconds) {
  if (!seconds || seconds < 1) return;
  if (!configured || !db || !currentUser) {
    const data = localRead(); const item = data.songs[id] || {...songInfo(id), songId:id, seconds:0, plays:0}; item.seconds = (item.seconds || 0) + seconds; data.songs[id] = item; data.totalSeconds = (data.totalSeconds || 0) + seconds; data.uniqueSongs = Object.keys(data.songs).length; localWrite(data); return;
  }
  const userRef = doc(db, 'users', currentUser.uid);
  const listenRef = doc(db, 'users', currentUser.uid, 'listens', id);
  await runTransaction(db, async transaction => {
    const userSnapshot = await transaction.get(userRef); const listenSnapshot = await transaction.get(listenRef);
    const userData = userSnapshot.exists() ? userSnapshot.data() : {}; const listenData = listenSnapshot.exists() ? listenSnapshot.data() : {};
    transaction.set(listenRef, { songId:id, title:songInfo(id).title, artist:songInfo(id).artist, art:songInfo(id).art, seconds:(listenData.seconds || 0) + seconds, plays:listenData.plays || 1, updatedAt:serverTimestamp() }, { merge:true });
    transaction.set(userRef, { uid:currentUser.uid, username:normalizeUsername(currentUser.displayName || 'listener'), displayName:currentUser.displayName || 'Listener', totalSeconds:(userData.totalSeconds || 0) + seconds, uniqueSongs:(userData.uniqueSongs || 0) + (listenSnapshot.exists() ? 0 : 1), plays:userData.plays || 1, updatedAt:serverTimestamp() }, { merge:true });
  });
}
function recordPlay(id) {
  const data = localRead(); data.songs[id] = data.songs[id] || {...songInfo(id), songId:id, seconds:0, plays:0}; data.songs[id].plays = (data.songs[id].plays || 0) + 1; data.uniqueSongs = Object.keys(data.songs).length; localWrite(data);
  if (!configured || !db || !currentUser) return;
  const userRef = doc(db, 'users', currentUser.uid); const listenRef = doc(db, 'users', currentUser.uid, 'listens', id);
  runTransaction(db, async transaction => { const userSnapshot = await transaction.get(userRef); const listenSnapshot = await transaction.get(listenRef); const userData = userSnapshot.exists() ? userSnapshot.data() : {}; const listenData = listenSnapshot.exists() ? listenSnapshot.data() : {}; transaction.set(listenRef, {songId:id,title:songInfo(id).title,artist:songInfo(id).artist,art:songInfo(id).art,seconds:listenData.seconds || 0,plays:(listenData.plays || 0) + 1,updatedAt:serverTimestamp()},{merge:true}); transaction.set(userRef,{username:normalizeUsername(currentUser.displayName || 'listener'),displayName:currentUser.displayName || 'Listener',plays:(userData.plays || 0) + 1,uniqueSongs:(userData.uniqueSongs || 0) + (listenSnapshot.exists() ? 0 : 1),updatedAt:serverTimestamp()},{merge:true}); }).catch(() => {});
}
function recordView(id) {
  if (window.MelationEngagement) window.MelationEngagement.recordView(id);
  if (!configured || !db || !currentUser) return;
  let viewed = {};
  try { viewed = JSON.parse(sessionStorage.getItem('melationFirebaseViewedSongs') || '{}'); } catch (error) {}
  if (viewed[id]) return;
  viewed[id] = true;
  try { sessionStorage.setItem('melationFirebaseViewedSongs', JSON.stringify(viewed)); } catch (error) {}
  const reference = doc(db, 'songs', id);
  runTransaction(db, async transaction => { const snapshot = await transaction.get(reference); const data = snapshot.exists() ? snapshot.data() : {}; transaction.set(reference, {id, title:songInfo(id).title, artist:songInfo(id).artist, art:songInfo(id).art, views:(data.views || 0) + 1, likes:data.likes || 0, dislikes:data.dislikes || 0, updatedAt:serverTimestamp()}, {merge:true}); }).catch(() => {});
}
function openAuthPrompt() { const input = document.getElementById('communityEmail'); if (input) { input.focus(); input.scrollIntoView({behavior:'smooth',block:'center'}); } setText('songCommentNote', 'Sign in on the Listeners page to react or comment.'); }
function bindAuth() {
  const form = document.getElementById('communityAuthForm'); const create = document.getElementById('communityCreate'); const signOutButton = document.getElementById('communitySignOut');
  if (!form || !configured) return;
  form.addEventListener('submit', async event => { event.preventDefault(); const status = document.getElementById('communityAuthStatus'); try { const credentials = readCredentials(); status.textContent = 'Signing in…'; await signInWithEmailAndPassword(auth, authEmailFor(credentials.username), authPasswordFor(credentials.pin)); status.textContent = ''; } catch (error) { status.textContent = error.message.indexOf('Username') === 0 || error.message.indexOf('PIN') === 0 ? error.message : 'Could not sign in. Check the username and PIN.'; } });
  create.addEventListener('click', async () => { const status = document.getElementById('communityAuthStatus'); try { const credentials = readCredentials(); status.textContent = 'Creating account…'; const result = await createUserWithEmailAndPassword(auth, authEmailFor(credentials.username), authPasswordFor(credentials.pin)); await updateProfile(result.user, {displayName:credentials.username}); await ensureProfile(result.user, credentials.username); status.textContent = ''; } catch (error) { status.textContent = error.message.indexOf('Username') === 0 || error.message.indexOf('PIN') === 0 ? error.message : 'That username may already be taken. Try another one.'; } });
  if (signOutButton) signOutButton.addEventListener('click', () => signOut(auth));
}
function updateAccountUi() {
  const authPanel = document.getElementById('communityAuth'); const userPanel = document.getElementById('communityUser');
  if (!authPanel || !userPanel) return;
  if (currentUser) { authPanel.style.display = 'none'; userPanel.classList.add('is-visible'); setText('communityUserName', currentUser.displayName || 'Listener'); setText('communityUserEmail', '@' + normalizeUsername(currentUser.displayName || 'listener')); const link = document.getElementById('communityProfileLink'); if (link) link.href = 'profile.html?uid=' + encodeURIComponent(currentUser.uid); }
  else { authPanel.style.display = ''; userPanel.classList.remove('is-visible'); }
}
function renderLocalAccount() { const userPanel = document.getElementById('communityUser'); const authPanel = document.getElementById('communityAuth'); if (!userPanel || !authPanel) return; authPanel.style.display = 'none'; userPanel.classList.add('is-visible'); const data = localRead(); setText('communityUserName', data.displayName); setText('communityUserEmail', 'Demo mode · saved on this device'); const link = document.getElementById('communityProfileLink'); if (link) link.href = 'profile.html?uid=local-listener'; }
function bindComments(id) {
  const form = document.getElementById('songCommentForm'); const text = document.getElementById('songCommentText'); if (!form || !text) return;
  form.addEventListener('submit', async event => { event.preventDefault(); const value = text.value.trim(); if (!value) return; if (configured && db && currentUser) { await addDoc(collection(db, 'songs', id, 'comments'), {uid:currentUser.uid, displayName:currentUser.displayName || 'Listener', text:value, createdAt:serverTimestamp()}); } else if (configured && !currentUser) { openAuthPrompt(); return; } else { const data = localCommentData(id); data.comments[id].push({displayName:data.displayName, text:value, createdLabel:'Just now'}); localWrite(data); localRenderComments(id); } text.value = ''; });
}
function renderSongCommunity(id) {
  if (!document.getElementById('songCommentList')) return;
  bindComments(id);
  if (!configured || !db) { setSongCounts(localSongStats(id)); localRenderComments(id); setText('songCommentNote', 'Demo mode: comments and reactions are saved on this device until Firebase is connected.'); return; }
  onSnapshot(doc(db, 'songs', id), snapshot => { const data = snapshot.exists() ? snapshot.data() : {}; setSongCounts({...data, reaction:localSongStats(id).reaction}); });
  const commentsQuery = query(collection(db, 'songs', id, 'comments'), orderBy('createdAt', 'desc'), limit(50));
  onSnapshot(commentsQuery, snapshot => renderComments(snapshot.docs.map(item => ({...item.data(), createdLabel:item.data().createdAt ? 'Listener' : 'Just now'}))), () => setText('songCommentNote', 'Comments are temporarily unavailable.'));
  setText('songCommentNote', currentUser ? 'Signed in. Keep it respectful.' : 'Sign in on the Listeners page to comment.');
}
function watchSongReaction(id) {
  if (!currentUser || !db) return;
  let songData = {};
  let reaction = null;
  const update = () => setSongCounts({...songData, reaction});
  onSnapshot(doc(db, 'songs', id), snapshot => { songData = snapshot.exists() ? snapshot.data() : {}; update(); });
  onSnapshot(doc(db, 'users', currentUser.uid, 'reactions', id), snapshot => { reaction = snapshot.exists() ? snapshot.data().type : null; update(); });
}
function renderRemoteListeners() {
  if (!document.getElementById('listenerChart')) return;
  const listenerQuery = query(collection(db, 'users'), orderBy('totalSeconds', 'desc'), limit(25));
  onSnapshot(listenerQuery, snapshot => renderListenerRows(snapshot.docs.map(item => ({...item.data(), uid:item.id}))), () => setText('listenerChart', 'Listener chart is not available yet.'));
}
function renderRemoteProfile(uid) { loadRemoteProfile(uid).then(data => { if (data) { renderProfileLists(data); setText('profileState', 'Shared Firebase profile'); } else setText('profileState', 'This listener profile does not exist yet.'); }).catch(() => setText('profileState', 'Profile data is temporarily unavailable.')); }
function renderLocalProfile() { renderProfileLists(localRead()); setText('profileState', 'Demo profile · saved on this device until Firebase is connected.'); }

function renderRemoteSongCharts() {
  if (!document.getElementById('viewsChart')) return;
  onSnapshot(collection(db, 'songs'), snapshot => {
    const stats = {}; snapshot.forEach(item => { stats[item.id] = item.data(); });
    ['views','likes','dislikes'].forEach(metric => { const target = document.getElementById(metric === 'views' ? 'viewsChart' : metric === 'likes' ? 'likesChart' : 'dislikesChart'); if (!target) return; const rows = catalog.slice().sort((a,b) => ((stats[b.id] && stats[b.id][metric] || 0) - (stats[a.id] && stats[a.id][metric] || 0)) || a.title.localeCompare(b.title)); const max = Math.max(1, ...rows.map(item => stats[item.id] && stats[item.id][metric] || 0)); target.innerHTML = rows.map((item,index) => { const value = stats[item.id] && stats[item.id][metric] || 0; return '<a class="chart-row" href="' + item.href + '"><span class="chart-rank">' + String(index + 1).padStart(2,'0') + '</span><img src="' + item.art + '" alt=""><span class="chart-song"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.artist) + (item.private ? ' · Private' : '') + '</small><i style="width:' + Math.max(8, Math.round(value / max * 100)) + '%"></i></span><span class="chart-value">' + value + '<small>' + metric + '</small></span></a>'; }).join(''); });
  });
}

if (configured) {
  try { app = initializeApp(config); auth = getAuth(app); db = getFirestore(app); const pageParams = new URLSearchParams(location.search); const songId = pageParams.get('track') || '01'; const profileId = pageParams.get('uid'); onAuthStateChanged(auth, async user => { currentUser = user; if (user) await ensureProfile(user); updateAccountUi(); if (document.getElementById('profileName')) renderRemoteProfile(profileId || (user && user.uid)); if (document.getElementById('listenerChart')) renderRemoteListeners(); if (document.getElementById('songCommentList')) { if (!document.body.classList.contains('private-song-locked') || sessionStorage.getItem('melation1020Unlocked') === 'yes') recordView(songId); if (user) watchSongReaction(songId); } }); bindAuth(); setText('communityMode', 'Firebase'); renderSongCommunity(songId); renderRemoteSongCharts(); if (document.getElementById('profileName') && profileId) renderRemoteProfile(profileId); } catch (error) { setSetup('Firebase could not initialize. Add a valid web-app config in firebase-config.js to enable shared accounts.'); renderLocalAccount(); renderSongCommunity(new URLSearchParams(location.search).get('track') || '01'); }
} else {
  setSetup('Demo mode is active. Add your Firebase Web App config to firebase-config.js to enable shared accounts, cross-device listener charts, and shared comments.'); setText('communityMode', 'Demo mode'); renderLocalAccount(); renderSongCommunity(new URLSearchParams(location.search).get('track') || '01'); if (document.getElementById('listenerChart')) renderListenerRows(localListenerRows()); if (document.getElementById('profileName')) renderLocalProfile();
}

window.MelationCommunity = { isReady:() => true, isRemote:() => Boolean(db && configured), user:() => currentUser, react:(id,type) => configured && db ? remoteReact(id,type) : (() => { const data = localRead(); const old = data.reactions[id] && data.reactions[id].type; if (old === type) delete data.reactions[id]; else data.reactions[id] = {songId:id, type, ...songInfo(id)}; localWrite(data); if (window.MelationEngagement) window.MelationEngagement.react(id,type); const stats = localSongStats(id); setSongCounts({...stats, reaction:old === type ? null : type}); return {...stats, reaction:old === type ? null : type}; })(), recordPlay, recordListen, recordView, openAuthPrompt, formatDuration };
