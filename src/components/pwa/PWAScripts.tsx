'use client';

import { useEffect } from 'react';

export default function PWAScripts() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registered: ', registration);
          },
          (registrationError) => {
            console.log('SW registration failed: ', registrationError);
          }
        );
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register);
      }
    }
  }, []);

  return null;
}
