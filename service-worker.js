/* 本地缓存用于首次打开后离线游玩；所有游戏资源均来自本项目，无外部网络依赖。 */
const CACHE_NAME = 'cat-home-v6';
const ASSETS = ['./', './index.html', './style.css', './cat-theme.css', './polish.css', './config.js', './game.js', './manifest.webmanifest', './cat-home.svg'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match('./index.html'))));
});
