self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body || data.description,
                icon: '/logo.png',
                badge: '/logo.png',
                data: data.url || '/'
            };
            event.waitUntil(self.registration.showNotification(data.title, options));
        } catch (e) {
            const options = {
                body: event.data.text(),
                icon: '/logo.png',
                badge: '/logo.png',
                data: '/'
            };
            event.waitUntil(self.registration.showNotification('WorkoutOS', options));
        }
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data || '/');
        })
    );
});
