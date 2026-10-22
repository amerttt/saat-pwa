// Bütün dosyalar kurulumda önbelleğe alınır; uygulama ilk açılıştan sonra ağsız çalışır.
// Dosya değişince VERSION'ı artır, eski önbellek activate'te silinir.
const VERSION = 'saat-v9';
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
  'fonts/unbounded-latin-ext-e699bb.woff2',
  'fonts/courier-prime-latin-b927e4.woff2',
  'fonts/courier-prime-latin-ext-cb90cc.woff2',
  'fonts/saira-stencil-one-latin-7d6d2b.woff2',
  'fonts/saira-stencil-one-latin-ext-3e238e.woff2',
  'fonts/special-elite-latin-f087a5.woff2',
  'fonts/special-elite-latin-ext-f9d1b8.woff2',
  'fonts/bodoni-moda-latin-02f9ec.woff2',
  'fonts/bodoni-moda-latin-ext-30dc91.woff2',
  'fonts/ibm-plex-mono-latin-2137a5.woff2',
  'fonts/ibm-plex-mono-latin-bc87d8.woff2',
  'fonts/ibm-plex-mono-latin-ext-6a11d6.woff2',
  'fonts/ibm-plex-mono-latin-ext-7963a1.woff2',
  'fonts/permanent-marker-latin-272d0e.woff2'
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
