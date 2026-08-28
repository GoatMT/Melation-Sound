(function () {
  var buttons = document.querySelectorAll('[data-timeline-filter]');
  var items = document.querySelectorAll('[data-timeline-type]');
  var status = document.getElementById('timelineFilterStatus');
  if (!buttons.length || !items.length) return;
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = button.dataset.timelineFilter;
      buttons.forEach(function (item) { item.classList.toggle('is-active', item === button); });
      var count = 0;
      items.forEach(function (item) { var visible = filter === 'all' || item.dataset.timelineType === filter || (filter === 'release' && item.dataset.timelineType === 'release'); item.hidden = !visible; if (visible) count += 1; });
      if (status) status.textContent = filter === 'all' ? 'Showing every chapter.' : 'Showing ' + count + ' ' + (filter === 'release' ? 'release' : filter) + (count === 1 ? '.' : 's.');
    });
  });
}());
