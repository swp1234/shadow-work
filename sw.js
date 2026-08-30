const CACHE = 'shadow-reflection-v3';
const ASSETS = [
  '/shadow-work/',
  '/shadow-work/index.html',
  '/shadow-work/css/style.css',
  '/shadow-work/js/app.js',
  '/shadow-work/js/i18n.js',
  '/shadow-work/icon-192.svg',
  '/shadow-work/js/locales/ko.json',
  '/shadow-work/js/locales/en.json',
  '/shadow-work/js/locales/zh.json',
  '/shadow-work/js/locales/hi.json',
  '/shadow-work/js/locales/ru.json',
  '/shadow-work/js/locales/ja.json',
  '/shadow-work/js/locales/es.json',
  '/shadow-work/js/locales/pt.json',
  '/shadow-work/js/locales/id.json',
  '/shadow-work/js/locales/tr.json',
  '/shadow-work/js/locales/de.json',
  '/shadow-work/js/locales/fr.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(caches.match(event.request).then(cached => {
    const fetched = fetch(event.request).then(response => {
      if (response && response.status === 200) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => cached);
    return cached || fetched;
  }));
});
