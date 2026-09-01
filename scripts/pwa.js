(function () {
  var currentScript = document.currentScript;
  var assetRoot = currentScript ? new URL('../', currentScript.src) : new URL('./', document.baseURI);
  function assetUrl(path) { return new URL(path, assetRoot).href; }
  if (!document.querySelector('link[href*="site-shell.css"]')) { var shellStyles = document.createElement('link'); shellStyles.rel = 'stylesheet'; shellStyles.href = assetUrl('styles/site-shell.css?v=20260901-3'); document.head.appendChild(shellStyles); }
  if (!document.querySelector('link[href*="mobile.css"]')) { var mobileStyles = document.createElement('link'); mobileStyles.rel = 'stylesheet'; mobileStyles.href = assetUrl('styles/mobile.css?v=20260901-3'); document.head.appendChild(mobileStyles); }
  if (!document.querySelector('link[href*="pwa.css"]')) { var pwaStyles = document.createElement('link'); pwaStyles.rel = 'stylesheet'; pwaStyles.href = assetUrl('styles/pwa.css?v=20260901-3'); document.head.appendChild(pwaStyles); }
  if (!document.querySelector('link[href*="account-gate.css"]')) { var gateStyles = document.createElement('link'); gateStyles.rel = 'stylesheet'; gateStyles.href = assetUrl('styles/account-gate.css?v=20260901-3'); document.head.appendChild(gateStyles); }
  if (!document.querySelector('script[src*="site-shell.js"]')) { var shellScript = document.createElement('script'); shellScript.src = assetUrl('scripts/site-shell.js?v=20260901-3'); document.body.appendChild(shellScript); }
  if (document.querySelector('[data-timeline-filter]') && !document.querySelector('script[src*="timeline.js"]')) { var timelineScript = document.createElement('script'); timelineScript.src = assetUrl('scripts/timeline.js?v=20260901-3'); document.body.appendChild(timelineScript); }
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register(assetUrl('service-worker.js?v=20260901-3'), { updateViaCache: 'none' }).then(function (registration) { return registration.update(); }).catch(function () {}); });
  var deferredPrompt;
  window.addEventListener('beforeinstallprompt', function (event) { event.preventDefault(); deferredPrompt = event; var existingButton = document.querySelector('.pwa-install-button'); if (existingButton) existingButton.remove(); var button = document.createElement('button'); button.type = 'button'; button.className = 'pwa-install-button'; button.textContent = 'Install app'; button.addEventListener('click', async function () { if (!deferredPrompt) return; button.disabled = true; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; button.remove(); }); document.body.appendChild(button); });
  window.addEventListener('appinstalled', function () { var button = document.querySelector('.pwa-install-button'); if (button) button.remove(); });
}());
