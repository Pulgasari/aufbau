# @aufbau/gestures — concept

a working draft. it is meant to change while we build, try and review it.
decisions below are marked **open** where they are not settled yet.

## goal

a gesture should be as easy to use on an element as a click:

```js
gestures(element, {
  onTap        : gesture => select(gesture.target),
  onSwipeLeft  : gesture => next(),
  onSwipeRight : { minimumSpeed: 1, handler: gesture => previous() },
});

element.addEventListener('swipeleft', event => next());   // the same, as a dom event
```

better:

```js
import gestures from '@aufbau/gestures';

//
gestures.apply (element, {
  onTap        : gesture => select(gesture.target),
  onSwipeLeft  : gesture => next(),
  onSwipeRight : { minimumSpeed: 1, handler: gesture => previous() },
});

//
const applyGestures = gestures.apply ({
  onTap        : gesture => select (gesture.target),
  onSwipeLeft  : gesture => next(),
  onSwipeRight : { minimumSpeed: 1, handler: gesture => previous() },
});

applyGestures(element1);
applyGestures(element2, element3, ...);
```

### on the element prototype

💀💀💀 don't do that! it's super evil and dangerous!!! 💀💀💀

```js
// prototype :: variante 1
import '@aufbau/gestures/prototype/addGestureListener.js';

element.addGestureListener('swipeleft', event => next());
```

```js
// prototype :: variante 2
import '@aufbau/gestures/prototype/onGesture.js';
import '@aufbau/gestures/prototype/onGestures.js';

element.onGesture('swipeleft', event => next());
element.onGestures({
  tap        : gesture => select (gesture.target),
  swipeleft  : gesture => next(),
  swiperight : { minimumSpeed: 1, handler: gesture => previous() },
});
// they work all: swipeleft, swipeLeft, onswipeleft, onSwipeleft, oNsWiPeLefT
```

```js
//
element.addEventListener('swipeleft', event => next());   // the same, as a dom event
```

## layers

1. **tracker** measures. one per element, one session from the first pointer
   down to the last pointer up. it knows where, how far, how fast, how long,
   with what and with how many pointers. it decides nothing.
2. **recognizers** decide. each one is a small state machine over the session
   and turns it into named gestures: tap, long press, swipe, pan …
3. **bundles** act. recipes that turn recognized gestures into an effect on the
   dom: `transformable`, `draggable`, `dismissable`, `sortable`, `pullable`.

recognizers report *what happened*, bundles decide *what it does*.

## the session

one object per session, the recognizers read it and every gesture event
carries a snapshot of it as `detail`. the names are spelled out.

| field         | meaning                                                          |
|---------------|------------------------------------------------------------------|
| `movement`    | `center`'s change since the previous event, `{ x, y }`, for incremental updates |
| `angle`       | direction of `delta` in degrees, 0 is right, 90 is down          |
| `buttons`     | the pressed mouse buttons                                        |
| `center`      | the midpoint of all pointers, `{ x, y }` in client pixels        |
| `coalesced`   | the points the browser merged into the event, `{ x, y, time, pressure }[]`, with `coalesced: true` only |
| `delta`       | `center` minus its start, `{ x, y }`, stays continuous when fingers come and go |
| `direction`   | the dominant axis of `delta`: `left`, `right`, `up`, `down`, or `null` |
| `distance`    | length of `delta`                                                |
| `duration`    | milliseconds since the session started                          |
| `element`     | the element `gestures()` was bound to                            |
| `input`       | `mouse`, `pen`, `touch`, and `trackpad` or `wheel` for the sources without pointers |
| `maximumPointers` | the most pointers that were down at once                      |
| `modifiers`   | `{ alt, control, meta, shift }`                                  |
| `path`        | `composedPath()` of the first event, into shadow roots as well   |
| `phase`       | `start`, `move`, `end` or `cancel`                               |
| `pointerId`   | the pointer behind this event                                    |
| `pointers`    | the pointers down right now                                      |
| `positions`   | each pointer down right now, `{ id, x, y }[]`                    |
| `pressure`    | the pressure of that pointer, 0 to 1                             |
| `sourceEvent` | the native event that produced this state                        |
| `time`        | its timestamp                                                    |
| `rotation`    | degrees the first two pointers turned since two were down        |
| `scale`       | their spread relative to the moment two were down                |
| `start`       | where `center` started, `{ x, y }`                               |
| `target`      | the element the first pointer went down on                       |
| `tilt`        | the tilt of a pen in degrees, `{ x, y }`                         |
| `travel`      | the farthest `distance` got during the session                   |
| `twist`       | the rotation of a pen around its own axis, in degrees            |
| `velocity`    | `{ x, y, speed }` in pixels per millisecond, over the last 100 ms |

`travel` is what tells a tap from a movement: a finger that went away and came
back has a small `distance` but a large `travel`.

## gestures

discrete gestures fire once, continuous ones have `Start`, `Move`, `End`,
`Cancel`. a handler is `on` + the gesture name, the dom event is the same name
in lowercase.

