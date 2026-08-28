(function () {
  var form = document.getElementById('adminLoginForm');
  var input = document.getElementById('adminLoginPassword');
  var status = document.getElementById('adminLoginStatus');
  if (!form || !input || !status) return;

  var ADMIN_HASH = '8b81926e7cd4de108c33c4dd884f866cb934922602b16a4553ad519c03f92db9';
  var SESSION_KEY = 'melationAdminUnlocked';

  function hash(value) {
    return window.MelationAdminAuth ? window.MelationAdminAuth.hash(value) : Promise.reject(new Error('Admin authentication is unavailable.'));
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = 'Checking access…';
    status.classList.remove('is-error');
    hash(input.value).then(function (value) {
      if (value !== ADMIN_HASH) {
        status.textContent = 'That password is not correct.';
        status.classList.add('is-error');
        input.select();
        return;
      }
      try { sessionStorage.setItem(SESSION_KEY, 'yes'); } catch (error) {}
      input.value = '';
      status.textContent = 'Access unlocked. Opening admin tools…';
      window.location.href = 'admin.html';
    }).catch(function () {
      status.textContent = 'Could not verify access in this browser.';
      status.classList.add('is-error');
    });
  });
}());
