# @aufbau/element 3 — concept

a working draft for the next major version. it comes out of the comparison with
lit (`pulgasari.github.io/md/analyze/lit-vs-aufbau.md`, section 16 and the
review notes there). decisions are marked **open** where they are not settled.

what stays as it is: attributes as the source of truth, the schema, config,
skins, cascade layers, `Selection`, `withControl`, `withSource`, `init()`, the
autoloader. what changes is how values arrive, when an element updates and how
it renders.

| | 2.x | 3 |
|---|---|---|
| data that is no string | hand-written setters | properties from the schema |
| an attribute changes | `update()` at once | one update per microtask, with the changed names |
| reading a value | `getAttr()` resolves on every call | resolved once per update |
| `render()` | a string, `innerHTML` when it changed | a template result, only the holes are written (`@domina/render`) |
| an exception in `render()` | the element is left half updated | `:state(error)`, `onError()` |
| documentation | by hand | `custom-elements.json` from the schema |

## 1. properties from the schema

```js
static attr = {
  pressed : Boolean,                       // el.pressed <-> [pressed], generated
  size    : { type: Number, default: 2 },  // el.size <-> [size], read through getAttr
  nodes   : { type: Array, prop: true },   // el.nodes: a stored value, no attribute
  hover   : { state: true },               // internal: no attribute, no public accessor
};
```

| entry | accessor | stored in | updates on change |
|---|---|---|---|
| attribute type (`String`, `Number`, `Boolean`, values) | get: `getAttr(name)`, set: writes the attribute (`toggleAttribute` for booleans) | the attribute | yes, through `attributeChangedCallback` |
| `prop: true` or type `Object` / `Array` / `Function` | get and set a stored value | the instance | yes, with `hasChanged` (default `!==`) |
| `state: true` | none public, `this.setState(name, value)` / `getAttr(name)` | the instance | yes |

`init()` defines the accessors on the prototype, as it does for the `$part`
getters today. a name the class already has (a hand-written accessor, a method)
or the platform has (`title`, `hidden` …) keeps its own. a value on the instance
(set before the element was defined, or a class field) would hide the accessor:
on the first connect it is handed to the accessor instead.

the 16 hand-written setters in `@aufbau/elements` become schema entries.

## 2. one update per microtask

```js
el.setAttribute('a', 1);   // marks a
el.setAttribute('b', 2);   // marks b
el.size = 3;               // marks size
                           // one microtask later: one update with { a, b, size }
await el.updateComplete;
```

`attributeChangedCallback`, property setters and config changes call
`requestUpdate(name)`; the update runs once per microtask. `flush()` runs a
pending update at once, for code that reads the dom right after a change.

decided: on by default, `static batch = false` updates at once per class, and
`flush()` runs a pending update where code reads the dom right after a change.

## 3. changed names in the hooks

```js
willUpdate (changed) { if (changed.has('src')) this.load(); }   // before render, derive values
render     ()        { return html`…`; }
sync       (changed) { if (changed.has('label')) this.$label.text(this.label); }
onRender   (changed) { … }                                      // after every render
onFirstRender ()     { … }                                      // once, after the first render
```

`changed` is a `Set` of the names (camelCase) that changed since the last
update; the first update contains every name of the schema. `sync()` keeps its
place for imperative work (canvas, foreign libraries) but no longer has to set
everything every time.

## 4. getAttr once per update

the resolved value of every name is cached: authored attribute, config,
default, `values`, `fn`, all of it once. the cache entry of a name is dropped by
`attributeChangedCallback` and its setter, the whole cache by a config change.
in a `sync()` that reads ten values, ten lookups become ten map reads.

## 5. rendering with @domina/render

```js
import { AufbauElement, html } from '@aufbau/element';   // html: htx syntax, @domina/render

class TodoItem extends AufbauElement {
  static attr = { done: Boolean, label: String };

  render () {
    return html`
      <label.item class:done=${this.done}>
        <input type="checkbox" checked=${this.done} onChange=${() => this.done = !this.done}>
        ${this.label}
      </label>
    `;
  }
}
```

`update()` hands the result of `render()` to `render(this.renderTarget, result)`.
the first update clones the template, every later one writes only the holes that
changed: focus, selection, input values and listeners inside survive.

- `html` is htx (tag selectors, prop groups, merged `class`, shorthand tags for
  the aufbau elements: `<$icon 'bx:search' />`) rendered by `@domina/render`
  (see `domina/packages/render/concept.md`).
- **migration:** a `render()` that still returns a string takes the 2.x path
  (compare, `innerHTML`). both work side by side, element by element.
- `elements/lib/html.js` (the string tag with escaping) goes away once no
  element returns a string; escaping is no longer needed, values are never parsed.
- `Selection`, delegated events, `part()` and `$name` stay. with stable nodes
  `invalidate()` loses most of its use.

## 6. errors

`update()` catches what `willUpdate()`, `render()` and `sync()` throw, logs it
with the tag name, sets `:state(error)` and calls `onError(error)`. the next
successful update removes the state. a broken element looks broken instead of
stopping the page, and the exception does not land in the code that only set an
attribute.

## 7. custom-elements.json from the schema

`static attr`, `static parts` and `static reflect` are data, so a manifest needs
no code analysis. two declarations are added for what the schema can not know:

```js
static events = { change: 'the value changed', open: 'the panel opened' };
static slots  = { '': 'the content', icon: 'an icon before the label' };
```

a script (`element/manifest.js`, run in node or deno) imports the elements,
reads their schemas and writes `custom-elements.json`: editor support (vs code
custom data, jetbrains), docs pages, storybook controls.

## later

- **controllers** (behavior with a lifecycle, attached instead of inherited):
  to be designed separately, together with the question which of today's mixins
  stay mixins. `withControl` most likely stays one: `formAssociated` and the form
  callbacks have to live on the class itself, a controller can not add them.
- **ssr and hydration**: `render()` stays free of side effects so a server can
  call it later; the rest waits for a need (see the review notes, 2.6).
- the smaller points (16.12 in the comparison): one by one when we get there.

## state

built: 1 to 4 and 6 (properties, batching, changed names, getAttr cache,
errors). the hand-written setters in `@aufbau/elements` are still in place; they
keep working, since `init()` leaves names alone that a class defines itself.

## order

1. properties, changed names, getAttr cache (1, 3, 4): no change in behavior
   for existing elements.
2. batching (2), with `flush()` where elements need it.
3. `@domina/render` and `program()` in htx, then rendering (5), migrated element
   by element.
4. errors (6), manifest (7).
