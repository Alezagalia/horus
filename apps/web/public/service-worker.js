/**
 * Service Worker for Web Push Notifications
 * Sprint 12 - US-107
 *
 * Handles:
 * - Install and activation
 * - Push notification reception
 * - Notification click (deep linking)
 */

const CACHE_NAME = 'horus-v1';
const urlsToCache = ['/', '/index.html'];

/**
 * Install event - cache resources
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

/**
 * Activate event - clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Take control immediately
  );
});

/**
 * Push event - receive push notification from server
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  // Default notification data
  let title = 'Horus';
  let options = {
    body: 'Tienes un nuevo recordatorio',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'horus-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
      },
      {
        action: 'close',
        title: 'Cerrar',
      },
    ],
  };

  // Parse notification data from server
  if (event.data) {
    try {
      const data = event.data.json();

      if (data.notification) {
        title = data.notification.title || title;
        options.body = data.notification.body || options.body;
        options.icon = data.notification.icon || options.icon;
        options.image = data.notification.image;
      }

      // Store custom data for click handling
      if (data.data) {
        options.data = data.data;
      }
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  // Show notification
  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Notification click event - handle deep linking
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  // Handle different actions
  if (event.action === 'close') {
    return;
  }

  // Deep linking based on notification data
  let targetUrl = '/';

  if (event.notification.data) {
    const data = event.notification.data;

    switch (data.type) {
      case 'habit_reminder':
        targetUrl = `/habits${data.habitId ? `?highlight=${data.habitId}` : ''}`;
        break;

      case 'task_reminder':
        targetUrl = `/tasks${data.taskId ? `?highlight=${data.taskId}` : ''}`;
        break;

      case 'event_reminder':
        targetUrl = `/calendar${data.eventId ? `?highlight=${data.eventId}` : ''}`;
        break;

      default:
        targetUrl = '/';
    }
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === new URL(targetUrl, self.location.origin).href && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/**
 * Fetch event - serve from cache when offline
 */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

console.log('[Service Worker] Loaded');
