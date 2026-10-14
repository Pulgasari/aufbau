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
`positions`, `input`, `pressure`, `tilt`, `twist`, … the full list is in
[concept.md](concept.md).

## gestures

| gesture     | handlers |
|-------------|----------|
| tap         | `onTap`, `onDoubleTap`, `onTwoFingerTap` |
| double tap drag | `onDoubleTapDragStart`, `…Move`, `…End`, `…Cancel` (tap, press again, drag: one-handed zoom) |
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

where `onDoubleTap` listens, a single tap waits until no second one can follow,
so the two exclude each other (`tap: { waitForDoubleTap: false }` fires both at
once). a swipe takes the direction of the velocity at release.

thresholds go to the recognizer, guards to the handler:

```javascript
gestures(element, {
  swipe       : { minimumDistance: 80 },                                       // what counts as a swipe
  onSwipeLeft : { input: 'touch', pointers: 2, handler: gesture => back() },   // what reaches this handler
});
```

## at runtime

```javascript
const handle = gestures(element, { onTap: select });

const off = handle.on('doubleTap', zoom);          // touch-action follows
handle.set({ swipe: { minimumDistance: 80 } });    // rebuilt after the running session
handle.enable('pan', false);                       // or a predicate asked at each session start:
handle.enable('pan', gesture => onEdge(gesture.start));
handle.recognize('swipe');                         // for listeners added with addEventListener
```

## nested elements

a pointer belongs to one session across elements: the first one that claims it
(a pan, a pinch, a long press …) keeps it, a later claim on the same pointer
steps back. nested elements hear the pointer first, so a swipeable item inside a
sortable list wins over the list. `yield: true` turns that around for one
element: it gives the pointer up when another element claims it, even after
claiming it first.

a session that loses its pointerup (released over an iframe, an alert, a window
switch) ends on blur, when the page is hidden, or with the next press.

## events adapter

for code that only knows event types (a template binding `onSwipeLeft`,
`Selection.on('swipeleft')`, a framework's event props):

```javascript
import { isGestureEvent, listen, configure } from '@aufbau/gestures/events';

const off = listen(node, 'swipeleft', event => next());   // the recognizer turns on for node
configure(node, { swipe: { minimumDistance: 80 } });
off();                                                     // and off with the last listener
```

## bundles

| bundle          | does |
|-----------------|------|
| `adjustable`    | one number by pinching (the item size of a grid), trackpad pinch and ctrl + wheel too, one finger still scrolls |
| `dismissable`   | follows along an axis and leaves when far or fast enough, snaps back otherwise |
| `draggable`     | follows the pointer, `axis`, `bounds` with `rubberband`, inertia, `grid` and `snap`, `drop` targets |
| `pullable`      | pull to refresh on a scroll container |
| `resizable`     | resize by edges and corners, `aspectRatio`, `grid`, limits; the content keeps every other pointer |
| `sortable`      | reorders a list or grid, the others slide into place, `group` across lists, auto scroll, announced |
| `transformable` | move, pinch, turn, wheel-zoom and double-tap-drag-zoom an element around the fingers |

```javascript
import { adjustable, transformable } from '@aufbau/gestures';

const size = adjustable(grid, { value: 120, minimum: 56, maximum: 240, onChange: value => grid.style.setProperty('--size', value + 'px') });
const view = transformable(image, { maximumScale: 6 });
```

each one has a keyboard counterpart where it makes sense, see the header of
its file. bundles write once per animation frame and read layout before they
write, never right after.

## tools

```javascript
import debug    from '@aufbau/gestures/debug';      // overlay: pointers, center, velocity, claims, last gestures
import simulate from '@aufbau/gestures/simulate';   // synthetic pointer paths: tap, swipe, pinch, doubleTapDrag …

const stop = debug(handle);
await simulate.swipe(list, { direction: 'left' });
await simulate.pinch(image, { scale: 2 });
```

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
