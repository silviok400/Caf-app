const CACHE_NAME = 'cafe-control-v1';
const assetsToCache = [
  '/',
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'metadata.json',
  'manifest.json',
  'supabaseClient.ts',
  'components/Header.tsx',
  'components/QRScannerModal.tsx',
  'components/TableQRCodeModal.tsx',
  'contexts/DataContext.tsx',
  'pages/AdminDashboard.tsx',
  'pages/JoinServerPage.tsx',
  'pages/KitchenDashboard.tsx',
  'pages/LoginConfirmationPage.tsx',
  'pages/LoginPage.tsx',
  'pages/RoleSelectionPage.tsx',
  'pages/ServerSelectionPage.tsx',
  'pages/WaiterDashboard.tsx',
  'pages/CustomerMenuPage.tsx',
  'pages/CoffeeDetailsPage.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@400;500;700&family=Lora:wght@400;700&family=Montserrat:wght@400;700&family=Poppins:wght@400;700&family=Inter:wght@400;500;700&family=Lato:wght@400;700&family=Open+Sans:wght@400;700&family=Roboto:wght@400;500;700&display=swap',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-router-dom@^7.9.5',
  'https://aistudiocdn.com/lucide-react@^0.553.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.44.4/+esm',
  'https://upload.wikimedia.org/wikipedia/commons/c/c8/Blop.mp3',
  'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'
];

// Install event: opens a cache and adds the app shell assets to it.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        const cachePromises = assetsToCache.map(assetUrl => {
          // A standard CORS request is needed for cross-origin assets.
          // Opaque responses (from 'no-cors') can't be read by the app.
          return cache.add(assetUrl).catch(err => console.warn(`Could not cache ${assetUrl}: ${err}`));
        });
        return Promise.all(cachePromises);
      })
      .catch(error => {
        console.error('Failed to cache app shell:', error);
      })
  );
});

// Activate event: clean up old caches.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: serves assets from cache, falling back to network.
// This strategy is "Cache first".
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the request is in the cache, return the cached response.
        if (response) {
          return response;
        }

        // If the request is not in the cache, fetch it from the network.
        return fetch(event.request)
          .then((networkResponse) => {
            // Optional: You could add non-critical assets to the cache here as they are requested.
            return networkResponse;
          });
      })
      .catch((error) => {
        console.error('Error in fetch handler:', error);
        // Optional: you could return a custom offline page here.
        // For now, we just let the browser handle the error.
        throw error;
      })
  );
});