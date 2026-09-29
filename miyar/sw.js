/* مِعيار — عامل الخدمة: الصفحة شبكة أولًا (التحديثات تصل فور إعادة الفتح)، الأصول ذاكرة أولًا. */
const VERSION='v2';
const CACHE='miyar-'+VERSION;
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png','./icons/og-image.png','./art/hero.webp','./art/gcat.webp','./art/pq.webp','./art/dbx.webp','./art/jud.webp','./art/sim.webp','./art/report.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>undefined)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function isDocument(req){return req.mode==='navigate'||req.destination==='document'||(req.headers.get('accept')||'').includes('text/html')}
self.addEventListener('fetch',e=>{const req=e.request; if(req.method!=='GET')return; if(new URL(req.url).origin!==self.location.origin)return;
  if(isDocument(req)){ e.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(req,c));return r}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))); return }
  e.respondWith(caches.match(req).then(hit=>{const net=fetch(req).then(r=>{if(r&&r.ok)caches.open(CACHE).then(x=>x.put(req,r.clone()));return r}).catch(()=>hit);return hit||net}));
});
