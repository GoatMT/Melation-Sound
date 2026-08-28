(function () {
  'use strict';

  var MORE_LINKS = [
    ['About', 'about.html', 'The label and its story.'],
    ['Artists', 'artists.html', 'Meet the voices behind the catalog.'],
    ['Timeline', 'timeline.html', 'Follow the catalog as it grows.'],
    ['Listening Rooms', 'listening-rooms.html', 'Listen together with the community.'],
    ['Listener Map', 'listener-map.html', 'See the growing listening community.'],
    ['Playlist Studio', 'playlist.html', 'Build and style your playlist.']
  ];

  function addMoreMenu(nav) {
    if (!nav || nav.querySelector('[data-more-menu]')) return;
    var directAbout = nav.querySelector('a[href="about.html"]');
    if (directAbout) directAbout.remove();
    var menu = document.createElement('details');
    menu.className = 'site-more-menu';
    menu.dataset.moreMenu = 'true';
    var summary = document.createElement('summary');
    summary.textContent = 'More';
    menu.appendChild(summary);
    var panel = document.createElement('div');
    panel.className = 'site-more-panel';
    MORE_LINKS.forEach(function (item) {
      var link = document.createElement('a');
      link.href = item[1];
      link.innerHTML = '<strong>' + item[0] + '</strong><small>' + item[2] + '</small>';
      panel.appendChild(link);
    });
    menu.appendChild(panel);
    nav.appendChild(menu);
    document.addEventListener('click', function (event) {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  }

  function addQuickMix() {
    if (document.querySelector('[data-quick-mix]')) return;
    var actions = document.createElement('aside');
    actions.className = 'site-quick-mix';
    actions.dataset.quickMix = 'true';
    actions.innerHTML = '<button type="button" class="site-quick-mix-button" aria-label="Play all songs in shuffle mode" aria-pressed="false"><span class="site-quick-mix-icon" aria-hidden="true"></span><span><strong>All songs</strong><small>Shuffle mix</small></span></button>';
    document.body.appendChild(actions);
    var button = actions.querySelector('button');
    function update(event) {
      var playing = !!(event && event.detail && event.detail.playing);
      button.setAttribute('aria-pressed', String(playing));
      button.classList.toggle('is-playing', playing);
      button.querySelector('small').textContent = playing ? 'Pause mix' : (event.detail && event.detail.hasTrack ? 'Resume mix' : 'Shuffle mix');
      button.setAttribute('aria-label', playing ? 'Pause current song' : (event.detail && event.detail.hasTrack ? 'Resume current song' : 'Play all songs in shuffle mode'));
    }
    button.addEventListener('click', function () {
      if (window.melationPlayerIsPlaying && window.melationPlayerIsPlaying()) {
        if (window.melationPausePlayer) window.melationPausePlayer();
      } else if (window.melationPlayerHasTrack && window.melationPlayerHasTrack()) {
        if (window.melationResumePlayer) window.melationResumePlayer();
      } else if (window.melationPlayAllShuffled) {
        window.melationPlayAllShuffled();
      }
    });
    window.addEventListener('melation:playerstate', update);
    update({ detail: { playing: !!(window.melationPlayerIsPlaying && window.melationPlayerIsPlaying()), hasTrack: !!(window.melationPlayerHasTrack && window.melationPlayerHasTrack()) } });
  }

  function init() {
    if (!document.querySelector('link[href*="rooms-host-rail.css"]')) { var hostRailStyles = document.createElement('link'); hostRailStyles.rel = 'stylesheet'; hostRailStyles.href = 'styles/rooms-host-rail.css?v=20260828-2'; document.head.appendChild(hostRailStyles); }
    var nav = document.querySelector('.label-links, .nav-links');
    var path = window.location.pathname.toLowerCase();
    var isReleaseMiniSite = path.indexOf('/albums/a-broken-dream/') !== -1 || path.indexOf('/singles/10-20/') !== -1;
    if (!isReleaseMiniSite) addMoreMenu(nav);
    addQuickMix();
  }

  init();
}());
