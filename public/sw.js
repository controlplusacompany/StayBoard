self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// A fetch handler is required for PWA installability.
// We keep it empty to allow the browser to handle all requests normally,
// which avoids "Failed to fetch" errors in the console from the service worker.
self.addEventListener('fetch', (event) => {
  // No-op
});
