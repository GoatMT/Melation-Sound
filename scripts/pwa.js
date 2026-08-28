(function () {
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('service-worker.js').catch(function () {}); });
  var deferredPrompt;
  window.addEventListener('beforeinstallprompt', function (event) { event.preventDefault(); deferredPrompt = event; var button = document.createElement('button'); button.type = 'button'; button.className = 'pwa-install-button'; button.textContent = 'Install app'; button.addEventListener('click', async function () { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; button.remove(); }); document.body.appendChild(button); });
  window.addEventListener('appinstalled', function () { var button = document.querySelector('.pwa-install-button'); if (button) button.remove(); });
}());
