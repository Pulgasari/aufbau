# @aufbau/gestures

Pointer-driven gestures for the browser. Built on Pointer Events, so mouse, touch
and pen go through one path. The recognizers and the composer are
framework-agnostic (`core.js`); framework bindings live under `adapters/` and are
imported on their own.

```javascript
import { gestures } from '@aufbau/gestures';

const handle = gestures(el, {
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

| recognizer   | callbacks                                              | notes |
|--------------|--------------------------------------------------------|-------|
| `pressable`  | `onClick` · `onDoubleClick` · `onLongClick`            | double-click defers the single by `doubleWithin` to disambiguate; without it `onClick` is immediate |
| `holdable`   | `onHold(count)`                                        | press-and-repeat: once on press, then every `speed` ms after `delay` |
| `swipeable`  | `onSwipe` · `onSwipe{Up,Down,Left,Right}`              | directional flick past `threshold`; `preventScroll` locks the axis |
| `pannable`   | `onPanStart` · `onPan` · `onPanEnd`                    | single-pointer drag; reports total delta + per-move step |
| `adjustable` | `onAdjust(value, meta)`                                | two-finger resize → one clamped scalar; axis auto/x/y/both; ctrl/cmd + wheel fallback |

See `index.d.ts` for the full option and payload shapes.

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

Ported from the earlier `js/dom/gestures.js` sketch and promoted to a package.
The recognizers above are stable. Still open (see the repo TODO): a real
zoom+pan primitive (`pinchable`/`zoomable` with a focal point), `rotatable`, and
adapters for the other kits (react, svelte).
