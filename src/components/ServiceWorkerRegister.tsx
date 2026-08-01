'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(
          function (registration) {
            // Registration successful
          },
          function (err) {
            console.error('Service Worker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return null;
}
