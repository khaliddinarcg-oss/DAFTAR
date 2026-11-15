/* Daftar — service worker: the app works without connexion after the first load. */
const V = 'daftar-v1-5';
const CORE = ['./', './index.html', './manifest.webmanifest', './img/icon-192.png', './img/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* app files: network first, so a new version arrives; libraries: cache first */
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  /* the shop's data on the server: always live, never from the cache */
  if (url.hostname.endsWith('.supabase.co')) return;
  const sameSite = url.origin === location.origin;
  if (sameSite) {
    e.respondWith(fetch(r).then(res => {
      const copy = res.clone();
      caches.open(V).then(c => c.put(r, copy));
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
      const copy = res.clone();
      caches.open(V).then(c => c.put(r, copy));
      return res;
    })));
  }
});
