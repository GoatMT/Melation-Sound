(function () {
  'use strict';

  var MORE_LINKS = [
    ['About', 'about.html', 'The label and its story.'],
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
    actions.innerHTML = '<button type="button" class="site-quick-mix-button" aria-label="Play all songs in shuffle mode" aria-pressed="false"><span class="site-quick-mix-icon">▶</span><span><strong>All songs</strong><small>Shuffle mix</small></span></button>';
    document.body.appendChild(actions);
    var button = actions.querySelector('button');
    function update(event) {
      var playing = !!(event && event.detail && event.detail.playing);
      button.setAttribute('aria-pressed', String(playing));
      button.classList.toggle('is-playing', playing);
      button.querySelector('.site-quick-mix-icon').textContent = playing ? 'Ⅱ' : '▶';
      button.querySelector('small').textContent = playing ? 'Pause mix' : 'Shuffle mix';
    }
    button.addEventListener('click', function () {
      if (window.melationPlayerIsPlaying && window.melationPlayerIsPlaying()) {
        if (window.melationPausePlayer) window.melationPausePlayer();
      } else if (window.melationPlayAllShuffled) {
        window.melationPlayAllShuffled();
      }
    });
    window.addEventListener('melation:playerstate', update);
    update({ detail: { playing: !!(window.melationPlayerIsPlaying && window.melationPlayerIsPlaying()) } });
  }

  function init() {
    var nav = document.querySelector('.label-links, .nav-links');
    addMoreMenu(nav);
    addQuickMix();
  }

  init();
}());
