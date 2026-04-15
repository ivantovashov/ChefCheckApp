const CACHE_NAME = 'chefcheck-v1.0.0';
const urlsToCache = [
    '.',
    'index.html',
    'app.js',
    'manifest.json'
];

// Установка Service Worker и кэширование файлов
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    // Активация сразу после установки
    self.skipWaiting();
});

// Обработка запросов (стратегия: сначала кэш, затем сеть)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэш, если он есть
                if (response) {
                    return response;
                }
                // Иначе делаем запрос в сеть
                return fetch(event.request)
                    .then(response => {
                        // Проверяем валидность ответа
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // Клонируем ответ для кэширования
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
    );
});

// Обновление Service Worker и очистка старых кэшей
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Применяем обновление ко всем клиентам
    event.waitUntil(clients.claim());
});

// Обработка push-уведомлений (опционально)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Новое уведомление',
        icon: 'icons/icon-192x192.png',
        badge: 'icons/badge-72x72.png',
        vibrate: [200, 100, 200]
    };
    event.waitUntil(
        self.registration.showNotification('ChefCheck', options)
    );
});