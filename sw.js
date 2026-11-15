const CACHE = 'wolkenrechnen-v3';
const APP_FILES = [
  './', './index.html', './manifest.webmanifest', './cloud.svg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './src/styles.css', './src/app.mjs', './src/bandit.mjs', './src/session.mjs', './src/storage.mjs'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
