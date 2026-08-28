# Melation Sound

Static GitHub Pages site for Melation Sound.

## Project layout

- `index.html`, `artists.html`, `timeline.html`, `charts.html`, `community.html`, `profile.html`, `playlist.html`, `achievements.html`, `updates.html`, `about.html`, and `admin.html` are the main label pages.
- `albums/a-broken-dream/` contains the A Broken Dream album pages and its artwork/audio.
- `singles/10-20/` contains the 10:20 single page and its artwork/audio.
- `songs/` contains the individual song page.
- `assets/` contains shared branding and the web manifest.
- `styles/` contains shared and page-specific CSS.
- `scripts/` contains shared player, account, playlist, chart, and page scripts.
- `config/` contains the Firebase web configuration and Firestore rules.

The nested release and song pages use a base path so they can keep using the same shared player and site resources when deployed on GitHub Pages.
