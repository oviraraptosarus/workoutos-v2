self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
    if (event.data) {
        let title = 'WorkoutOS';
        let options = {
            icon: '/logo.png',
            badge: '/logo.png', // Note: Android prefers monochrome small icons for badge, but we'll try this
            data: '/'
        };
        
        try {
            const data = event.data.json();
            title = data.title || title;
            options.body = data.body || data.description || '';
            if (data.url) options.data = data.url;
            
            // Add mobile-friendly options
            options.vibrate = [200, 100, 200, 100, 200, 100, 200];
            options.requireInteraction = false;
        } catch (e) {
            options.body = event.data.text();
        }

        const promiseChain = self.registration.showNotification(title, options)
            .catch(err => {
                console.error('Failed to show notification:', err);
                // Fallback without badge/vibrate which sometimes crash android
                return self.registration.showNotification('WorkoutOS', {
                    body: 'You have a new update.',
                    icon: '/logo.png'
                });
            });

        event.waitUntil(promiseChain);
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
                if (event.notification.data && event.notification.data !== '/') {
                    client.navigate(event.notification.data);
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data || '/');
        })
    );
});