| gesture       | handlers                                                   | dom events |
|---------------|------------------------------------------------------------|------------|
| `press`       | `onPressStart`, `onPressEnd`, `onPressCancel`              | `pressstart`, … |
| `tap`         | `onTap`                                                    | `tap` |
| `doubleTap`   | `onDoubleTap`                                              | `doubletap` |
| `twoFingerTap`| `onTwoFingerTap`                                           | `twofingertap` |
| `doubleTapDrag` | `onDoubleTapDragStart`, `…Move`, `…End`, `…Cancel`       | `doubletapdragstart`, … |
| `longPress`   | `onLongPress`                                              | `longpress` |
| `secondary`   | `onSecondary`                                              | `secondary` |
| `swipe`       | `onSwipe`, `onSwipeDown`, `onSwipeLeft`, `onSwipeRight`, `onSwipeUp` | `swipe`, `swipedown`, … |
| `pan`         | `onPanStart`, `onPanMove`, `onPanEnd`, `onPanCancel`       | `panstart`, `panmove`, … |
| `pinch`       | `onPinchStart`, `onPinchMove`, `onPinchEnd`, `onPinchCancel` | `pinchstart`, … |
| `rotate`      | `onRotateStart`, `onRotateMove`, `onRotateEnd`, `onRotateCancel` | `rotatestart`, … |
| `pressRepeat` | `onPressRepeat`                                            | `pressrepeat` |
| `wheel`       | `onWheelStart`, `onWheelMove`, `onWheelEnd`                | `wheelstart`, … |
| `edgeSwipe`   | `onEdgeSwipeStart`, `onEdgeSwipeMove`, `onEdgeSwipeEnd`, `onEdgeSwipeCancel` | `edgeswipestart`, … |

`edgeSwipe` needs the first pointer within `size` px of one of its `edges` and a
movement away from it, then it claims the session before `pan` or `swipe` see
it (recognizers carry a `priority`). it reports the `edge` and a `progress`
from 0 to 1 across the element.

`doubleTapDrag` is a tap followed by a second press at the same spot that drags:
the one-handed zoom of maps and photo viewers. like `edgeSwipe` it claims the
session before `pan` sees it. while the second press is armed its touchmove is
refused, `touch-action` can not depend on an earlier tap.

`pinch` carries `scaleChange` (ratio to the previous event), `rotate`
`rotationChange` (degrees since the previous event): an incremental transform
multiplies and adds those. only `Move` carries a change, `Start` and `End` are
neutral: the jump up to the threshold arrives as a `Move` right after `Start`,
so a handler on `Move` alone misses nothing. `wheel` is continuous and ends after a pause, so its
events can not be mistaken for the native `wheel`.

planned: more bundles, see below.

### native signals first

where the platform already carries the meaning, it is the source:

- `secondary` comes from the native `contextmenu`: right click, long press on
  touch where the platform fires one, the menu key, shift+f10. keyboard and
  accessibility come for free. the native menu is prevented while a handler
  listens.
- keyboard activation stays `click`. `tap` is the pointer gesture only.
- a trackpad sends no pointers. its pinch arrives as `wheel` with `ctrlKey`
  (chrome, firefox) or as `gesture*` events (safari), its rotation only as
  safari's `gesture*`. trackpad.js turns both into a session with input
  `trackpad` and two pointers, so `pinch` and `rotate` treat it like fingers.
  a mouse wheel with ctrl held also reads as a pinch, on purpose: it is the
  convention the browser itself uses for page zoom.

## arbitration

several recognizers look at the same session. the rules so far:

- a recognizer that owns the session **claims** it: `pan`, `pinch`, `rotate`
  once they started, `longPress` once it fired. a second pointer stops a
  pending long press and a press repeat.
- `tap` fails when anything claimed the session, when `travel` exceeds the
  tolerance or when it took longer than `maximumDuration`.
- `pan` holds its pointer count: a second finger on a one finger pan ends it
  (`panEnd`), lifting it again starts a new one. a pinch in between owns the
  movement meanwhile.
- `swipe` is evaluated on release from the same data as `pan`, the two coexist.
  it fails when `longPress` claimed the session.
- where `doubleTap` is listened to, a single tap waits `interval` ms and fires
  only if no second one came, a pair fires `doubleTap` alone. where it is not,
  nothing waits. `waitForDoubleTap: false` (both at once) or a shorter wait in ms.
- a session with two pointers that would otherwise be a tap is a `twoFingerTap`;
  `tap` only counts sessions with one pointer.
- `press` decides nothing and claims nothing: `pressStart` on contact,
  `pressEnd` on release. it is the immediate feedback, like `:active` for
  every input.
- a `pointercancel` (the browser took the pointer, e.g. to scroll) cancels the
  whole session. so do a lost focus, a hidden page and a primary press while a
  session of the same input still runs (its pointerup got lost).
- **across elements** a pointer belongs to the first session that claims it.
  nested `gestures()` see the same pointer, the inner element hears it first and
  wins; any other session on that pointer is cancelled. `yield: true` makes an
  element step back instead.
- a recognizer can be switched off or asked per session: `handle.enable('pan',
  gesture => …)`. a disabled recognizer claims nothing.

