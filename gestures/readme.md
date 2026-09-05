# @aufbau/gestures

Pointer-driven gestures for the browser. Built on Pointer Events, so mouse, touch
and pen go through one path. The recognizers and the composer are
framework-agnostic (`core.js`); framework bindings live under `adapters/` and are
imported on their own.

```javascript
import { compose } from '@aufbau/gestures';

const handle = compose(el, {
  onDoubleClick : () => zoom(),
  onSwipeLeft   : () => next(),
  onAdjust      : size => card.style.setProperty('--size', size + 'px'),
});
// later
handle.destroy();
```

```javascript
import api from '@aufbau/gestures';

const handle = api.compose(el, {
  onDoubleClick : () => zoom(),
  onSwipeLeft   : () => next(),
  onAdjust      : size => card.style.setProperty('--size', size + 'px'),
});
// later
handle.destroy();
```

## Model

Every recognizer is a **factory** that returns a part — it binds nothing itself:

```
{ handlers, style?, touchAction?, destroy?, set? }
```

- `handlers` — native event name → listener
- `style` — inline styles the recognizer needs (e.g. disabling text selection)
- `touchAction` — the `touch-action` it requires
- `destroy` — tear-down
- `set` — imperative value setter (only `adjustable`)

`gestures(element, options)` binds every recognizer whose callbacks are present,
merges their handlers per event type, applies their styles, and resolves
`touch-action` to the **most restrictive** of the parts (so combining a pan with
an adjust never re-enables native scrolling under the drag). Shared option names
can be scoped per recognizer:

```javascript
gestures(el, { onClick, onSwipe, pressable: { threshold: 700 } });
```

## Recognizers

| recognizer      | callbacks                                              | notes |
|-----------------|--------------------------------------------------------|-------|
| `pressable`     | `onClick` · `onDoubleClick` · `onLongClick`            | double-click defers the single by `doubleWithin` to disambiguate; without it `onClick` is immediate |
| `holdable`      | `onHold(count)`                                        | press-and-repeat: once on press, then every `speed` ms after `delay` |
| `swipeable`     | `onSwipe` · `onSwipe{Up,Down,Left,Right}`              | directional flick past `threshold`; `preventScroll` locks the axis |
| `pannable`      | `onPanStart` · `onPan` · `onPanEnd`                    | single-pointer drag; reports total delta + per-move step |
| `pinchable`     | `onPinchStart` · `onPinch` · `onPinchEnd`              | two-finger scale factor (start = 1) + focal point |
| `rotatable`     | `onRotateStart` · `onRotate` · `onRotateEnd`          | two-finger rotation in degrees, accumulated + focal point |
| `wheelable`     | `onWheel({ deltaX, deltaY })`                         | wheel normalized to pixels across `deltaMode`; optional `modifier` |
| `adjustable`    | `onAdjust(value, meta)`                                | two-finger resize → one clamped scalar; axis auto/x/y/both; ctrl/cmd + wheel fallback |
| `transformable` | `onTransformStart` · `onTransform` · `onTransformEnd` | free move + scale + rotate (1–2 pointers) + wheel zoom — see below |

See `index.d.ts` for the full option and payload shapes.

### transformable — the flagship

Free manipulation of an object: one pointer pans, two pointers pan + scale +
rotate around the finger midpoint, and the wheel zooms toward the cursor. It
accumulates a 2D matrix (composed from the frame-to-frame similarity transform)
and every callback gets both the decomposed values and the raw matrix:

```javascript
gestures(el, {
  onTransform ({ x, y, scale, rotation, matrix }) {
    el.style.transform = `matrix(${matrix.join(',')})`;   // element needs transform-origin: 0 0
  },
});
```

Toggle parts with `pan` / `zoom` / `rotate` (all default on), bound the zoom with
`minScale` / `maxScale`, and tune the wheel with `wheelIntensity` /
`wheelModifier`. `set({ x, y, scale, rotation })` and `get()` drive the transform
imperatively. Rotation is reported in **degrees**; scaling and rotation are always
focal-correct, so the point under the fingers/cursor stays put.

For a viewport-style pan+zoom without rotation, pass `rotate: false`. The atomic
`pinchable` / `rotatable` / `pannable` / `wheelable` recognizers are there when you
want to wire the pieces up yourself instead.

## Adapters

### preact — `@aufbau/gestures/preact`

```javascript
import { useGesture } from '@aufbau/gestures/preact';

const ref = useGesture({ onDoubleClick, onSwipeLeft, onAdjust });
return html`<div ref=${ref} />`;
```

Callbacks are read live through a ref, so inline arrows are fine and nothing
rebinds on re-render. Scalar options and *which* recognizers are active are read
once at attach time — remount via `key` to change them.

## Status

Ported from the earlier `js/dom/gestures.js` sketch and promoted to a package,
then extended with the multi-touch set (`pinchable`, `rotatable`, `wheelable`)
and the `transformable` flagship. Still open: adapters for the other kits (react,
svelte), and a keyboard/a11y layer for the transform gestures.
