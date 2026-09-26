# @aufbau/gestures2 — concept

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

## layers

1. **tracker** measures. one per element, one session from the first pointer
   down to the last pointer up. it knows where, how far, how fast, how long,
   with what and with how many pointers. it decides nothing.
2. **recognizers** decide. each one is a small state machine over the session
   and turns it into named gestures: tap, long press, swipe, pan …
3. **bundles** act. recipes that turn recognized gestures into an effect on the
   dom: `transformable`, `draggable`, `dismissable`, later sortable, pullable …

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
| `delta`       | `center` minus its start, `{ x, y }`, stays continuous when fingers come and go |
| `direction`   | the dominant axis of `delta`: `left`, `right`, `up`, `down`, or `null` |
| `distance`    | length of `delta`                                                |
| `duration`    | milliseconds since the session started                          |
| `element`     | the element `gestures()` was bound to                            |
| `input`       | `mouse`, `pen`, `touch`, and `trackpad` or `wheel` for the sources without pointers |
| `maximumPointers` | the most pointers that were down at once                      |
| `modifiers`   | `{ alt, control, meta, shift }`                                  |
| `phase`       | `start`, `move`, `end` or `cancel`                               |
| `pointers`    | the pointers down right now                                      |
| `sourceEvent` | the native event that produced this state                        |
| `time`        | its timestamp                                                    |
| `rotation`    | degrees the first two pointers turned since two were down        |
| `scale`       | their spread relative to the moment two were down                |
| `start`       | where `center` started, `{ x, y }`                               |
| `target`      | the element the first pointer went down on                       |
| `travel`      | the farthest `distance` got during the session                   |
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
  **open**: a mouse wheel with ctrl held also reads as a pinch.

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
- every `tap` fires at once with its `count`, the second of a pair also fires
  `doubleTap`. `tap: { waitForDoubleTap: true }` makes the two exclusive: a
  single tap waits `interval` ms, which is felt as lag. **open**: which one is
  the better default (the first draft waited, and it felt slow).
- `press` decides nothing and claims nothing: `pressStart` on contact,
  `pressEnd` on release. it is the immediate feedback, like `:active` for
  every input.
- a `pointercancel` (the browser took the pointer, e.g. to scroll) cancels the
  whole session.

**open**: the swipe direction is the one of `delta`. a drag to the left that
ends in a flick to the right counts as left. the direction of `velocity` at
release may be the better reading.

**open**: a native drag (a selection, an image) takes the pointer and cancels
the session. recognizers that follow movement (`swipe`, `pan`) turn it off and
disable text selection, a pure `tap` leaves both alone.

**open**: long press and native `contextmenu` on touch both fire on android.
right now both are reported. alternatives: `secondary` swallows the long press
on touch, or the other way round.

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

**open**: whether events should be composed (cross shadow roots), a prefix
against clashes with future native event names.

## bundles

| bundle          | does | keyboard |
|-----------------|------|----------|
| `transformable` | one finger moves, two pinch and turn around their center, wheel or trackpad pinch zooms toward the cursor, double tap zooms in and back. taken on a `surface` (the parent), applied as `matrix()` | arrows, + −, [ ], 0 |
| `draggable`     | follows the pointer with `translate`, `axis`, `bounds`, glides on after a flick, `grid` and `snap` on release, `drop` targets with data-drop-over, `revert` | arrows (shift: more) |
| `dismissable`   | follows along an axis and fades, leaves when far or fast enough, snaps back otherwise, resistance for directions it may not go | delete, backspace |

a bundle returns `{ get, set, reset, destroy }` (or `dismiss`) and reports
through callbacks (`onChange`, `onDrop`, `onDismiss` …). **open**: whether
bundles should dispatch dom events as well, `draggable` could not use the
native `drag*` names.

keyboard counterparts live in the bundles: a recognizer is a pointer gesture,
what it does is what the keyboard can do too.

## state

built: tracker, trackpad, `press`, `pressRepeat`, `tap`, `doubleTap`, `longPress`,
`secondary`, `swipe`, `edgeSwipe`, `pan`, `pinch`, `rotate`, `wheel`, the bundles
`transformable`, `draggable`, `dismissable`,
handler guards, dom events with delegation, touch-action resolution, cleanup.

next candidates: `sortable` (long press, then drag to reorder), `pullable`
(pull to refresh), a pan with inertia as a recognizer option, and trying all of
it on real devices.

## to try out

`playground.html` next to this file, e.g.
https://code.pulgasari.dev/aufbau/gestures2/playground.html
