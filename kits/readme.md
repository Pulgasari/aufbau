# @aufbau/kits

a **kit** is a bundle of all aufbau-packages combined with other frameworks/libraries ready to use in the browser with ease.

## @aufbau/kits/preact-htm

a kit containing aufbau + preact (core, hooks, signals) + htm.

```javascript
https://esm.sh/jsr/@aufbau/kits/preact-htm
```

```javascript
import aufbau, { html, preact } from '@aufbau/kits/preact-htm';

aufbau.init();
const { useEffect, useRef, signal } = preact;
```

## @aufbau/kits/preact-jsx

## @aufbau/kits/react-jsx

## @aufbau/kits/svelte

---

# importmap (polyfill)

because **aufbau** is not published yet this importmap needs to be defined.

```html
<script src="https://code.pulgasari.dev/importmap.js"></script>
```

or copypaste:

```html
<script type="importmap">{"imports":{
  "htm"                  : "https://esm.sh/htm@3.1.1",
  "preact"               : "https://esm.sh/preact@10.20.1",
  "preact/hooks"         : "https://esm.sh/preact@10.20.1/hooks",
  "@preact/signals"      : "https://esm.sh/@preact/signals@1.2.2?external=preact",
      
  "@aufbau/builders/docs"  : "https://code.pulgasari.dev/aufbau/builders/docs/index.js",
  "@aufbau/elements"       : "https://code.pulgasari.dev/aufbau/elements/index.js",
  "@aufbau/elements/"      : "https://code.pulgasari.dev/aufbau/elements/",
  "@aufbau/filters"        : "https://code.pulgasari.dev/aufbau/filters/index.js",
  "@aufbau/import"         : "https://code.pulgasari.dev/aufbau/import/index.js",
  "@aufbau/js"             : "https://code.pulgasari.dev/aufbau/js/index.js",
  "@aufbau/patterns"       : "https://code.pulgasari.dev/aufbau/patterns/index.js",
  "@aufbau/plugins"        : "https://code.pulgasari.dev/aufbau/plugins/index.js",
  "@aufbau/plugins/vite"   : "https://code.pulgasari.dev/aufbau/plugins/vite/index.js",
  "@aufbau/runtime"        : "https://code.pulgasari.dev/aufbau/runtime/index.js",
  "@aufbau/runtime/"       : "https://code.pulgasari.dev/aufbau/runtime/",
  "@aufbau/store"          : "https://code.pulgasari.dev/aufbau/store/index.js",
  "@aufbau/stylesheet"     : "https://code.pulgasari.dev/aufbau/stylesheet/index.js",
  "@aufbau/stylesheet/"    : "https://code.pulgasari.dev/aufbau/stylesheet/",
  "@aufbau/svg/"           : "https://code.pulgasari.dev/aufbau/svg/",

  "@bunker/cache"          : "https://code.pulgasari.dev/bunker/cache/index.js",
  "@bunker/core"           : "https://code.pulgasari.dev/bunker/core/index.js",
  "@bunker/db"             : "https://code.pulgasari.dev/bunker/db/index.js",
  "@bunker/policy"         : "https://code.pulgasari.dev/bunker/policy/index.js",
  "@bunker/storage"        : "https://code.pulgasari.dev/bunker/storage/index.js",

  "@domina/core"           : "https://code.pulgasari.dev/domina/core/index.js"
}}</script>
```
