const CACHE = 'shadow-work-v1';
const ASSETS = ['./', 'css/style.css', 'js/app.js', 'js/i18n.js', 'icon-192.svg'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
