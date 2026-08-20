// kit/init.js (Klassisches JS, KEIN type="module")
(function () {
  // 1. Basis-URL dynamisch aus dem Pfad von init.js ermitteln
  // Ergibt z.B. "https://pulgasari.github.io/aufbau/" oder "http://localhost:3000/"
  const currentScript = document.currentScript;
  const baseUrl = currentScript
    ? new URL('../', currentScript.src).href
    : './';

  // 2. Importmap-Objekt mit dynamischen absoluten URLs erstellen
  const importMap = {
    imports: {
      "preact": "https://esm.sh/preact@10.20.1",
      "preact/hooks": "https://esm.sh/preact@10.20.1/hooks",
      "@preact/signals": "https://esm.sh/@preact/signals@1.2.2?external=preact",
      "htm": "https://esm.sh/htm@3.1.1",
      "@aufbau/kit": new URL('kit/index.js', baseUrl).href,
      "@aufbau/stylesheet": new URL('stylesheet/index.js', baseUrl).href,
      "@aufbau/filters": new URL('filters/index.js', baseUrl).href,
      "@aufbau/patterns": new URL('patterns/index.js', baseUrl).href,
      "@aufbau/cache": new URL('cache/index.js', baseUrl).href,
      "@aufbau/import": new URL('import/index.js', baseUrl).href
    }
  };

  // 3. Script-Tag für die Importmap im Head erzeugen und einfügen
  const mapScript = document.createElement('script');
  mapScript.type = 'importmap';
  mapScript.textContent = JSON.stringify(importMap);
  document.head.appendChild(mapScript);
})();
