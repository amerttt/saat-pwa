// Bütün dosyalar kurulumda önbelleğe alınır; uygulama ilk açılıştan sonra ağsız çalışır.
// Dosya değişince VERSION'ı artır, eski önbellek activate'te silinir.
const VERSION = 'saat-v3';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'nosleep-video.js',
  'land-dots.json',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'fonts/fonts.css',
  'fonts/anton-latin-5f6ded.woff2',
  'fonts/anton-latin-ext-7bc989.woff2',
  'fonts/cormorant-garamond-latin-ac5feb.woff2',
  'fonts/cormorant-garamond-latin-ext-480720.woff2',
  'fonts/fredoka-latin-b14535.woff2',
  'fonts/fredoka-latin-ext-da4a20.woff2',
  'fonts/outfit-latin-ebadd8.woff2',
  'fonts/outfit-latin-ext-744997.woff2',
  'fonts/unbounded-latin-c22c22.woff2',
  'fonts/unbounded-latin-ext-e699bb.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first. Sayfa isteği önbellekte yoksa index.html döner.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => req.mode === 'navigate' ? caches.match('index.html') : Response.error());
    })
  );
});
