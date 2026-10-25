'use strict';
const CACHE = 'steadycap-v267';
const ASSETS = [
  './css/capricorn-core.css',
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/app.css',
  './css/cascade.css',
  './css/ios-tokens.css',
  './css/design/tokens.css',
  './css/design/system.css',
  './css/design/steadycap.css',
  './css/fonts-local.css',
  './css/identity.css',
  './js/app.js',
  './js/brand/colors.js',
  './js/lib/datetime.js',
  './js/lib/storage-migrate.js',
  './js/data/habits.js',
  './js/data/timelines.js',
  './js/data/timelines-hourly.js',
  './js/data/insights.js',
  './js/data/knowledge.js',
  './js/data/habit-links.js',
  './js/data/programs.js',
  './js/engines/recoveryEngine.js',
  './js/engines/bodyEngine.js',
  './js/engines/linkedRecoveryEngine.js',
  './js/engines/dopamineEngine.js',
  './js/engines/financeEngine.js',
  './js/engines/triggerEngine.js',
  './js/ui/charts.js',
  './js/ui/scroll-lock.js',
  './js/ui/navigation.js',
  './js/modules/state.js',
  './js/modules/demo-seed.js',
  './js/modules/notifications.js',
  './js/modules/onboarding.js',
  './js/modules/dashboard.js',
  './js/modules/recovery.js',
  './js/modules/emergency.js',
  './js/modules/knowledge.js',
  './js/modules/profile.js',
  './js/modules/journal.js',
  './js/vendor/local-lock.js',
  './js/ui/dialogs.js',
  './js/modules/app-lock.js',
  './js/cap-demo-mode.js',
  './landing.html',
  './presentation.html',
  './pitch.html',
  './assets/icons/favicon.svg',
  './assets/icons/icon.svg',
  './assets/icons/mark.svg',
  './assets/icons/apple-touch-icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-1024.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png',
  './js/capricorn-premium-nav.js',
  './js/capricorn-cinematic.js',
  './js/capricorn-deck.js',
  './js/capricorn-deck-pro.js',
  './js/capricorn-pitch.js',
  './js/cap-desktop-nav.js',
  './js/hig-dt.js',
  './js/vendor/gsap.min.js',
  './js/vendor/ScrollTrigger.min.js',
  './privacy.html',
  './changelog.html',
  './assets/qr-steadycap.png',
  './assets/fonts/source-sans-3.woff2',
  './assets/fonts/ibm-plex-mono-500.woff2',
  './assets/fonts/ibm-plex-mono-600.woff2',
  './assets/fonts/ibm-plex-mono-700.woff2',
];

self.addEventListener('install', e => {
  // No skipWaiting/clients.claim: a new worker waits for the next cold launch instead of swapping a running app.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
