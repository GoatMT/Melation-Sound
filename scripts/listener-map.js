(function () {
  var KEY = 'melationListenerZone';
  var SESSION_KEY = 'melationSoundAccount';
  var ROOT = 'melationSound';
  var ROOT_ID = 'main';
  var zone = document.getElementById('listenerZone');
  var save = document.getElementById('listenerZoneSave');
  var status = document.getElementById('listenerMapStatus');
  var stored = '';
  var currentUser = null;
  var db = null;
  var firestore = null;
  var zoneCounts = { 'North America':0, Europe:0, Other:0 };

  try { stored = localStorage.getItem(KEY) || ''; currentUser = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (error) {}
  if (zone) zone.value = stored;
  function labelFor(value) { return value === 'Other' ? 'Other signals' : value; }
  function countFor(value) { return Number(zoneCounts[value] || 0); }
  function updateMapLabels() {
    var north = document.querySelector('.label-north'); var europe = document.querySelector('.label-europe'); var other = document.querySelector('.label-other');
    if (north) { north.textContent = 'NORTH AMERICA · ' + countFor('North America'); north.classList.toggle('is-active', countFor('North America') > 0); }
    if (europe) { europe.textContent = 'EUROPE · ' + countFor('Europe'); europe.classList.toggle('is-active', countFor('Europe') > 0); }
    if (other) { other.textContent = 'OTHER SIGNALS · ' + countFor('Other'); other.classList.toggle('is-active', countFor('Other') > 0); }
    document.querySelector('.pulse-one')?.classList.toggle('is-active', countFor('North America') > 0); document.querySelector('.pulse-two')?.classList.toggle('is-active', countFor('Europe') > 0); document.querySelector('.pulse-three')?.classList.toggle('is-active', countFor('Other') > 0);
  }
  function render(message) {
    var total = countFor('North America') + countFor('Europe') + countFor('Other'); var zones = ['North America','Europe','Other'].filter(function (item) { return countFor(item) > 0; }).length;
    var totalElement = document.getElementById('mapSignalCount'); var zoneElement = document.getElementById('mapZoneCount'); if (totalElement) totalElement.textContent = total; if (zoneElement) zoneElement.textContent = zones;
    updateMapLabels(); if (status) status.textContent = message || (stored ? 'Your anonymous ' + labelFor(stored) + ' signal is active.' : 'Choose a broad region to add your signal. Exact location is never shown.');
  }
  function collect(snapshot) { zoneCounts = { 'North America':0, Europe:0, Other:0 }; snapshot.forEach(function (item) { var value = item.data()?.listenerZone; if (Object.prototype.hasOwnProperty.call(zoneCounts, value)) zoneCounts[value] += 1; }); render(); }
  async function connect() {
    var config = window.MELATION_FIREBASE_CONFIG || {}; if (!config.apiKey || !config.projectId || !config.appId) { render('Map is in private device mode until Firebase is connected.'); return; }
    try { var appApi = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'); firestore = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js'); var app = appApi.getApps().find(function (item) { return item.name === 'listenerMap'; }) || appApi.initializeApp(config, 'listenerMap'); db = firestore.getFirestore(app); firestore.onSnapshot(firestore.collection(db, ROOT, ROOT_ID, 'accounts'), collect, function () { render('Map data is temporarily unavailable. Your location stays private.'); }); if (currentUser?.usernameKey) { var saved = await firestore.getDoc(firestore.doc(db, ROOT, ROOT_ID, 'accounts', currentUser.usernameKey)); if (saved.exists() && saved.data().listenerZone) { stored = saved.data().listenerZone; if (zone) zone.value = stored; try { localStorage.setItem(KEY, stored); } catch (error) {} render(); } } } catch (error) { render('Map is in private device mode while the shared signal is unavailable.'); }
  }
  if (save) save.addEventListener('click', async function () { stored = zone?.value || ''; try { if (stored) localStorage.setItem(KEY, stored); else localStorage.removeItem(KEY); } catch (error) {} if (!currentUser?.usernameKey) { render(stored ? 'Your signal is saved on this device. Sign in to add it to the shared map.' : 'Your signal is hidden.'); return; } if (!db || !firestore) { render('Your signal is saved on this device. Shared map will update when Firebase reconnects.'); return; } save.disabled = true; try { await firestore.setDoc(firestore.doc(db, ROOT, ROOT_ID, 'accounts', currentUser.usernameKey), { listenerZone:stored || '', updatedAtMs:Date.now() }, { merge:true }); render(stored ? 'Your anonymous ' + labelFor(stored) + ' signal is now on the shared map.' : 'Your signal is hidden from the shared map.'); } catch (error) { render('Could not update the shared map. Publish the latest Firestore rules and try again.'); } finally { save.disabled = false; } });
  render(); connect();
}());
