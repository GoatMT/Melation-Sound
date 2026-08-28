(function () {
  var gate = document.getElementById('adminGate');
  var tools = document.getElementById('adminTools');
  var form = document.getElementById('adminGateForm');
  var input = document.getElementById('adminPassword');
  var status = document.getElementById('adminGateStatus');
  if (!gate || !tools || !form || !input || !status) return;
  var SESSION_KEY = 'melationAdminUnlocked';
  var PASSWORD_HASH = 'fcfd078f912f086bda4b4caa4cb792aafc28735c70f24d70e87978908cbdd2a3';

  function hash(value) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(function (bytes) {
      return Array.from(new Uint8Array(bytes)).map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
    });
  }
  function showTools() {
    gate.hidden = true;
    tools.hidden = false;
    tools.querySelectorAll('input, button').forEach(function (control) { control.disabled = false; });
  }
  try { if (sessionStorage.getItem(SESSION_KEY) === 'yes') showTools(); } catch (error) {}
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = 'Checking access…';
    hash(input.value).then(function (value) {
      if (value === PASSWORD_HASH) {
        try { sessionStorage.setItem(SESSION_KEY, 'yes'); } catch (error) {}
        input.value = '';
        status.textContent = '';
        showTools();
      } else {
        status.textContent = 'That password is not correct.';
        input.select();
      }
    });
  });
}());
