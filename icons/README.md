# @aufbau/icons

eigenes icons-package. wie schon bei `@aufbau/webfonts` ist das icons-package mehr oder weniger ein hybrid bzw es schlägt 2 fliegen mit einer klappe:
- einerseits opinionated aufbau-standard icons-vorauswahl (kurze namen wie `save`, `chevron-down`)
- andererseits allgemein (so allgemein wie quasi möglich): jede volle iconify-id (`collection:name`) geht direkt durch

## struktur

```
icons/
  index.js        entry: registriert <aufbau-icon>, re-exportiert element + maps + resolve()
  index.d.ts      zentrale type-notations
  data/
    index.js      merged die json-maps und exportiert sie
    icons.json    standard-set (allgemeine ui-icons)
    code.json     app/code-spezifische icons
    brands.json   marken / logos
```

`data/` ist reine daten (nur maps, keine logik). auflösung und fallback liegen im entry.

## api

```javascript
import icons, { resolve, standard, code, brands } from '@aufbau/icons';

// element ist durch den import bereits registriert:
document.body.innerHTML = '<aufbau-icon icon="save"></aufbau-icon>';

resolve('save');            // 'material-symbols:file-save'  (kurzer name -> iconify-id)
resolve('lucide:heart');    // 'lucide:heart'                (volle id geht durch)
resolve('gibtsnicht');      // 'material-symbols:help'       (fallback)
```

nur die maps ohne element (kein side-effect, keine element-registrierung):

```javascript
import { icons, standard, code, brands } from '@aufbau/icons/data';
```

exports:

| name       | inhalt                                                        |
| ---------- | ------------------------------------------------------------- |
| `icons`    | merged default-map (`standard` + `code` + `brands`), auch `default` |
| `standard` | `data/icons.json`                                             |
| `code`     | `data/code.json`                                              |
| `brands`   | `data/brands.json`                                            |
| `resolve`  | `(name) => iconify-id`                                        |
| `fallback` | `'material-symbols:help'`                                     |
| `AufbauIcon` | die web-component-klasse (aus `@aufbau/elements`)           |

## `<aufbau-icon>`

die web-component lebt weiterhin in `@aufbau/elements` und fetcht das svg zur laufzeit von iconify (`https://api.iconify.design`). attribute: `icon`, `size`, `color`, `mode` (`mask` | `image`). die map-auflösung greift auf `@aufbau/icons/data` zurück (siehe todo unten).

## todo

- [x] `@aufbau/elements/AufbauIcon.js` (siehe ordner `/elements`) hier importieren / exportieren
- [x] die standard-icons-map aus `elements/AufbauIcon.js` kommt nach `icons/data/` als json-file(s)
- [x] icons-map dann wiederum in der webcomponent importieren (ist nur ne zwischenlösung), aber erstmal notwendig wegen breaking

- [ ] offline / bundler svg-bundling (siehe [klärung](#offline--bundler-svg-bundling))

### zwischenlösung: map-kopplung

`elements/AufbauIcon.js` importiert die map wieder zurück aus `@aufbau/icons/data`. das ist eine bewusste interim-kopplung `elements -> icons`, damit kurze namen synchron auflösen ohne die tabelle im element zu inlinen. sauberer wäre es, die auflösung ganz in `@aufbau/icons` zu ziehen und das element nur volle iconify-ids nehmen zu lassen, aber das wäre breaking für alle bestehenden `<aufbau-icon icon="save">`.

performance-hinweis: der import zieht `data/index.js` + 3 json-files auf den kritischen pfad der element-registrierung (vorher: inline, 0 requests). die files sind klein und cachebar; das echte fix ist das bundling unten.

### offline / bundler svg-bundling

problem: `<aufbau-icon>` fetcht jedes svg einzeln zur laufzeit von iconify. browser-only ist das okay (cache, cdn), aber für deno / bundler-setups (vite, bun) will man die svg direkt gebundlet und offline lesen, ohne netzwerk.

empfehlung (noch zu entscheiden):

1. **nicht selbst neu bauen.** iconify liefert das offline-problem quasi fertig:
   - `@iconify/json` — alle collections als json (voll offline verfügbar).
   - `@iconify/utils` — `getIconData`, svg-builder etc. programmatisch, runtime-agnostisch.
   - `unplugin-icons` (+ `@iconify/json`) — vite/rollup/webpack/esbuild-plugin, das icons zur build-zeit als inline-svg / komponente bundlet. deckt den bundler-fall zu ~90% ohne eigenen plugin.
2. **element pluggable machen statt hart iconify-fetch.** kleiner, nicht-breaking erweiterungspunkt: eine injizierbare resolver-/loader-funktion (z.b. via `AufbauConfig`), die den svg-string liefert. browser-default bleibt der iconify-fetch; bundler-setups injizieren einen resolver, der aus einer gebundleten svg-map liest (aus `@iconify/utils` + `@iconify/json` generiert).
3. **eigenes vite-plugin nur, wenn (1)+(2) nicht reichen** — dann als dünner wrapper um `@iconify/utils`, der aus `data/*.json` (den kurzen namen) die konkreten svg zieht und als virtuelles modul bereitstellt.

offen ist die entscheidung zwischen "nur `unplugin-icons` empfehlen/dokumentieren" vs. "eigenen resolver-hook + optionales plugin bauen". das bringt node-deps ins ansonsten browser-first package, daher bewusst getrennt gehalten.
