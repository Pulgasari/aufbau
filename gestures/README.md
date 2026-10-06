# @aufbau/gestures

a gesture as easy to use as a click. pointer events, so mouse, touch and pen
go one way, a trackpad pinch and rotation too.

```javascript
import gestures from '@aufbau/gestures';

const handle = gestures(element, {
  onTap        : gesture => select(gesture.target),
  onSwipeLeft  : gesture => next(),
  onSwipeRight : { minimumSpeed: 1, handler: gesture => previous() },
});

element.addEventListener('swipeleft', event => next());   // the same, as a dom event
handle.destroy();
```

## layers

1. the **tracker** measures one session per element, from the first pointer
   down to the last one up: where, how far, how fast, with how many pointers
2. **recognizers** decide: they turn the session into named gestures
3. **bundles** act: recipes that turn gestures into an effect on the dom

every handler and every dom event gets the session as a snapshot: `center`,
`delta`, `distance`, `direction`, `velocity`, `scale`, `rotation`, `pointers`,
`input`, … the full list is in [concept.md](concept.md).

## gestures

| gesture     | handlers |
|-------------|----------|
| tap         | `onTap`, `onDoubleTap` |
| press       | `onPressStart`, `onPressEnd`, `onPressCancel`, `onPressRepeat` |
| long press  | `onLongPress` |
| secondary   | `onSecondary` (right click, long press, menu key: the native `contextmenu`) |
| swipe       | `onSwipe`, `onSwipeLeft`, `onSwipeRight`, `onSwipeUp`, `onSwipeDown` |
| edge swipe  | `onEdgeSwipeStart`, `…Move`, `…End`, `…Cancel` |
| pan         | `onPanStart`, `onPanMove`, `onPanEnd`, `onPanCancel` |
| pinch       | `onPinchStart`, `onPinchMove`, `onPinchEnd`, `onPinchCancel` |
| rotate      | `onRotateStart`, `onRotateMove`, `onRotateEnd`, `onRotateCancel` |
| wheel       | `onWheelStart`, `onWheelMove`, `onWheelEnd` |

the dom event is the name in lowercase (`swipeleft`, `pinchmove`). it bubbles
from the element the pointer went down on, so one `gestures()` on a list
serves all of its items. for listeners added with `addEventListener` the
recognizer has to be named up front, `touch-action` is decided before the
pointer goes down:

```javascript
gestures(list, { recognize: ['swipe'] });
```

thresholds go to the recognizer, guards to the handler:

```javascript
gestures(element, {
  swipe       : { minimumDistance: 80 },                                       // what counts as a swipe
  onSwipeLeft : { input: 'touch', pointers: 2, handler: gesture => back() },   // what reaches this handler
});
```

## bundles

| bundle          | does |
|-----------------|------|
| `adjustable`    | one number by pinching (the item size of a grid), trackpad pinch and ctrl + wheel too, one finger still scrolls |
| `dismissable`   | follows along an axis and leaves when far or fast enough, snaps back otherwise |
| `draggable`     | follows the pointer, `axis`, `bounds`, inertia, `grid` and `snap`, `drop` targets |
| `pullable`      | pull to refresh on a scroll container |
| `sortable`      | reorders a list or grid, the others slide into place |
| `transformable` | move, pinch, turn and wheel-zoom an element around the fingers |

```javascript
import { adjustable, transformable } from '@aufbau/gestures';

const size = adjustable(grid, { value: 120, minimum: 56, maximum: 240, onChange: value => grid.style.setProperty('--size', value + 'px') });
const view = transformable(image, { maximumScale: 6 });
```

each one has a keyboard counterpart where it makes sense, see the header of
its file.

## preact

```javascript
import { useGesture } from '@aufbau/gestures/preact';

const ref = useGesture({ onSwipeLeft: () => next(), onDoubleTap: () => zoom() });
return html`<div ref=${ref} />`;
```

handlers are read live, inline arrows are fine. which gestures are active is
read when the ref lands, remount via `key` to change it. `ref.handle` is what
`gestures()` returned.

## from 1.x

the earlier version lives in `_/gestures`. its names map like this:

| 1.x                                   | 2.x |
|---------------------------------------|-----|
| `compose(element, options)`           | `gestures(element, options)` |
| `onClick`, `onDoubleClick`, `onLongClick` | `onTap`, `onDoubleTap`, `onLongPress` |
| `onHold(count)`                       | `onPressRepeat` (`gesture.count`) |
| `onPan`, `onPinch`, `onRotate`        | `onPanMove`, `onPinchMove`, `onRotateMove` |
| `onWheel({ deltaY })`                 | `onWheelMove` (`gesture.movement.y`) |
| pan payload `deltaX`, `deltaY`        | `gesture.delta.x`, `gesture.delta.y` |
| `onAdjust` with `value`, `min`, `max` | `adjustable(element, { value, minimum, maximum, onChange })` |
| `onTransform`                         | `transformable(element, { onChange })` |

## to try out

[`www/gestures.html`](../www/gestures.html), the playground.
