// Copia local de la app para que funcione sin internet.
// Al cambiar cualquier archivo de la app, sube VERSION para que el celular descargue la nueva.
const VERSION = 'reloj-anomalo-v32';
// Las fuentes van en una caché aparte que no se borra con cada versión (no cambian).
const FUENTES = 'reloj-fuentes-v1';
const ARCHIVOS = ['./', './index.html', './estilo.js', './anim.js', './reloj.js', './analisis.js', './auditoria.js', './pantallas.js', './cargas.js', './manifest.json', './icono.svg', './icono-192.png', './icono-512.png', './icono-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('reloj-anomalo-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Fuentes de Google: se guardan la primera vez que se descargan.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // solo se guardan respuestas buenas (o las opacas de no-cors, que no se pueden inspeccionar)
    e.respondWith(caches.open(FUENTES).then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; }))));
    return;
  }
  // Solo los archivos de esta app (Comida comparte la dirección y tiene su propia copia).
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  // Archivos de la app: con internet, siempre la versión más reciente (y se actualiza la copia);
  // sin internet o si la red tarda más de 3 s, la copia guardada.
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const red = fetch(e.request, { cache: 'no-cache' }).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; });
    const guardada = await cache.match(e.request, { ignoreSearch: true });
    if (!guardada) return red;
    return Promise.race([red.catch(() => guardada), new Promise(r => setTimeout(() => r(guardada), 3000))]);
  })());
});
