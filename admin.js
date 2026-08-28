import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const config = window.MELATION_FIREBASE_CONFIG || {};
const ROOT = 'melationSound';
const ROOT_ID = 'main';
const ADMIN_HASH = '8b81926e7cd4de108c33c4dd884f866cb934922602b16a4553ad519c03f92db9';
const SESSION_KEY = 'melationAdminUnlocked';
let db = null;
let accounts = null;

function normalize(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, '-'); }
function escape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]); }
function setStatus(id, value, error = false) { const target = document.getElementById(id); if (target) { target.textContent = value; target.classList.toggle('is-error', error); } }
function hash(value) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(bytes => Array.from(new Uint8Array(bytes)).map(byte => byte.toString(16).padStart(2, '0')).join('')); }
function hashPin(usernameKey, pin) { return hash(usernameKey + ':' + pin); }
function validUsername(value) { return /^[a-z0-9_-]{2,20}$/.test(normalize(value)); }
function validPin(value) { return /^\d{6}$/.test(String(value || '')); }
async function initFirestore() {
  if (!config.apiKey || !config.projectId || !config.appId) throw new Error('Firebase is not configured.');
  const app = getApps().find(item => item.name === 'adminTools') || initializeApp(config, 'adminTools');
  db = getFirestore(app);
  accounts = collection(db, ROOT, ROOT_ID, 'accounts');
}
async function account(key) { const snapshot = await getDoc(doc(accounts, key)); return snapshot.exists() ? snapshot.data() : null; }
async function copySubcollection(fromKey, toKey, name) {
  const source = await getDocs(collection(accounts, fromKey, name));
  const targetRef = collection(accounts, toKey, name);
  for (const item of source.docs) {
    const target = await getDoc(doc(targetRef, item.id));
    if (name === 'listens' && target.exists()) {
      const old = target.data();
      const incoming = item.data();
      await setDoc(doc(targetRef, item.id), { ...incoming, seconds: (old.seconds || 0) + (incoming.seconds || 0), plays: Math.max(old.plays || 0, incoming.plays || 0) }, { merge: true });
    } else if (!target.exists()) await setDoc(doc(targetRef, item.id), item.data(), { merge: true });
  }
  return source.docs.map(item => item.id);
}
async function mergeAccounts() {
  const from = normalize(document.getElementById('adminMergeFrom').value);
  const into = normalize(document.getElementById('adminMergeInto').value);
  if (!from || !into || from === into) throw new Error('Enter two different usernames.');
  const [source, target] = await Promise.all([account(from), account(into)]);
  if (!source) throw new Error('The account to merge from was not found.');
  if (!target) throw new Error('The account to keep was not found.');
  const [sourceListens, targetListens] = await Promise.all([getDocs(collection(accounts, from, 'listens')), getDocs(collection(accounts, into, 'listens'))]);
  const listenIds = new Set([...sourceListens.docs.map(item => item.id), ...targetListens.docs.map(item => item.id)]);
  const sourcePlaylist = source.playlist?.trackIds || [];
  const targetPlaylist = target.playlist?.trackIds || [];
  const playlist = { name: target.playlist?.name || (target.displayName || target.username || into) + "'s Playlist", trackIds: [...new Set([...targetPlaylist, ...sourcePlaylist])], updatedAtMs: Date.now() };
  await Promise.all([copySubcollection(from, into, 'listens'), copySubcollection(from, into, 'reactions')]);
  await setDoc(doc(accounts, into), { totalSeconds: (target.totalSeconds || 0) + (source.totalSeconds || 0), plays: (target.plays || 0) + (source.plays || 0), uniqueSongs: listenIds.size, playlist, updatedAtMs: Date.now() }, { merge: true });
  await deleteDoc(doc(accounts, from));
  setStatus('adminMergeStatus', 'Merged ' + from + ' into ' + into + '. Listening data and playlist moved; comments remain under their original author.', false);
}
async function changeUsername() {
  const oldKey = normalize(document.getElementById('adminUsernameCurrent').value);
  const newName = document.getElementById('adminUsernameNew').value.trim();
  const newKey = normalize(newName);
  if (!validUsername(newName)) throw new Error('The new username must be 2–20 characters using letters, numbers, hyphens, or underscores.');
  const source = await account(oldKey);
  if (!source) throw new Error('The current account was not found.');
  if (await account(newKey)) throw new Error('That new username is already taken.');
  await setDoc(doc(accounts, newKey), { ...source, username: newName, usernameKey: newKey, displayName: newName, updatedAtMs: Date.now() });
  await Promise.all([copySubcollection(oldKey, newKey, 'listens'), copySubcollection(oldKey, newKey, 'reactions')]);
  await deleteDoc(doc(accounts, oldKey));
  setStatus('adminUsernameStatus', 'Changed ' + oldKey + ' to ' + newKey + '. The listener must sign in again.', false);
}
async function resetPin() {
  const usernameKey = normalize(document.getElementById('adminPinUser').value);
  const pin = document.getElementById('adminPinNew').value;
  if (!validPin(pin)) throw new Error('The new PIN must be exactly 6 digits.');
  if (!await account(usernameKey)) throw new Error('That account was not found.');
  await setDoc(doc(accounts, usernameKey), { pinHash: await hashPin(usernameKey, pin), updatedAtMs: Date.now() }, { merge: true });
  document.getElementById('adminPinNew').value = '';
  setStatus('adminPinStatus', 'PIN reset for ' + usernameKey + '. The old PIN no longer works.', false);
}
function bindAction(buttonId, statusId, action) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  button.addEventListener('click', async () => { setStatus(statusId, 'Working…'); try { await action(); } catch (error) { setStatus(statusId, error.message || 'Action failed.', true); } });
}
function showTools() {
  document.getElementById('adminGate').hidden = true;
  const tools = document.getElementById('adminTools');
  tools.hidden = false;
  tools.querySelectorAll('input, button').forEach(control => { control.disabled = false; });
}
function bindGate() {
  const form = document.getElementById('adminGateForm');
  form.addEventListener('submit', event => { event.preventDefault(); setStatus('adminGateStatus', 'Checking access…'); hash(document.getElementById('adminPassword').value).then(value => { if (value === ADMIN_HASH) { try { sessionStorage.setItem(SESSION_KEY, 'yes'); } catch (error) {} document.getElementById('adminPassword').value = ''; setStatus('adminGateStatus', ''); showTools(); } else { setStatus('adminGateStatus', 'That password is not correct.', true); document.getElementById('adminPassword').select(); } }); });
}

bindGate();
bindAction('adminMergeButton', 'adminMergeStatus', mergeAccounts);
bindAction('adminUsernameButton', 'adminUsernameStatus', changeUsername);
bindAction('adminPinButton', 'adminPinStatus', resetPin);
initFirestore().catch(error => setStatus('adminFirebaseStatus', error.message, true));
try { if (sessionStorage.getItem(SESSION_KEY) === 'yes') showTools(); } catch (error) {}
