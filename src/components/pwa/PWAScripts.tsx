'use client';

import { useEffect } from 'react';

export default function PWAScripts() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            // SW registered
          }).catch(registrationError => {
            // SW registration failed
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
