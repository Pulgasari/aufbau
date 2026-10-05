# @aufbau/svg

svg-dateien und icon-aliases von aufbau, früher getrennt als `@aufbau/icons`.

| ordner      | inhalt |
| ----------- | ------ |
| `icons/`    | eigene icons, in `<svg-icon>` unter dem präfix `aufbau` |
| `logos/`    | logos, in `<svg-logo>` |
| `filters/`  | generiert aus `@aufbau/filters` (`.github/scripts/generate-assets.mjs`) |
| `patterns/` | generiert aus `@aufbau/patterns`, ebenso |
| `data/`     | die alias-listen |

bei den icons ein hybrid wie `@aufbau/webfonts`:
- einerseits opinionated aufbau-standard-icons (die alias-liste in `data/`)
- andererseits allgemein: jedes iconify-icon geht per voller id (`lucide:save`)

## nutzung

```js
import '@aufbau/svg';               // registriert <svg-icon>, <svg-flag>, <svg-logo> + default-aliases
import { SvgIcon } from '@aufbau/svg';

SvgIcon.register({ brand: 'simple-icons:deno' });  // eigene aliases, überschreiben defaults
```

```html
<svg-icon icon="save"></svg-icon>               <!-- alias -->
<svg-icon icon="lucide:save"></svg-icon>        <!-- volle iconify-id -->
<svg-icon icon="aufbau:aufbau"></svg-icon>      <!-- icons/aufbau.svg -->
<svg-icon icon="info" label="Hinweis"></svg-icon> <!-- mit label: role img, sonst aria-hidden -->
<svg-flag code="de"></svg-flag>
<svg-logo logo="zugriff" label="zugriff"></svg-logo> <!-- logos/zugriff.svg -->
```

`@aufbau/elements` hängt nicht von diesem package ab. `<svg-icon>` lädt
`@aufbau/svg/aliases.js` lazy per dynamic import, sobald zum ersten mal ein
unbekannter alias auftaucht. seiten, die nur volle ids nutzen, laden die liste nie.
ist das package nicht auflösbar (kein import-map-eintrag), gibt es eine warnung
und aliases bleiben leer.

`aufbau:…` und `<svg-logo>` lösen ihre dateien per `import.meta.resolve()` über
den import-map-eintrag `@aufbau/svg/` auf, nicht über iconify. ohne den eintrag
gibt es ebenfalls eine warnung.

## dateien

| datei              | inhalt |
| ------------------ | ------ |
| `index.js`         | reicht `SvgIcon`/`SvgFlag`/`SvgLogo` durch, registriert die aliases eager |
| `aliases.js`       | nur daten, importiert kein element (sonst zyklus mit dem lazy import) |
| `data/icons.json`  | allgemeine ui-icons |
| `data/code.json`   | editor-spezifisch (apps/code) |
| `data/brands.json` | marken |
| `index.json5`      | katalog von filters/ und patterns/, generiert |

## offline-bundling

ziel: ein build ohne netz zur laufzeit, z. b. zugriff als capacitor-android-app
mit lokalen assets. `<svg-icon>` fragt zuerst `SvgIcon.provide()` ab und
nur, wenn dort nichts liegt, die iconify-api.

das übernimmt der `icons`-schritt von `@aufbau/bundler` (`bundler/steps/icons.js`):

1. **sammeln**: jedes gequotete `set:name` im gestageten code und in den daten,
   dessen set eine iconify-collection ist (`@iconify/collections`). das deckt
   `icon="…"`, die alias-listen hier und die eines projekts und datendateien wie
   eine registry ab. dynamische namen findet kein scanner, dafür `include`.
2. **svgs holen**: aus `@iconify-json/<set>` von npm, mit `getIconData()` +
   `iconToSVG()` aus `@iconify/utils`.
3. **ausgeben**: ein modul, das sie per `SvgIcon.provide()` übergibt, am ende
   von `<head>` eingebunden, also vor der app:

```js
// /_icons/provide.js (generiert)
import SvgIcon from '@aufbau/elements/webcomponents/svg-icon.js';
SvgIcon.provide({ 'mdi:folder': '<svg …>…</svg>', … });
```

`aufbau:…` und die logos sind keine iconify-collection, sie liegen als dateien im
package. der `prune`-schritt behält `icons/` bzw. `logos/`, sobald `<svg-icon>`
bzw. `<svg-logo>` erreicht wird (beide nennen ihren ordner als
`'@aufbau/svg/…/'`).
