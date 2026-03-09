const CACHE_NAME = 'selvaapp-v2';

self.addEventListener('install', (event) => {
    // Almacena la versión pero NO la activa automáticamente si hay versiones viejas corriendo.
    // self.skipWaiting(); fue removido para evitar que desestabilice la PWA mientras el usuario la usa.
});

// Escuchar evento para forzar la actualización cuando el usuario haga click en "Actualizar"
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic network-first or pass-through
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
