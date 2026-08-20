# @aufbau/filters

every filter is a plain js function that generates an svg `<filter>`. import one on
its own, or go through the barrel for the catalogue and the dom api. the static
assets under [`@aufbau/svg/filters`](../svg/filters) are generated from these
functions (see [`.github/scripts`](../.github/scripts)).

open [`index.html`](index.html) to try them live.

## a single filter

```javascript
import blur from '@aufbau/filters/blur';

blur();                 // <filter id="aufbau-filter-blur">…</filter>, defaults baked in
blur({ amount: 6 });    // baked with amount = 6
blur({ live: true });   // stdDeviation="var(--aufbau-filter-amount, 2)"

// named metadata alongside the default export
import { id, name, vars } from '@aufbau/filters/blur';
```

`live: true` swaps concrete values for `var(--aufbau-filter-<key>, <default>)`, which
is the form the injected `<defs>` and the generated `.svg` assets use so css custom
properties keep driving the primitives. some vars are `bake`-only (animation timing,
filter-primitive geometry) because those attributes cannot read a css var.

## the dom api

```javascript
import { applyFilter, removeFilter, list } from '@aufbau/filters';

applyFilter('#logo', 'glitch-rgb', { offsetX: 6 });
removeFilter('#logo');

list(); // [{ id, name, vars }, …] — used by preview pages and tooling
```

`applyFilter` injects the `<filter>` once into a shared hidden host and sets
`filter: url(#aufbau-filter-<id>)`, writing any passed options as inherited custom
properties. `ensureFilter(id)` does just the injection (no target), and
`useFilter(id, options)` binds one filter into a small handle:

```javascript
import { useFilter } from '@aufbau/filters';

const glitch = useFilter('glitch-rgb', { offsetX: 6 });
glitch.ensure();          // inject defs
glitch.apply('#logo');    // apply to targets
glitch.css;               // "filter: url(#aufbau-filter-glitch-rgb);"
```

## usage with @aufbau/stylesheet

built into `@aufbau/stylesheet`, which injects the defs during its async pre-pass:

```css
#logo      { aufbau-filter: glitch-rgb offsetX(6); }
.wave-band { aufbau-filter: wave frequency(0.04) scale(35); }
```
