// Service Worker đơn giản nhất để Android nhận diện là PWA
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});
self.addEventListener('fetch', (e) => {});
