# @aufbau/elements2/base

`AufbauElement` is what every element builds on, `AufbauControlElement` what
every element that holds a form value builds on.

## AufbauElement

```js
import { AufbauElement } from '@aufbau/elements2/base/AufbauElement.js';

class MyThing extends AufbauElement {
  static shadow  = true;                       // or { delegatesFocus: true }
  static attr    = { label: String, size: { type: Number, default: 2 } };
  static reflect = ['size'];                   // resolved value written back onto the host
  static styles  = `:host { display: block; }`;

  render () { return html`<span part="label"></span>`; }   // rebuilt only when it changes
  sync   () { this.part('label').textContent = this.getAttr('label'); }   // every update
}

MyThing.init();   // <my-thing>
```

| what | |
|---|---|
| `static attr` | the attribute schema: a type, `{ type, default, values, fn, config, var }` or a default value |
| `static shadow` | a shadow root of its own |
| `static styles` | css, adopted once per tree into the layer `aufbau.elements` |
| `static reflect` | attributes whose resolved value goes back onto the host |
| `static internals` | ElementInternals up front, an object sets defaults such as `{ role: 'img' }` |
| `static skeleton` | the shape of the loading placeholder |
| `static source` | the children are input (markdown, code), the output is rendered next to them |

### lifecycle

the native callbacks do the base's work and then call a hook of the same name:

| hook | |
|---|---|
| `onConnected()` | in the document, after styles and listeners are set up |
| `onDisconnected()` | out of the document, listeners are already removed |
| `onAttributeChanged(name, old, new)` | an attribute of the schema changed, `update()` follows |
| `onAdopted(oldDocument, newDocument)` | moved into another document |
| `onConnectedMove()` | moved with `moveBefore()`. by default disconnected and connected again, override it to keep the state |

`render()` · `sync()` · `onRender()` (after a rebuild) · `onSourceChange()` · `update()` · `invalidate()`

### attributes

```js
this.getAttr('size')        // typed, default and config included
this.getAttr()              // all of them: const { label, size } = this.getAttr()
this.setAttr({ open: true, label: false })   // false removes
```

### tree

```js
this.$('button')            // first match: shadow root first, then the light children
this.$$('button')           // all matches of both
this.part('close')          // the element of the own tree with that part
this.parts('option')        // all of them
this.partOf(event.target)   // the part tokens of the node or its nearest ancestor: ['close']
this.root                   // the shadow root, or the element itself
this.focused                // the focused element inside
```

### events

```js
this.on('click', handler)                          // the element
this.on('click', '[part~="close"]', handler)       // delegated, in both trees: (event, matched)
this.on(window, 'resize', handler)                 // anything else
this.emit('change', { value })                     // a bubbling CustomEvent
this.track(stop)                                   // run on disconnect
```

Every listener is removed on disconnect.

### more

```js
this.states.toggle('open', true)                   // :state(open)
this.setVars({ '--embed-ratio': '16 / 9', '--embed-height': null })   // null removes
this.setVar('item-size', '200px')                  // --aufbau-item-size
this.setSkeleton(true)
this.getConfig('theme', 'github')                  // attribute, then setConfig(), then fallback
```

## AufbauControlElement

An `AufbauElement` that is a form control: FormData, validity, `form.reset()`,
`disabled` from a fieldset, `persist` to local or session storage.

```js
this.value                  // parseValue() of the value attribute
this.commit(next)           // the one way to change the value: attribute, form state, input + change
this.formValue              // what the form submits, null for nothing
this.validate()             // extend for own checks
this.focusTarget            // what focus() and the label point at
this.isDisabled             // own attribute or a disabled fieldset
```

hooks after the default handling: `onFormAssociated(form)` · `onFormDisabled(disabled)` ·
`onFormReset()` · `onFormStateRestore(state, mode)`

`persist`, `persist="session"`, `persist="theme"`, `persist="session:theme"`:
the value is kept under the name, the id or the given key.
