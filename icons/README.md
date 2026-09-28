# @aufbau/icons

eigenes icons-package. wie schon bei `@aufbau/webfonts` ein hybrid:
- einerseits opinionated aufbau-standard-icons (die alias-liste in `data/`)
- andererseits allgemein: jedes iconify-icon geht per voller id (`lucide:save`)

## nutzung

```js
import '@aufbau/icons';               // registriert <aufbau-icon>, <aufbau-flag> + default-aliases
import { AufbauIcon } from '@aufbau/icons';

AufbauIcon.register({ brand: 'simple-icons:deno' });  // eigene aliases, überschreiben defaults
```

```html
<aufbau-icon icon="save"></aufbau-icon>               <!-- alias -->
<aufbau-icon icon="lucide:save"></aufbau-icon>        <!-- volle iconify-id -->
<aufbau-icon icon="info" label="Hinweis"></aufbau-icon> <!-- mit label: role img, sonst aria-hidden -->
<aufbau-flag code="de"></aufbau-flag>
```

`@aufbau/elements` hängt nicht von diesem package ab. `<aufbau-icon>` lädt
`@aufbau/icons/aliases.js` lazy per dynamic import, sobald zum ersten mal ein
unbekannter alias auftaucht. seiten, die nur volle ids nutzen, laden die liste nie.
ist das package nicht auflösbar (kein import-map-eintrag), gibt es eine warnung
und aliases bleiben leer.

## dateien

| datei              | inhalt |
| ------------------ | ------ |
| `index.js`         | reicht `AufbauIcon`/`AufbauFlag` durch, registriert die aliases eager |
| `aliases.js`       | nur daten, importiert kein element (sonst zyklus mit dem lazy import) |
| `data/icons.json`  | allgemeine ui-icons |
| `data/code.json`   | editor-spezifisch (apps/code) |
| `data/brands.json` | marken |

## offline-bundling

ziel: ein build ohne netz zur laufzeit, z. b. zugriff als capacitor-android-app
mit lokalen assets. `<aufbau-icon>` fragt zuerst `AufbauIcon.provide()` ab und
nur, wenn dort nichts liegt, die iconify-api.

das übernimmt der `icons`-schritt von `@aufbau/bundler` (`bundler/steps/icons.js`):

1. **sammeln**: jedes gequotete `set:name` im gestageten code und in den daten,
   dessen set eine iconify-collection ist (`@iconify/collections`). das deckt
   `icon="…"`, die alias-listen hier und die eines projekts und datendateien wie
   eine registry ab. dynamische namen findet kein scanner, dafür `include`.
2. **svgs holen**: aus `@iconify-json/<set>` von npm, mit `getIconData()` +
   `iconToSVG()` aus `@iconify/utils`.
3. **ausgeben**: ein modul, das sie per `AufbauIcon.provide()` übergibt, am ende
   von `<head>` eingebunden, also vor der app:

```js
// /_icons/provide.js (generiert)
import AufbauIcon from '@aufbau/elements/AufbauIcon.js';
AufbauIcon.provide({ 'mdi:folder': '<svg …>…</svg>', … });
```
