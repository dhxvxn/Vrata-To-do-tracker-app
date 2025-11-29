
const CACHE_NAME = 'vrata-v1';

self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Tell the active service worker to take control of the page immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      // If network fails, we could return a fallback here
      // For now, we just rely on browser caching
      return new Response("Offline");
    })
  );
});
