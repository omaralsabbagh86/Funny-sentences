const VERSION = 'V9';
const CACHE = 'sgb-' + VERSION;
const ASSETS = ['./', 'index.html', 'style.css', 'script.js', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.search.includes('nocache')) return;
    if (url.pathname.endsWith('.apk')) return; // ملف APK كبير: لا يُخزَّن

    if (url.origin === location.origin) {
        // ملفات التطبيق: الشبكة أولاً (لتصلك التحديثات) ثم النسخة المخزنة عند انقطاع الإنترنت
        e.respondWith(
            fetch(req)
                .then(res => {
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put(req, copy));
                    return res;
                })
                .catch(() => caches.match(req).then(m => m || caches.match('index.html')))
        );
    } else if (url.hostname === 'cdn.jsdelivr.net') {
        // المكتبات الخارجية: المخزن أولاً لأنها لا تتغير (إصدار ثابت)
        e.respondWith(
            caches.match(req).then(m => m || fetch(req).then(res => {
                if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
                return res;
            }))
        );
    }
});