the swipe direction is the one of `velocity` at release: a drag to the left that
ends in a flick to the right is a swipe to the right. `distance` still has to
pass `minimumDistance`.

**open**: a native drag (a selection, an image) takes the pointer and cancels
the session. recognizers that follow movement (`swipe`, `pan`) turn it off and
disable text selection, a pure `tap` leaves both alone.

long press and native `contextmenu` on touch: where `secondary` listens, the
platform wins. a long press on touch and pen waits `grace` ms longer and steps
back when a contextmenu claimed the session meanwhile. where it does not listen,
the long press prevents the native menu.

## tolerances

movement below the tolerance does not count as moving. it depends on the input:
`mouse` 4, `pen` 8, `touch` 10 pixels. every recognizer takes `tolerance` as a
number or as `{ mouse, pen, touch }`.

## thresholds versus guards

- **thresholds** are recognizer options and change *what is recognized*:
  `gestures(element, { swipe: { minimumDistance: 80 } })`. they matter for
  arbitration, a filter in the handler would come too late.
- **guards** sit on a handler and only filter what reaches it:
  `onSwipeLeft: { minimumSpeed: 1, pointers: 2, input: 'touch', handler }`.
- the handler gets the session snapshot, so anything else is a plain `if`.

## activation and touch-action

`touch-action` has to be set before the pointer goes down, so the active
recognizers are known up front: from the handlers given, plus the names in
`recognize` for listeners added with `addEventListener`:

```js
gestures(list, { recognize: ['swipe'] });
list.addEventListener('swipeleft', event => remove(event.target));
```

each recognizer asks for a `touch-action`, the strictest one wins, `destroy()`
restores the previous value.

## events and delegation

gesture events are dispatched on the element the first pointer went down on,
they bubble. one `gestures()` on a list serves all of its items, `target` tells
them apart. handlers given to `gestures()` only receive the gestures of their own
element, not the ones bubbling up from a nested `gestures()`.

events are composed, they leave shadow roots. no prefix: the platform has no
`tap`, `swipe` or `pinch` events announced, `press…` and `wheel…` are unique by
their endings. a prefix pays off only once one of them shows up in a spec.

code that only knows event types uses the adapter `@aufbau/gestures/events`:
`listen(element, 'swipeleft', fn)` turns the recognizer on for that element,
shared by all listeners there, off with the last one.

## bundles

| bundle          | does | keyboard |
|-----------------|------|----------|
| `transformable` | one finger moves, two pinch and turn around their center, wheel or trackpad pinch zooms toward the cursor, double tap zooms in and back. taken on a `surface` (the parent), applied as `matrix()` | arrows, + −, [ ], 0 |
| `draggable`     | follows the pointer with `translate`, `axis`, `bounds`, glides on after a flick, `grid` and `snap` on release, `drop` targets with data-drop-over, `revert` | arrows (shift: more) |
| `dismissable`   | follows along an axis and fades, leaves when far or fast enough, snaps back otherwise, resistance for directions it may not go | delete, backspace |
| `sortable`      | reorders the items of a list or grid: touch and pen lift an item by a long press (a plain drag still scrolls), the mouse drags at once; the dom order changes while dragging, the others slide into place; `group` across lists, auto scroll near the edges, the new position announced through a live region | alt + arrows |
| `pullable`      | pull to refresh on a scroll container: at the top the content follows a pull down with resistance, past `threshold` it holds while `onRefresh` runs | a refresh button |
| `resizable`     | edges and corners resize, `aspectRatio`, `grid`, limits; a pointer anywhere else is not claimed (`enable('pan', predicate)`) | shift + arrows |

`pan` got `after: 'longPress'` for that (per input, `{ touch: 'longPress' }`) and
`touchAction` to set it outright. a drag after a long press, and a pull at the
top, refuse the touchmove's default, otherwise the browser would scroll and
cancel the session.

bundles compute and read in the event, and write once per animation frame
(`frame()` in motion.js): a layout read right after a style write would force a
layout on every pointer event.

a bundle returns `{ get, set, reset, destroy }` (or `dismiss`) and reports
through callbacks (`onChange`, `onDrop`, `onDismiss` …). **open**: whether
bundles should dispatch dom events as well, `draggable` could not use the
native `drag*` names.

keyboard counterparts live in the bundles: a recognizer is a pointer gesture,
what it does is what the keyboard can do too.

## state

built: tracker with pointer ownership across elements, trackpad, `press`,
`pressRepeat`, `tap`, `doubleTap`, `twoFingerTap`, `doubleTapDrag`, `longPress`,
`secondary`, `swipe`, `edgeSwipe`, `pan`, `pinch`, `rotate`, `wheel`, pen data,
the bundles `transformable`, `draggable`, `dismissable`, `sortable`, `pullable`,
`resizable`, `adjustable`, handler guards, dom events with delegation, runtime
control (`on`, `set`, `enable`, `recognize`), the events adapter, `debug` and
`simulate`, touch-action resolution, cleanup.

next candidates: a pan with inertia as a recognizer option, and trying all of
it on real devices (`debug` is made for that).

## to try out

`www/gestures.html` in this repo, e.g.
https://code.pulgasari.dev/aufbau/www/gestures.html
