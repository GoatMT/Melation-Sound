(function () {
  var KEY = 'melationListenerZone';
  var zone = document.getElementById('listenerZone');
  var save = document.getElementById('listenerZoneSave');
  var status = document.getElementById('listenerMapStatus');
  var stored = '';
  try { stored = localStorage.getItem(KEY) || ''; } catch (e) {}
  if (zone) zone.value = stored;
  function render() {
    var count = stored ? 1 : 0;
    document.getElementById('mapSignalCount').textContent = count;
    document.getElementById('mapZoneCount').textContent = stored ? '1' : '0';
    if (status) status.textContent = stored ? 'Your anonymous ' + stored + ' signal is active on this device.' : 'Your exact location is never shown.';
  }
  if (save) save.addEventListener('click', function () { stored = zone.value; try { if (stored) localStorage.setItem(KEY, stored); else localStorage.removeItem(KEY); } catch (e) {} render(); });
  render();
}());
