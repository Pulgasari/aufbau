# @aufbau/signals

a customized/extended version of the `@preact/signals` library.

## signal (legacy factory)

`betterSignal`, exported as `signal`. still here while call sites move to
`signalStore` — mind that a plain object argument is read as **config**, not as a
value, which is the trap `signalStore` exists to close.

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



## signal types

each type stands alone: a class and a lowercase factory, taking the value itself —
there is no config object to confuse a value with. `signalStore` below is what adds
naming, validation and persistence on top.

| type | holds | beyond `.value` |
| --- | --- | --- |
| `BoolSignal`   | a boolean, coerced | `on()`, `off()`, `toggle()` |
| `EnumSignal`   | a value out of a list | `cycle()`, `$values` |
| `MapSignal`    | a `Map` | `get/set/delete/has/clear/replace`, `size`, `toObject()`, `toArray()` |
| `RecordSignal` | a plain object | `get/set/patch/delete/has/clear/replace`, `keys()`, `size` |
| `ScalarSignal` | anything, as given | — |
| `SetSignal`    | a `Set` | `add/delete/toggle/has/clear/replace`, `size`, `toArray()` |
| `StringSignal` | a string, coerced | `length`, `clear()` |

```javascript
import { boolSignal, enumSignal, recordSignal, setSignal } from '@aufbau/signals';

const open = boolSignal(false);
open.toggle();                       // true
open.value = 1;                      // coerced -> true

const view = enumSignal('grid', ['grid', 'list']);
view.cycle();                        // 'list'
view.value = 'xl';                   // ignored + console.warn

const tags = setSignal(['a']);
tags.toggle('b');                    // true

const pan = recordSignal({ x: 0, y: 0 });
pan.set('x', 5);                     // copy-on-write, publishes a fresh object
```

the collection types copy before they write, so every change publishes a new
reference — a `Map` mutated in place would never notify.

### RecordSignal vs deepSignal

both hold an object. `RecordSignal` holds it in **one** signal, so any change wakes
every reader of the record; `deepSignal` gives **each leaf** its own, so a change wakes
only the readers of the leaf that moved. take the record when the object is small and
read as a whole (a position, a pair of bounds, a draft), the deep signal when its
leaves are read apart from each other.

## signalStore

a store of named, typed leaves behind a `.value`-free facade. **every leaf declares its
type** — as a lowercase name, as the native constructor where one fits, or as the signal
class itself.

```javascript
import { signalStore, local, StringSignal } from '@aufbau/signals';

const ui = signalStore({
  view  : { type: 'enum',       values: ['grid', 'list'], value: 'grid' },
  dark  : { type: Boolean,      value: false },
  title : { type: StringSignal, value: '' },
  tags  : { type: Set,          value: [] },
  pan   : { type: 'record',     value: { x: 0, y: 0 } },
}, { key: 'app:ui:', store: local });

ui.view           // 'grid'  — reactive in render, no `.value`
ui.view = 'list'  // validated against the enum
ui.pan.x          // 0

ui.$signals.view.cycle();    // the carrier itself, for its own methods
ui.$signals.tags.add('x');
```

| spelling | example |
| --- | --- |
| lowercase name | `'bool'`, `'enum'`, `'map'`, `'record'`, `'scalar'`, `'set'`, `'string'` |
| native constructor | `Boolean`, `String`, `Map`, `Set`, `Object` |
| the class | `BoolSignal`, `EnumSignal`, `MapSignal`, … |

a leaf without a type, or with one that resolves to nothing, throws at construction.
that is the point: the older factory reads a plain object as **config**, so
`signal({ x: 0, y: 0 })` quietly hands back an empty scalar rather than the record it
looks like. here a leaf's shape is stated, not guessed.

`$signals` are the carriers, `$snapshot` a plain-object view, `$signal` the whole store
as one reactive value, `$update(patch)` a bulk write, `$keys` the declared names and
`$ready` the hydration promise.

### signalStore — persistence

`key` is a **prefix**: every leaf persists under `key + leafName`, never as one blob. a
write rewrites only the leaf that moved, and a leaf missing from storage keeps its
declared default, so a later change to that default still wins. `persist` optionally
allow-lists which leaves are stored. `Map` and `Set` leaves are stored as an object and
an array respectively, since neither survives JSON.

```javascript
const ui = signalStore({ … }, { key: 'app:ui:', store: local, persist: ['view', 'dark'] });
await ui.$ready;
```

---

# TODO

- **naming.** das erweiterte factory wird aktuell als `signal` UND `betterSignal` exportiert. preacts rohes `signal`/`Signal` läuft als `preactSignal`/`PreactSignal`. name am ende nochmal final festzurren — `signalStore` ist der weg dahin.
- **`EnumSignal.$restore`** schreibt an der liste vorbei, weil ein gespeicherter wert autoritativ ist. damit überlebt aber auch ein wert, den die liste inzwischen nicht mehr kennt. alternative: beim hydrieren verwerfen und den default behalten.
