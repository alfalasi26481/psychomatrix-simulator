// عامل الخدمة: يبقي التطبيق يعمل دون اتصال، مع ضمان وصول أي تحديث فور إعادة الفتح.
//
// الاستراتيجية مقصودة ومختلفة حسب نوع الملف:
//  • صفحة التطبيق (HTML): الشبكة أولًا ثم الذاكرة عند انقطاع الاتصال.
//    الاعتماد على الذاكرة أولًا كان يُبقي من فتح التطبيق سابقًا على نسخة قديمة
//    إلى الأبد حتى بعد نشر تحديث.
//  • الأيقونات والملفات الثابتة: الذاكرة أولًا (لا تتغير) مع تحديث صامت بالخلفية.
const VERSION = 'v1';
const CACHE = 'lta-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/og-image.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isDocument(req) {
  return req.mode === 'navigate' || (req.destination === 'document') ||
    (req.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (isDocument(req)) {
    // الشبكة أولًا: أي نسخة منشورة جديدة تصل فورًا عند إعادة الفتح
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then((hit) => hit || caches.match('./index.html', { ignoreSearch: true })))
    );
    return;
  }

  // ملفات ثابتة: من الذاكرة فورًا، مع تحديث صامت للمرة القادمة
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
