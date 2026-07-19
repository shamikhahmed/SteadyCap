'use strict';
const CACHE = 'steadycap-v44';
const ASSETS = [
  './css/capricorn-core.css',
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/app.js',
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
  './js/ui/navigation.js',
  './js/modules/state.js',
  './js/modules/notifications.js',
  './js/modules/onboarding.js',
  './js/modules/dashboard.js',
  './js/modules/recovery.js',
  './js/modules/emergency.js',
  './js/modules/knowledge.js',
  './js/modules/profile.js',
  './js/modules/journal.js',
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
  './js/capricorn-motion.js',
  './js/capricorn-scene.js',
  './js/capricorn-premium-nav.js',
  './js/capricorn-cinematic.js',
  './js/capricorn-deck.js',
  './js/capricorn-deck-pro.js',
  './js/capricorn-pitch.js',
  './js/vendor/gsap.min.js',
  './js/vendor/ScrollTrigger.min.js',
  './privacy.html',
  './changelog.html',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
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
