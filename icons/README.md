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

## konzept: offline-bundling (noch nicht gebaut)

ziel: ein build ohne netz zur laufzeit, z. b. zugriff als capacitor-android-app
mit lokalen assets. `<aufbau-icon>` fragt dafür schon heute zuerst
`AufbauIcon.provide()` ab und nur, wenn dort nichts liegt, die iconify-api.
ein bundler-schritt muss also nur ein modul erzeugen, das vor den elementen läuft:

```js
// icons.bundle.js (generiert)
import { AufbauIcon } from '@aufbau/icons';
AufbauIcon.provide({
  'material-symbols:file-save': '<svg …>…</svg>',
  'mdi:folder'                : '<svg …>…</svg>',
});
```

bausteine:

1. **sammeln**: quelltext scannen nach `icon="…"`, `icon=${'…'}`, `icon: '…'`,
   dazu die ids, die elements selbst setzen (`lucide:x`, `lucide:chevron-down`,
   die toast-icons, …) und `<aufbau-flag code>` → `circle-flags:<code>`.
   dynamische namen findet kein scanner, dafür eine `include`-liste in der config.
2. **auflösen**: aliases über `aliases.js` zu ids.
3. **svgs holen**: offline aus `@iconify/json` (alle sets, gross, nur dev-dependency)
   oder gezielt aus `@iconify-json/<set>`. `getIconData()` + `iconToSVG()` aus
   `@iconify/utils` machen daraus das svg-markup.
4. **ausgeben**: `icons.bundle.js` wie oben, bei vite als virtuelles modul.

umsetzung als vite-plugin (oder `unplugin`, dann vite/rollup/esbuild aus einer
quelle). `unplugin-icons` selbst passt nicht direkt: es erzeugt komponenten pro
import, nicht eine laufzeit-map für attribut-strings. `@iconify/utils` +
`@iconify/json` sind aber genau die teile, die es intern nutzt.

offen:
- scanner-heuristik vs. explizite liste, oder beides
- deno ohne vite: dasselbe als cli-skript (`deno run icons:bundle`)
- alternativ statt `provide()` ein self-hosted iconify-api-endpoint (config `icon-api`)
