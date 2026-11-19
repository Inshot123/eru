const CACHE_NAME = 'eru-offline-v1';
const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './css/style.css',
  './img/logo.png',
  './img/favicon.png',
  './js/shared/config.js',
  './js/shared/store.js',
  './js/citizen/chatbot.js',
  './js/citizen/ui.js',
  './js/citizen/map.js',
  './js/citizen/myreports.js',
  './js/citizen/form.js',
  './js/citizen/main.js',
  './js/admin/auth.js',
  './js/admin/helpers.js',
  './js/admin/requests.js',
  './js/admin/responders.js',
  './js/admin/reports.js',
  './js/admin/shell.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});