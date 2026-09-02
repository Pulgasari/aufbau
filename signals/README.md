# @aufbau/signals

a customized/extended version of the `@preact/signals` library.

## signal

```javascript
import { signal } from '@aufbau/signals';

let theme = signal({ type: String, value: 'dark', key: 'theme', store: local });
let mode  = signal({ value: 'on', values: ['on','off'], key: 'mode', store: cookie({ days: 7 }) });
let ui    = signal({ value: { sidebar: true }, key: 'ui', store: session, deep: 2 });
let tags  = signal({ type: Set, value: [], key: 'tags', store: local });
let plain = signal('blubb');

mode.cycle();        // on -> off -> on
mode.value = 'xl';   // ignoriert + console.warn
await theme.$ready;  // erst nach Hydration
```

## signal — nested persistence

a deep signal whose every leaf persists under its own `key + leafName`, instead of the
whole object as one blob. `key` is the shared prefix, `nested: true` selects per-leaf
storage (and implies a deep carrier). writes stay granular (only the changed leaf's key
is rewritten) and hydration merges — a leaf missing from storage keeps its seed, so a
later change to a code default still wins. `persist` optionally allow-lists the leaves.

```javascript
import { signal, local } from '@aufbau/signals';

const state = signal({
  key    : 'zugriff:notes:',   // per-leaf keys: zugriff:notes:font, zugriff:notes:dir, ...
  store  : local,
  nested : true,
  // persist : ['font', 'dir'], // optional allow-list; omitted persists every leaf
  value  : { font: 'Manrope', dir: 'ltr', dialog: null, route: null },
});

state.$onEffects({ font: value => {/* ... */} });
state.dialog = 'settings';     // writes only zugriff:notes:dialog
```

## deepSignal

```javascript
import { deepSignal } from '@aufbau/signals';

const state = deepSignal({
  dir    : 'ltr',
  dialog : null,
  route  : null,
  font   : 'Manrope',
});

// :::::: EFFECTS

// variant 1 (regular)
effect(() => document.documentElement.setAttribute('dir', state.dir));
effect(() => aufbau.webfonts.init({ name: state.font, target: '--font' }));

// variant 2
state.$onEffects ({
  dir  : (value) => $root?.setAttribute('dir', value),
  font : (value) => aufbau.webfonts.init({ name: value, target: '--font' }),
});
```

## querySignal

```javascript
let icons = querySignal(fakeFetcher({ delay: 400, fail: 0.1, total: 250 }), {
  infinite: true, prefetch: true, limit: 20,
  deps: () => [query.value],
  enabled: () => query.value.length > 1,
});
icons.value.data;          // flach, egal ob infinite
icons.fetchNextPage();
icons.refetch();
```



## boolSignal

```javascript
import { boolSignal, signal } from '@aufbau/signals';

let open = boolSignal(false);
open.toggle();   // true
open.off();      // false
open.value = 1;  // coerced -> true

// persisted via the factory
let dark = signal({ type: Boolean, value: true, key: 'dark', store: local });
```

## scalarSignal

---

# TODO

- **naming.** das erweiterte factory wird aktuell als `signal` UND `betterSignal` exportiert. preacts rohes `signal`/`Signal` läuft als `preactSignal`/`PreactSignal`. name am ende nochmal final festzurren.
