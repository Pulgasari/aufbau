# @aufbau/element

the base of the [@aufbau custom elements](../elements2/README.md): attribute schema,
rendering, selections, config and skin. `AufbauElement` is what every element
builds on, two mixins add to it:

| | |
|---|---|
| `withControl` · `AufbauControlElement` | a form control: value, FormData, validity, `persist` |
| `withSource` · `AufbauSourceElement` | the children are input (markdown, code), the result is rendered next to them |

```js
class WriteText extends withSource(withControl(AufbauElement)) {}
```

## AufbauElement

```js
import { AufbauElement } from '@aufbau/element';

class MyThing extends AufbauElement {
  static shadow  = true;                       // or { delegatesFocus: true }
  static attr    = { label: String, size: { type: Number, default: 2 } };
  static reflect = ['size'];                   // resolved value written back onto the host
  static styles  = `:host { display: block; }`;

  static parts   = ['label'];                  // this.$label

  render () { return html`<span part="label"></span>`; }   // rebuilt only when it changes
  sync   () { this.$label.text(this.getAttr('label')); }    // every update
}

MyThing.init();   // <my-thing>
```

| what | |
|---|---|
| `static attr` | the attribute schema: a type, `{ type, default, values, fn, config, var }` or a default value |
| `static shadow` | a shadow root of its own |
| `static styles` | css in the layer `aufbau.elements`, one sheet per class shared by every tree. see [styles](#styles) |
| `static reflect` | attributes whose resolved value goes back onto the host |
| `static internals` | ElementInternals up front, an object sets defaults such as `{ role: 'img' }` |
| `static parts` | part names, each gets a getter: `close-button` is `this.$closeButton` |
| `static skeleton` | the shape of the loading placeholder |

### lifecycle

the native callbacks do the base's work and then call a hook of the same name:

| hook | |
|---|---|
| `onConnected()` | in the document, after styles and listeners are set up |
| `onDisconnected()` | out of the document, listeners are already removed |
| `onAttributeChanged(name, old, new)` | an attribute of the schema changed, `update()` follows |
| `onAdopted(oldDocument, newDocument)` | moved into another document |
| `onConnectedMove()` | moved with `moveBefore()`. by default disconnected and connected again, override it to keep the state |

`render()` · `sync()` · `onRender()` (after a rebuild) · `update()` · `invalidate()`

### attributes

```js
this.getAttr('size')        // typed, default and config included
this.getAttr()              // all of them: const { label, size } = this.getAttr()
this.setAttr({ open: true, label: false })   // false removes
```

### selections

`$`, `$$`, `part`, `parts` and `$close` give a selection, not a node. it has the
same methods as the element, so a child is used the same way as the host:

```js
this.$('button')                    // first match: shadow root first, then the light children
this.$$('li')                       // all matches of both
this.part('close')                  // [part~="close"], parts() for all of them
this.$(window)                      // a node, window or a list of nodes as it is

this.$close.onClick(() => this.close());
this.$$('li').attr({ role: 'option' }).on('click', (event, item) => …);
this.part('list').$$('li');
```

| | |
|---|---|
| `.on(types, handler, options)` | `types` may be `'dragenter dragover'`. the handler gets `(event, node)`, `this` is the element |
| `.on(types, selector, handler)` | the same as `.$$(selector).on(types, handler)` |
| `.onClick(handler)` … | `onBlur` `onChange` `onClick` `onFocus` `onInput` `onKeyDown` `onPointerDown` `onSubmit` |
| `.emit(type, detail)` | a bubbling CustomEvent on each node, false when one was prevented |
| `.attr(name)` · `.attr({ … })` | read the first, write all. false and null remove |
| `.text()` · `.text(value)` | read the first, write all |
| `.focus()` · `.matches(selector)` · `.includes(node)` | |
| `.filter(test)` · `.find(test)` | |
| `.until(signal)` | the same nodes, their listeners also end with this signal |
| `.node` · `.nodes` · `.size` | the native nodes. a selection is iterable: `for (const item of this.$$('li'))` |

a selection made with a selector is live: it is found again whenever it is
used, so it and its listeners survive a render. a selection of a node stays
with that node.

every listener ends when the element disconnects. `this.track(stop)` does the
same for anything else, an observer or a timer.

```js
this.root                           // the shadow root, or the element itself
this.focused                        // the focused element inside
```

### more

```js
this.states.toggle('open', true)                   // :state(open)
this.setVars({ '--embed-ratio': '16 / 9', '--embed-height': null })   // null removes
this.setVar('item-size', '200px')                  // --aufbau-item-size
this.setSkeleton(true)
this.getConfig('theme', 'github')                  // attribute, then setConfig(), then fallback
```

### styles

`static styles` takes a string, an object, an `` ass`` `` result, a function
giving one of them, or a list mixing them:

```js
static styles = `:host { display: flex; }`;

static styles = {
  ':host'                : { display: 'flex', flexDirection: 'column', '--panel-gap': '0.5rem' },
  'header'               : { gap: 'var(--panel-gap)', '&[hidden]': { display: 'none' } },
  '@media (width < 40rem)': { ':host': { flexDirection: 'row' } },
};

static styles = ass`:host { padding: small; }`;   // tokens and mixins of @aufbau/ass

static styles = [BASE, { ':host': { gap: '1rem' } }];
```

in an object a nested object is a rule or an at-rule, anything else a
declaration: camelCase becomes kebab-case, `--custom` stays, an array repeats
the property (`{ display: ['-webkit-box', 'flex'] }`), `null` and `false` leave
it out. `cssOf(styles)` gives the css of any of these.

## withControl · AufbauControlElement

a form control: FormData, validity, `form.reset()`, `disabled` from a fieldset,
`persist` to local or session storage.

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

## withSource · AufbauSourceElement

the author's children are the input, `render()` writes into an output element
next to them. `static output` names its tag, `div` by default.

```js
this.sourceText             // the children as text, the output left out
this.sourceNodes            // the children, the output left out
this.output                 // the element render() writes into
onSourceChange ()           // the children changed, rebuilds by default
```

## config, skin, storage

```js
import { getConfig, onConfigChange, setConfig, setSkin } from '@aufbau/element';

setConfig({ code: { theme: 'nord' } });   // or setConfig('code-theme', 'nord')
getConfig('code-theme');
onConfigChange(event => event.detail.changed);
setSkin('monochrome');                    // 'none' removes it
```

`store` and `session` are the local and session storage that `persist` writes to.
