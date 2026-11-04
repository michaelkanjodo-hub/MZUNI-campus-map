/* MZUNI offline worker — no third-party library, so it stays small and auditable. */
const VERSION = 'mzuni-v1.0.0';
const APP_CACHE = `${VERSION}-app`;
const DATA_CACHE = `${VERSION}-data`;
const TILE_CACHE = `${VERSION}-tiles`;
const CORE_ASSETS = [
  '/', '/index.html', '/manifest.webmanifest', '/data/campus.geojson',
  '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png',
  '/images/admin.svg', '/images/library.svg', '/images/lecture.svg', '/images/ict.svg',
  '/images/science.svg', '/images/cafeteria.svg', '/images/clinic.svg', '/images/sports.svg',
  '/images/hostel.svg', '/images/gate.svg',
];
const CAMPUS_BOUNDS = { north: -11.4315, south: -11.4440, west: 34.0005, east: 34.0145 };

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('mzuni-') && ![APP_CACHE, DATA_CACHE, TILE_CACHE].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

function tileNumber(longitude, latitude, zoom) {
  const scale = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * scale);
  const lat = (latitude * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * scale);
  return { x, y };
}

async function trimCache(cacheName, maximum) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maximum) await Promise.all(keys.slice(0, keys.length - maximum).map((key) => cache.delete(key)));
}

async function cacheCampusTiles(zooms = [15, 16]) {
  const cache = await caches.open(TILE_CACHE);
  let downloaded = 0;
  for (const zoom of zooms) {
    const topLeft = tileNumber(CAMPUS_BOUNDS.west, CAMPUS_BOUNDS.north, zoom);
    const bottomRight = tileNumber(CAMPUS_BOUNDS.east, CAMPUS_BOUNDS.south, zoom);
    for (let x = topLeft.x; x <= bottomRight.x; x += 1) {
      for (let y = topLeft.y; y <= bottomRight.y; y += 1) {
        if (downloaded >= 160) return;
        const url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
        const request = new Request(url, { mode: 'cors' });
        if (await cache.match(request)) continue;
        try {
          const response = await fetch(request);
          if (response.ok || response.type === 'opaque') { await cache.put(request, response); downloaded += 1; }
        } catch { /* Offline: already viewed tiles and vector paths still work. */ }
      }
    }
  }
  await trimCache(TILE_CACHE, 350);
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_CAMPUS') event.waitUntil(cacheCampusTiles(event.data.zooms));
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function isCampusTile(url) {
  if (url.hostname !== 'tile.openstreetmap.org') return false;
  const match = url.pathname.match(/^\/(\d+)\/(\d+)\/(\d+)\.png$/);
  if (!match) return false;
  const [, z, x, y] = match.map(Number);
  if (z < 14 || z > 19) return false;
  // Convert tile centre back to longitude/latitude and reject non-campus tiles.
  const scale = 2 ** z;
  const longitude = ((x + 0.5) / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * (y + 0.5)) / scale;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return longitude >= CAMPUS_BOUNDS.west && longitude <= CAMPUS_BOUNDS.east && latitude >= CAMPUS_BOUNDS.south && latitude <= CAMPUS_BOUNDS.north;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Never cache admin API responses or staff sessions.
  if (url.pathname.startsWith('/api/admin')) return;

  if (isCampusTile(url)) {
    event.respondWith(caches.open(TILE_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') { await cache.put(request, response.clone()); await trimCache(TILE_CACHE, 350); }
        return response;
      } catch {
        return new Response('', { status: 204, statusText: 'Offline tile unavailable; vector campus remains visible' });
      }
    }));
    return;
  }

  if (url.pathname === '/api/campus' || url.pathname === '/data/campus.geojson') {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok) (await caches.open(DATA_CACHE)).put(request, response.clone());
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match('/data/campus.geojson'))));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok) (await caches.open(APP_CACHE)).put('/index.html', response.clone());
      return response;
    }).catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/'))));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(request).then((cached) => {
      const network = fetch(request).then(async (response) => {
        if (response.ok) (await caches.open(APP_CACHE)).put(request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || network;
    }));
  }
});
