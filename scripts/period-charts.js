import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const config = window.MELATION_FIREBASE_CONFIG || {};
const stateKey = 'melationPeriodChartState';
const state = readState();
let stopSongs = null;
let stopUsers = null;
let historyStarted = false;
let periodSongs = [];
let periodListeners = [];

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey) || '{}');
    return {type:saved.type === 'month' ? 'month' : 'week', offset:Number.isFinite(saved.offset) ? Math.min(0, saved.offset) : 0};
  } catch (error) {
    return {type:'week', offset:0};
  }
}

function saveState() {
  try { localStorage.setItem(stateKey, JSON.stringify(state)); } catch (error) {}
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function periodInfo(type, offset) {
  const now = new Date();
  let start;
  if (type === 'month') {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day) + (offset * 7));
  }
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const date = String(start.getDate()).padStart(2, '0');
  return {type, key:type + '-' + year + '-' + month + '-' + date, start, startMs:start.getTime()};
}

function formatPeriod(period) {
  if (period.type === 'month') return period.start.toLocaleDateString(undefined, {month:'long', year:'numeric'});
  const end = new Date(period.start.getFullYear(), period.start.getMonth(), period.start.getDate() + 6);
  const first = period.start.toLocaleDateString(undefined, {month:'short', day:'numeric'});
  const last = end.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
  return first + ' – ' + last;
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  return minutes + 'm ' + String(total % 60).padStart(2, '0') + 's';
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setEmpty(id, message) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = '<p class="period-empty">' + escapeHtml(message) + '</p>';
}

function rowBelongsToPeriod(row, period) {
  if (!row) return false;
  if (String(row.periodKey || '') === period.key) return true;
  return row.periodType === period.type && Number(row.periodStartMs) === period.startMs;
}

function selectedPeriod() {
  return periodInfo(state.type, state.offset);
}

function renderSongs(rows) {
  const target = document.getElementById('periodSongChart');
  if (!target) return;
  const period = selectedPeriod();
  const sorted = rows.filter(row => rowBelongsToPeriod(row, period)).sort((a, b) => (Number(b.plays || 0) - Number(a.plays || 0)) || (Number(b.seconds || 0) - Number(a.seconds || 0)) || String(a.title || '').localeCompare(String(b.title || ''))).slice(0, 10);
  if (!sorted.length) { setEmpty('periodSongChart', 'No song activity has been recorded for this period yet.'); return; }
  const max = Math.max(1, ...sorted.map(row => Number(row.plays || 0)));
  target.innerHTML = sorted.map((row, index) => '<a class="chart-row period-chart-row" href="songs/song.html?track=' + encodeURIComponent(row.songId || '') + '"><span class="chart-rank">' + String(index + 1).padStart(2, '0') + '</span><img src="' + escapeHtml(row.art || '') + '" alt=""><span class="chart-song"><strong>' + escapeHtml(row.title || 'Untitled') + '</strong><small>' + escapeHtml(row.artist || 'Unknown artist') + ' · ' + Number(row.plays || 0) + ' plays · ' + formatDuration(row.seconds) + '</small><i style="width:' + Math.max(8, Math.round(Number(row.plays || 0) / max * 100)) + '%"></i></span><span class="chart-value">' + Number(row.plays || 0) + '<small>plays</small></span></a>').join('');
}

function renderUsers(rows) {
  const target = document.getElementById('periodUserChart');
  if (!target) return;
  const period = selectedPeriod();
  const sorted = rows.filter(row => rowBelongsToPeriod(row, period)).sort((a, b) => (Number(b.totalSeconds || 0) - Number(a.totalSeconds || 0)) || (Number(b.plays || 0) - Number(a.plays || 0)) || String(a.displayName || '').localeCompare(String(b.displayName || ''))).slice(0, 10);
  if (!sorted.length) { setEmpty('periodUserChart', 'No listener activity has been recorded for this period yet.'); return; }
  target.innerHTML = sorted.map((row, index) => '<a class="period-listener-row" href="profile.html?uid=' + encodeURIComponent(row.usernameKey || '') + '"><span class="period-listener-rank">' + String(index + 1).padStart(2, '0') + '</span><span class="period-listener-copy"><strong>' + escapeHtml(row.displayName || row.usernameKey || 'Listener') + '</strong><small>' + Number(row.plays || 0) + ' plays · ' + (Array.isArray(row.songIds) ? row.songIds.length : 0) + ' songs</small></span><span class="period-listener-value">' + formatDuration(row.totalSeconds) + '<small>listened</small></span></a>').join('');
}

function updateControls() {
  const period = selectedPeriod();
  setText('periodLabel', formatPeriod(period));
  setText('periodSongSummary', state.type === 'week' ? 'Selected week' : 'Selected month');
  setText('periodUserSummary', state.type === 'week' ? 'Weekly listening time' : 'Monthly listening time');
  const next = document.getElementById('periodNext');
  if (next) next.disabled = state.offset >= 0;
  document.querySelectorAll('[data-period-type]').forEach(button => {
    const active = button.dataset.periodType === state.type;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function renderCurrentPeriod() {
  renderSongs(periodSongs);
  renderUsers(periodListeners);
}

function watchPeriodData() {
  if (historyStarted) {
    renderCurrentPeriod();
    return;
  }
  historyStarted = true;
  setEmpty('periodSongChart', 'Loading saved period history…');
  setEmpty('periodUserChart', 'Loading saved period history…');
  const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);
  if (!firebaseConfigured) {
    setEmpty('periodSongChart', 'Period charts need Firestore to be connected.');
    setEmpty('periodUserChart', 'Period charts need Firestore to be connected.');
    return;
  }
  try {
    const app = getApps().find(item => item.name === '[DEFAULT]') || initializeApp(config, 'periodCharts');
    const db = getFirestore(app);
    const root = doc(db, 'melationSound', 'main');
    stopSongs = onSnapshot(collection(root, 'periodSongs'), snapshot => {
      periodSongs = snapshot.docs.map(item => item.data());
      renderSongs(periodSongs);
    }, () => setEmpty('periodSongChart', 'Period song data is temporarily unavailable.'));
    stopUsers = onSnapshot(collection(root, 'periodListeners'), snapshot => {
      periodListeners = snapshot.docs.map(item => item.data());
      renderUsers(periodListeners);
    }, () => setEmpty('periodUserChart', 'Period listener data is temporarily unavailable.'));
  } catch (error) {
    setEmpty('periodSongChart', 'Period charts are temporarily unavailable.');
    setEmpty('periodUserChart', 'Period charts are temporarily unavailable.');
  }
}

document.querySelectorAll('[data-period-type]').forEach(button => button.addEventListener('click', () => {
  state.type = button.dataset.periodType === 'month' ? 'month' : 'week';
  state.offset = 0;
  saveState();
  updateControls();
  renderCurrentPeriod();
}));
document.getElementById('periodPrevious')?.addEventListener('click', () => { state.offset -= 1; saveState(); updateControls(); renderCurrentPeriod(); });
document.getElementById('periodNext')?.addEventListener('click', () => { if (state.offset >= 0) return; state.offset += 1; saveState(); updateControls(); renderCurrentPeriod(); });

updateControls();
watchPeriodData();
