(function () {
  if (!document.querySelector('link[href*="site-shell.css"]')) { var shellStyles = document.createElement('link'); shellStyles.rel = 'stylesheet'; shellStyles.href = 'styles/site-shell.css?v=20260830-1'; document.head.appendChild(shellStyles); }
  if (!document.querySelector('link[href*="mobile.css"]')) { var mobileStyles = document.createElement('link'); mobileStyles.rel = 'stylesheet'; mobileStyles.href = 'styles/mobile.css?v=20260828-4'; document.head.appendChild(mobileStyles); }
  if (!document.querySelector('link[href*="account-gate.css?v=20260828"]')) { var gateStyles = document.createElement('link'); gateStyles.rel = 'stylesheet'; gateStyles.href = 'styles/account-gate.css?v=20260828-3'; document.head.appendChild(gateStyles); }
  if (!document.querySelector('script[src*="site-shell.js"]')) { var shellScript = document.createElement('script'); shellScript.src = 'scripts/site-shell.js?v=20260830-2'; document.body.appendChild(shellScript); }
  if (document.querySelector('[data-timeline-filter]') && !document.querySelector('script[src*="timeline.js"]')) { var timelineScript = document.createElement('script'); timelineScript.src = 'scripts/timeline.js?v=20260828-2'; document.body.appendChild(timelineScript); }
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('service-worker.js?v=20260831-2', { updateViaCache: 'none' }).then(function (registration) { return registration.update(); }).catch(function () {}); });
  var deferredPrompt;
  window.addEventListener('beforeinstallprompt', function (event) { event.preventDefault(); deferredPrompt = event; var button = document.createElement('button'); button.type = 'button'; button.className = 'pwa-install-button'; button.textContent = 'Install app'; button.addEventListener('click', async function () { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; button.remove(); }); document.body.appendChild(button); });
  window.addEventListener('appinstalled', function () { var button = document.querySelector('.pwa-install-button'); if (button) button.remove(); });
}());
