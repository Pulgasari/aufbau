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
   dom: draggable, dismissable, zoomable, sortable … (not started yet)

recognizers report *what happened*, bundles decide *what it does*.

## the session

one object per session, the recognizers read it and every gesture event
carries a snapshot of it as `detail`. the names are spelled out.

| field         | meaning                                                          |
|---------------|------------------------------------------------------------------|
| `angle`       | direction of `delta` in degrees, 0 is right, 90 is down          |
| `buttons`     | the pressed mouse buttons                                        |
| `center`      | the midpoint of all pointers, `{ x, y }` in client pixels        |
| `delta`       | `center` minus its start, `{ x, y }`, stays continuous when fingers come and go |
| `direction`   | the dominant axis of `delta`: `left`, `right`, `up`, `down`, or `null` |
| `distance`    | length of `delta`                                                |
| `duration`    | milliseconds since the session started                          |
| `element`     | the element `gestures()` was bound to                            |
| `input`       | `mouse`, `pen` or `touch`                                        |
| `maximumPointers` | the most pointers that were down at once                      |
| `modifiers`   | `{ alt, control, meta, shift }`                                  |
| `phase`       | `start`, `move`, `end` or `cancel`                               |
| `pointers`    | the pointers down right now                                      |
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

planned: `pinch` and `rotate` (the session already measures them), wheel and
trackpad sources, a repeat while held (the old holdable), bundles.

### native signals first

where the platform already carries the meaning, it is the source:

- `secondary` comes from the native `contextmenu`: right click, long press on
  touch where the platform fires one, the menu key, shift+f10. keyboard and
  accessibility come for free. the native menu is prevented while a handler
  listens.
- keyboard activation stays `click`. `tap` is the pointer gesture only.
- trackpad pinch arrives as `wheel` with `ctrlKey` (chrome, firefox) or as
  `gesture*` events (safari). **open**: how they join the session.

## arbitration

several recognizers look at the same session. the rules so far:

- a recognizer that owns the session **claims** it: `pan` once it started,
  `longPress` once it fired.
- `tap` fails when anything claimed the session, when `travel` exceeds the
  tolerance or when it took longer than `maximumDuration`.
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

## state

built: tracker, `press`, `tap`, `doubleTap`, `longPress`, `secondary`, `swipe`, `pan`,
handler guards, dom events with delegation, touch-action resolution, cleanup.

next candidates: `pinch` and `rotate` on the measured `scale` and `rotation`,
the wheel and trackpad sources, a repeat while held, the first bundle.

## to try out

`playground.html` next to this file, e.g.
https://code.pulgasari.dev/aufbau/gestures2/playground.html
