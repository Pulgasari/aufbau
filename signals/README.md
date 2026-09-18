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

### EnumSignal

a value out of a fixed list. a write outside it is ignored and warned about rather than thrown, so one bad value cannot take a render down with it.

### MapSignal

a Map behind a signal. every mutator copies before it writes, so each change publishes a fresh reference — a Map mutated in place would never notify.

### RecordSignal

a plain object behind ONE signal, replaced on every write. the flat counterpart to deepSignal: a change here wakes every reader of the record, where a deep signal wakes only the readers of the leaf that moved. reach for this when the object is small and read as a whole (a position, a pair of bounds, a form's draft), and for deepSignal when its leaves are read apart from each other.

the constructor takes the object itself — there is no config shape to confuse it with, so `new RecordSignal({ x: 0, y: 0 })` stores exactly that.

### toNode

every type shares `BaseSignal`, which carries `$ready`, `$restore()` and a live text
node:

```javascript
const title = stringSignal('hello');
element.append(title.toNode());   // follows the signal from here on

node.$dispose();                  // stops following
```

nothing can tell when a detached node is collected, so the effect is handed back on
the node as `$dispose()` — call it when the node goes for good, or it keeps the signal
subscribed. `toText()` is what gets rendered; the collection types override it so a
node reads as JSON rather than `[object Map]`.

### RecordSignal vs deepSignal

both hold an object. `RecordSignal` holds it in **one** signal, so any change wakes
every reader of the record; `deepSignal` gives **each leaf** its own, so a change wakes
only the readers of the leaf that moved. take the record when the object is small and
read as a whole (a position, a pair of bounds, a draft), the deep signal when its
leaves are read apart from each other.

## signalStore

a store of named, typed leaves. **every leaf declares its type** — as a lowercase name,
as the native constructor where one fits, or as the signal class itself.

```javascript
import { signalStore, local, StringSignal } from '@aufbau/signals';

const ui = signalStore({
  view  : { type: 'enum',       values: ['grid', 'list'], value: 'grid' },
  dark  : { type: Boolean,      value: false },
  title : { type: StringSignal, value: '' },
  tags  : { type: Set,          value: [] },
  pan   : { type: 'record',     value: { x: 0, y: 0 } },
}, { key: 'app:ui:', store: local });
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

### reading and writing

a leaf reads as the **signal itself**, so its own methods are right there:

```javascript
ui.view              // the EnumSignal
ui.view.value        // 'grid'
ui.view.cycle();     // 'list'
ui.dark.toggle();
ui.tags.add('x');
```

`$name` is the same leaf's **value**, without the `.value`:

```javascript
ui.$view             // 'grid'   — reactive in render
ui.$view = 'list';   // writes it, validated by the leaf's type
```

and `get` / `set` do it by name, one leaf or several:

```javascript
ui.get('view');                        // 'grid'
ui.set('view', 'list');
ui.set({ view: 'list', dark: true });
```

assigning the bare name (`ui.view = 'list'`) writes the value too — a leaf is never
replaced wholesale. writes to a name the schema does not carry are ignored.

`$signals` are the carriers as a plain object, `$snapshot` a plain-object view of the
values, `$signal` the whole store as one reactive value, `$keys` the declared names and
`$ready` the hydration promise.

### reserved names

the store answers to `get`, `set`, `$signals`, `$snapshot`, `$signal`, `$keys` and
`$ready` itself. a leaf called `get` or `set` is shadowed by the method; one called
`keys`, `ready`, `signal`, `signals` or `snapshot` loses only its `$` shorthand. both
are warned about at construction, and the leaf stays reachable:

```javascript
ui.get('keys');   // always works
ui.keys.value;    // and so does the carrier
```

### persistence

`key` is a **prefix**: every leaf persists under `key + leafName`, never as one blob. a
write rewrites only the leaf that moved, and a leaf missing from storage keeps its
declared default, so a later change to that default still wins. `persist` optionally
allow-lists which leaves are stored. `Map` and `Set` leaves are stored as an object and
an array respectively, since neither survives JSON.

```javascript
const ui = signalStore({ … }, { key: 'app:ui:', store: local, persist: ['view', 'dark'] });
await ui.$ready;
```

hydration goes through `$restore`, which writes past a leaf's own validation — a stored
value is authoritative, even one an enum's list no longer knows.

---

# TODO

- **naming.** das erweiterte factory wird aktuell als `signal` UND `betterSignal` exportiert. preacts rohes `signal`/`Signal` läuft als `preactSignal`/`PreactSignal`. name am ende nochmal final festzurren — `signalStore` ist der weg dahin.
- **`EnumSignal.$restore`** schreibt an der liste vorbei, weil ein gespeicherter wert autoritativ ist. damit überlebt aber auch ein wert, den die liste inzwischen nicht mehr kennt. alternative: beim hydrieren verwerfen und den default behalten.
