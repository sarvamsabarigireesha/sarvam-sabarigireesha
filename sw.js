/* Sarvam Sabarigireesha — THATHWAMASI PWA Service Worker
   - Offline support
   - Clean URLs (/about etc.) work offline
   - Static assets cache-first; pages network-first
   v5: mint/cream boost; neon palette; pages cached under their own URL, home page stays the
       offline fallback, /index.html dropped from precache (it
       307-redirects which breaks cache.addAll) */
var CACHE = 'thathwamasi-v5';
var CORE = [
  '/',
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

  /* Page navigations — network first, offline lo cached page / index.html */
  if (req.mode === 'navigate') {
    var pageKey = (url.pathname === '/index.html') ? '/' : url.pathname;
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) {
          if (url.pathname === '/' || url.pathname === '/index.html') {
            c.put('/', copy);
          } else {
            c.put(pageKey, copy);
          }
        });
        return res;
      }).catch(function () {
        return caches.match(pageKey).then(function (r) { return r || caches.match('/'); });
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
