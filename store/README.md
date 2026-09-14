# @aufbau/store

a reactive, typed, multi-key store. built for state that is many keys of different types at once.

## the shape

- **bare access is the value** (`store.dark` is a real boolean), assignment
  writes it (`store.dark = true`). no `.value`, no wrapper.
- **everything else is a string-keyed verb** on the store: `store.toggle('dark')`,
  `store.toNode('title')`, `store.reset('zoom')`.
- verb names are **reserved** and can't be used as keys — the store throws on
  collision (same as `define`).

```javascript
import { store } from '@aufbau/store';

const ui = store({
  dark  : false,                                     // inferred bool
  view  : { type: 'enum', values: ['grid', 'list'] },// enum, init = first item
  zoom  : { value: 100, min: 50, max: 200 },         // number with bounds
  title : 'My App',
  tags  : { type: 'list', value: [] },
  full  : s => `${s.title} (${s.view})`,             // derived, read-only
}, {
  key     : 'app:ui',
  persist  : localStorage,   // or 'local' | 'session' | 'memory' | 'none' | { get, set }
});

ui.dark                 // false          read (bare)
ui.dark = true          // write
ui.get('view')          // 'grid'         read (verb form)
ui.set('zoom', 150)     // write (verb form)
```

## verbs

value: `get(k)` · `set(k, v)` · `reset(k?)` (omit key to reset all)

typed methods (on the matching type):

| type | methods |
|---|---|
| bool | `toggle(k)` `on(k)` `off(k)` |
| enum | `cycle(k)` `options(k)` |
| number | `inc(k, n?)` `dec(k, n?)` `clamp(k)` `round(k, places?)` |
| string | `toKebab(k)` `toSlug(k)` `toUpper(k)` `toLower(k)` `trim(k)` |
| list | `push(k, x)` `remove(k, x)` `toggle(k, x)` `clear(k)` `has(k, x)` |

reactive projections: `onChange(k, fn)` (returns an off()) · `toNode(k)`
(reactive text node) · `toElement(k)` (an `@aufbau/gui` control, two-way bound —
needs `@aufbau/store/gui`) · `sync(k, binding, target?)` (**provisional**, see below)

lifecycle / introspection: `define(k, spec)` · `delete(k)` · `leaf(k)` (raw
carrier) · `keys` · `snapshot()` · `ready` (hydration promise)

## types

inference covers the obvious literals: `false` → bool, `'x'` → string, `7` →
number, `[]` → list, `s => …` → derived. use a config object where inference
can't reach:

```javascript
view : { type: 'enum', value: 'grid', values: ['grid', 'list'] }
view : { type: 'enum', values: ['grid', 'list'] }   // shorthand, init = 'grid'
data : { value: { any: 'object' } }                 // a plain object value -> ref
```

a plain object in the schema is always config; wrap a real object value in
`{ value }` to store it (as a `ref`, held by identity).

## persistence

per-key granular: each leaf persists under `${key}:${leaf}`, so a write touches
only the changed key and hydration is independent per leaf. the seed is never
written before a change (a stored value always wins over the code default).

`persist` takes a native `Storage`, a name (`'local'`/`'session'`/`'memory'`/
`'none'`), or any `{ get, set, subscribe? }` — no imported store helper. `get`
may return a promise; `await store.ready` resolves after hydration.

## reactive core

`@aufbau/store/reactive` is a small home-grown push-pull core (`signal`,
`computed`, `effect`, `batch`, `untracked`): signals push invalidation, computeds
recompute lazily on read, effects re-run with cleanup. no external engine.

## sync (provisional)

`store.sync(k, '--dark')` binds a key to a custom property on the root element
(`'attr:name'` / `'data:name'` / `'class:name'` also work; pass a target as the
third arg). this is a placeholder — a fuller sync design is coming and may change.

## offline

no network, no runtime dependency; the reactive core is self-contained and the
gui binding is opt-in. suited for offline use in the capacitor apps.
