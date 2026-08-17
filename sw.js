/* Sarvam Sabarigireesha — THATHWAMASI PWA Service Worker
   - Offline support
   - Clean URLs (/about etc.) work offline via cached index.html
   - Static assets cache-first; pages network-first */
var CACHE = 'thathwamasi-v1';
var CORE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/logo.jpg',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).catch(function () {})
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k.indexOf('thathwamasi-') === 0 && k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* CDN (jsPDF etc.) network direct ga vellali */

  /* Page navigations — network first, offline lo cached index.html */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('/index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('/index.html'); });
      })
    );
    return;
  }

  /* Static assets — cache first, network lo thechi cache chey */
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
