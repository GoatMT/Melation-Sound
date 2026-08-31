(function () {
  var form = document.querySelector('.site-search');
  if (!form) return;
  var input = form.querySelector('input[type="search"]');
  var results = form.querySelector('.site-search-results');
  var button = form.querySelector('button[type="submit"]');
  if (!input || !results) return;

  var catalog = [
    { title: 'A Broken Dream', meta: 'Album · Osama, MT', action: 'Open album', href: 'albums/a-broken-dream/index.html', terms: 'a broken dream album osama mt' },
    { title: 'Location Unknown', meta: 'Upcoming album · MT', action: 'View announcement', href: 'timeline.html#location-unknown', terms: 'location unknown upcoming album mt next release' },
    { title: '10:20', meta: 'Single · MT', action: 'Open single', href: 'singles/10-20/index.html', terms: '10 20 1020 single mt' },
    { title: 'A Dreams A Mystery', meta: 'Song · Osama, MT · A Broken Dream', action: 'Open song page', href: 'songs/song.html?track=01', terms: 'a dreams a mystery song osama mt' },
    { title: 'Nightmare Fuel', meta: 'Song · Osama, MT and Adam · A Broken Dream', action: 'Open song page', href: 'songs/song.html?track=02', terms: 'nightmare fuel song osama mt adam' },
    { title: "Nawaf's Stole Pain", meta: 'Bonus track · Bassam · A Broken Dream', action: 'Open song page', href: 'songs/song.html?track=11', terms: 'nawaf stole pain bassam bonus track' },
    { title: 'Artists', meta: 'Melation Sound · featured artists', action: 'Browse artists', href: 'artists.html', terms: 'artists artist osama mt adam bassam' },
    { title: 'Timeline', meta: 'Melation Sound · release archive', action: 'View timeline', href: 'timeline.html', terms: 'timeline releases dates' },
    { title: 'Charts', meta: 'Melation Sound · listeners and songs', action: 'View charts', href: 'charts.html', terms: 'charts views likes dislikes listeners' },
    { title: 'About', meta: 'Melation Sound · the label', action: 'About the label', href: 'about.html', terms: 'about label melation sound' },
    { title: 'Listening Rooms', meta: 'Melation Sound · shared listening', action: 'Enter a room', href: 'listening-rooms.html', terms: 'listening rooms live together community chat room' },
    { title: 'Listener Map', meta: 'Melation Sound · anonymous signals', action: 'Open listener map', href: 'listener-map.html', terms: 'listener map locations community signals privacy' },
    { title: 'Account', meta: 'Melation Sound · listener profiles', action: 'Open account', href: 'community.html', terms: 'account profile listener playlist' },
    { title: 'Browse', meta: 'Melation Sound · public listener collections', action: 'Browse playlists and reactions', href: 'browse.html', terms: 'browse public playlists liked disliked reactions listeners' },
    { title: 'Playlist', meta: 'Melation Sound · listener collection', action: 'Open playlist', href: 'playlist.html', terms: 'playlist tracks play reorder share' },
    { title: 'Achievements', meta: 'Melation Sound · listener milestones', action: 'View achievements', href: 'achievements.html', terms: 'achievements milestones streaks' },
    { title: 'Updates', meta: 'Melation Sound · release log', action: 'View updates', href: 'updates.html', terms: 'updates news releases new music' },
    { title: 'Admin Login', meta: 'Melation Sound · restricted access', action: 'Open admin login', href: 'admin-login.html', terms: 'admin owner login restricted settings' }
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
    });
  }

  function closeResults() {
    form.classList.remove('is-open');
    input.setAttribute('aria-expanded', 'false');
  }

  function render() {
    var query = input.value.trim().toLowerCase();
    if (!query) { results.innerHTML = ''; closeResults(); return []; }
    var matches = catalog.filter(function (item) { return (item.title + ' ' + item.meta + ' ' + item.terms).toLowerCase().includes(query); }).slice(0, 8);
    results.innerHTML = matches.length
      ? matches.map(function (item) { return '<a class="site-search-result" href="' + item.href + '"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.meta) + '</small><em>' + escapeHtml(item.action) + ' →</em></a>'; }).join('')
      : '<p class="site-search-empty">No releases, artists, or pages found.</p>';
    form.classList.add('is-open');
    input.setAttribute('aria-expanded', 'true');
    return matches;
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', function (event) { if (event.key === 'Escape') { input.value = ''; closeResults(); input.blur(); } });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var matches = render();
    if (matches.length) window.location.href = matches[0].href;
  });
  if (button) button.setAttribute('aria-label', 'Search Melation Sound');
  document.addEventListener('click', function (event) { if (!form.contains(event.target)) closeResults(); });
}());
