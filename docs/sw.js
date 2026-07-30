// aufbau/docs/sw.js

//import { interceptFetch } from '@aufbau/kit';
import { interceptFetch } from 'https://pulgasari.github.io/aufbau/kit';

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      // Intercept Aufbau stylesheets and assets
      const aufbauResponse = await interceptFetch(event);
      if (aufbauResponse) return aufbauResponse;

      // Fallback to network fetch
      return fetch(event.request);
    })()
  );
});
