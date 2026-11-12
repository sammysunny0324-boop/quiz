// Service worker: ให้เปิดเว็บได้แม้ไม่มีเน็ต (หลังเปิดครั้งแรก) และอัปเดตเองเมื่อมีเวอร์ชันใหม่
const VER = '7cf8b27aca';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-64.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open('core-' + VER).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('core-') && k !== 'core-' + VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  // หน้าเว็บ: ลองโหลดเวอร์ชันใหม่จากเน็ตก่อน ถ้าไม่มีเน็ตใช้ของที่เก็บไว้
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open('core-' + VER).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // ฟอนต์จาก Google: ใช้ของเดิมไปก่อน แล้วอัปเดตเบื้องหลัง
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open('fonts').then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (url.origin === location.origin) e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
