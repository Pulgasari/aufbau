# Willkommen zu @aufbau/import Test

Dies ist eine **Markdown-Datei**, die direkt im Browser über `@aufbau/import` geladen und geparst werden kann.

## Features von Aufbau
- **Schnell & Buildless**: Keineswegs schwerfällig!
- **Flex & Grid Support**: Integriert mit `@aufbau/stylesheet`.
- **Reaktiv**: Perfekt kombiniert mit `@aufbau/kit` (Preact & Signals).

> *Protip:* Du kannst `.md` Dateien direkt importieren und in Komponenten als HTML rendern!

```js
import { importFile } from '@aufbau/import';

const content = await importFile('./test.md');
console.log(content);
```
