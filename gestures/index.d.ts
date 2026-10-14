/**
 * Gestures as easy to use as a click, on pointer events: mouse, touch and pen go
 * one way, a trackpad pinch and rotation too. A tracker measures one session per
 * element, recognizers turn it into named gestures, and bundles turn gestures into
 * an effect on the page: drag, sort, swipe away, pull to refresh, pinch to resize,
 * move and zoom.
 *
 * @example Handlers
 * ```js
 * import gestures from '@aufbau/gestures';
 *
 * const handle = gestures(element, {
 *   onTap        : gesture => select(gesture.target),
 *   onSwipeLeft  : gesture => next(),
 *   onSwipeRight : { minimumSpeed: 1, handler: gesture => previous() },
 * });
 * handle.destroy();
 * ```
 *
 * @example Dom events
 * ```js
 * gestures(list, { recognize: ['swipe'] });
 * list.addEventListener('swipeleft', event => archive(event.detail.target));
 * ```
 *
 * @example A bundle
 * ```js
 * import { sortable } from '@aufbau/gestures';
 *
 * sortable(list, { handle: '.grip', onSort: ({ order }) => save(order) });
 * ```
 *
 * @module
 */

/** A point in client pixels. */
export interface Point {
  /** Pixels from the left. */
  x : number;
  /** Pixels from the top. */
  y : number;
}

/** The dominant direction of a movement. */
export type Direction = 'down' | 'left' | 'right' | 'up';

/** An edge of an element or of the viewport. */
export type Edge = 'bottom' | 'left' | 'right' | 'top';

/** What produced a session. */
export type Input = 'mouse' | 'pen' | 'touch' | 'trackpad' | 'wheel';

/**
 * The distance in px a pointer may travel and still count as standing still: one
 * number, or one per input. Defaults: mouse 4, pen 8, touch 10.
 */
export type Tolerance = number | { mouse?: number; pen?: number; touch?: number };

/** A session as every handler and every dom event gets it. */
export interface Gesture {
  /** The angle of the first two pointers, in degrees. */
  angle           : number;
  /** The mouse buttons held, as in `PointerEvent.buttons`. */
  buttons         : number;
  /** The midpoint of all pointers. */
  center          : Point;
  /** The points the browser merged into this event, with `coalesced: true` only. */
  coalesced?      : { pressure: number; time: number; x: number; y: number }[];
  /** {@link center} minus where it started, continuous when fingers come and go. */
  delta           : Point;
  /** The dominant axis of {@link delta}, null while it is zero. */
  direction       : Direction | null;
  /** The length of {@link delta}. */
  distance        : number;
  /** Milliseconds since the session started. */
  duration        : number;
  /** The element `gestures()` was bound to. */
  element         : Element;
  /** The name of the gesture, e.g. `swipeLeft`. */
  gesture         : string;
  /** What produced the session. */
  input           : Input;
  /** The most pointers that were down at once. */
  maximumPointers : number;
  /** The modifier keys held. */
  modifiers       : { alt: boolean; control: boolean; meta: boolean; shift: boolean };
  /** The change of {@link center} since the previous event. */
  movement        : Point;
  /** `composedPath()` of the event that started the session, into shadow roots as well. */
  path            : EventTarget[];
  /** Where the session is. */
  phase           : 'start' | 'move' | 'end' | 'cancel';
  /** The pointer behind this event, null for a trackpad or the wheel. */
  pointerId       : number | null;
  /** The pointers down right now. */
  pointers        : number;
  /** Each pointer down right now. */
  positions       : { id: number; x: number; y: number }[];
  /** The pressure of the pointer behind this event, from 0 to 1 (a mouse reports 0.5 while pressed). */
  pressure        : number;
  /** Degrees the first two pointers turned since two were down. */
  rotation        : number;
  /** Their spread relative to the moment two were down. */
  scale           : number;
  /** The native event that produced this state. */
  sourceEvent     : Event | null;
  /** Where {@link center} started. */
  start           : Point;
  /** The element the first pointer went down on, retargeted out of shadow roots. */
  target          : Element;
  /** The tilt of a pen in degrees, toward x and toward y. */
  tilt            : Point;
  /** The timestamp of {@link sourceEvent}. */
  time            : number;
  /** The farthest {@link distance} got: what tells a tap from a movement. */
  travel          : number;
  /** The rotation of a pen around its own axis, in degrees from 0 to 359. */
  twist           : number;
  /** Pixels per millisecond over the last 100 ms. */
  velocity        : { speed: number; x: number; y: number };

  /** The taps in a row, for tap, doubleTap, twoFingerTap and pressRepeat. */
  count?          : number;
  /** The edge an edge swipe started at. */
  edge?           : Edge;
  /** How far across an edge swipe is, from 0 to 1. */
  progress?       : number;
  /** The rotation since the previous rotateMove. */
  rotationChange? : number;
  /** The scale change since the previous pinchMove. */
  scaleChange?    : number;
}

/** A gesture handler. The event is the dom event the gesture is dispatched as. */
export type Handler = (gesture: Gesture, event: CustomEvent<Gesture>) => void;

/** A handler behind guards: a gesture that does not pass them does not reach it. */
export interface Guarded {
  /** The handler. */
  handler          : Handler;
  /** Only this input. */
  input?           : Input;
  /** Only when the gesture travelled at least this far, in px. */
  minimumDistance? : number;
  /** Only when it was at least this fast, in px per ms. */
  minimumSpeed?    : number;
  /** Only with this many pointers at most. */
  pointers?        : number;
}

/** Every gesture there is. The dom event of one is its name in lowercase. */
export type GestureName =
  | 'doubleTap' | 'longPress' | 'secondary' | 'tap' | 'twoFingerTap'
  | 'doubleTapDragCancel' | 'doubleTapDragEnd' | 'doubleTapDragMove' | 'doubleTapDragStart'
  | 'pressCancel' | 'pressEnd' | 'pressRepeat' | 'pressStart'
  | 'swipe' | 'swipeDown' | 'swipeLeft' | 'swipeRight' | 'swipeUp'
  | 'edgeSwipeCancel' | 'edgeSwipeEnd' | 'edgeSwipeMove' | 'edgeSwipeStart'
  | 'panCancel' | 'panEnd' | 'panMove' | 'panStart'
  | 'pinchCancel' | 'pinchEnd' | 'pinchMove' | 'pinchStart'
  | 'rotateCancel' | 'rotateEnd' | 'rotateMove' | 'rotateStart'
  | 'wheelEnd' | 'wheelMove' | 'wheelStart';

/** A handler per gesture, `onTap`, `onSwipeLeft` and so on. */
export type Handlers = { [K in GestureName as `on${Capitalize<K>}`]?: Handler | Guarded };

/** The name of a recognizer, which reports one or several gestures. */
export type RecognizerName = 'doubleTapDrag' | 'edgeSwipe' | 'longPress' | 'pan' | 'pinch' | 'press' | 'rotate' | 'secondary' | 'swipe' | 'tap' | 'wheel';

/** The thresholds of the recognizers. */
export interface RecognizerOptions {
  /** Tap, then press again and drag. Defaults: 300 ms between the two, a tap lasts 500 ms at most. */
  doubleTapDrag? : { interval?: number; maximumDuration?: number; tolerance?: Tolerance };
  /** A swipe that starts at an edge. Defaults: edges `['left']`, size 24 px from the element. */
  edgeSwipe?     : { edges?: Edge[]; relativeTo?: 'element' | 'viewport'; size?: number; tolerance?: Tolerance };
  /**
   * A press held still. Default duration 500 ms. Where secondary listens, a long
   * press on touch and pen waits `grace` ms longer (default 200) and steps back
   * when the platform fired a contextmenu meanwhile.
   */
  longPress?     : { duration?: number; grace?: number; tolerance?: Tolerance };
  /**
   * A drag. `after: 'longPress'` starts it only after a long press, per input as
   * `{ touch: 'longPress' }`. `axis` leaves the other axis to native scrolling.
   */
  pan?           : { after?: 'longPress' | { [input: string]: 'longPress' }; axis?: 'x' | 'y' | null; pointers?: number; tolerance?: Tolerance; touchAction?: string };
  /** Two fingers spreading, a trackpad pinch or ctrl + wheel. Default threshold 0.05. */
  pinch?         : { threshold?: number; trackpad?: boolean; wheelIntensity?: number };
  /** Press start, end and repeat while held. Defaults: delay 400 ms, interval 100 ms. */
  press?         : { delay?: number; interval?: number; tolerance?: Tolerance };
  /** Two fingers turning, or a trackpad rotation. Default threshold 10 degrees. */
  rotate?        : { threshold?: number; trackpad?: boolean };
  /** Right click, long press, menu key. `nativeMenu: true` keeps the browser's menu. */
  secondary?     : { nativeMenu?: boolean };
  /** A flick, its direction the one of the velocity at release. Defaults: 30 px, 0.3 px per ms. */
  swipe?         : { minimumDistance?: number; minimumSpeed?: number; touchAction?: string };
  /**
   * A tap. Defaults: taps within 300 ms count up, one lasts 500 ms at most. Where
   * doubleTap is listened to, a single tap waits `interval` ms so the two exclude
   * each other; `waitForDoubleTap` is a shorter wait in ms, or `false` for none.
   */
  tap?           : { interval?: number; maximumDuration?: number; tolerance?: Tolerance; waitForDoubleTap?: boolean | number };
  /** The wheel, optionally only with a modifier. `nativeScroll: true` lets the page scroll. */
  wheel?         : { modifier?: 'alt' | 'control' | 'meta' | 'shift' | null; nativeScroll?: boolean };
}

/** The options of {@link gestures}: handlers, thresholds and what to recognize. */
export interface GestureOptions extends Handlers, RecognizerOptions {
  /** Adds the points the browser merged into each event as `coalesced`, for drawing. */
  coalesced?   : boolean;
  /** Gestures to recognize without a handler, for listeners added with `addEventListener`. */
  recognize?   : (GestureName | RecognizerName)[];
  /** The `touch-action` of the element instead of the strictest one the recognizers ask for. */
  touchAction? : string;
  /**
   * Gives the pointer up when another element claims it, even after claiming it first.
   * By default the session that claims a pointer first keeps it, and nested elements hear it first.
   */
  yield?       : boolean;
}

/** What {@link gestures} returns. */
export interface GestureHandle {
  /** The element the gestures are bound to. */
  readonly element : Element;
  /** The session in progress, or null. */
  readonly session : Gesture | null;
  /**
   * Turns a recognizer (or the one behind a gesture) on or off, or asks a predicate
   * at the start of each session, e.g. `enable('pan', gesture => onEdge(gesture.start))`.
   */
  enable (name: GestureName | RecognizerName, value?: boolean | ((gesture: Gesture) => boolean)): GestureHandle;
  /** Adds a handler, returns the function that removes it. `touch-action` follows. */
  on (name: GestureName, handler: Handler | Guarded): () => void;
  /** Recognizes gestures without a handler, or stops with `false`. */
  recognize (names: GestureName | RecognizerName | (GestureName | RecognizerName)[], value?: boolean): GestureHandle;
  /** Merges new options, handlers or thresholds; the recognizers are rebuilt after the running session. */
  set (options: GestureOptions): GestureHandle;
  /** Stops recognizing and restores the element's styles. */
  destroy (): void;
}

/** Every gesture name, sorted. */
export declare const GESTURES: readonly GestureName[];

/**
 * Recognizes gestures on an element: calls the handlers given and dispatches each
 * gesture as a dom event that bubbles from where the pointer went down.
 *
 * @throws When `recognize` names an unknown gesture.
 */
export declare function gestures (element: Element, options?: GestureOptions): GestureHandle;

export default gestures;

// :::::: BUNDLES

/** The options of {@link adjustable}. */
export interface AdjustableOptions {
  /** The highest value. Default `256`. */
  maximum?  : number;
  /** The lowest value. Default `48`. */
  minimum?  : number;
  /** Called on every change, `final` on release. */
  onChange? : (value: number, meta: { element: Element; final: boolean }) => void;
  /** Snaps to multiples of this on release. */
  steps?    : number | null;
  /** The value to start at. Default {@link minimum}. */
  value?    : number;
}

/** What {@link adjustable} returns. */
export interface AdjustableHandle {
  /** The current value. */
  get (): number;
  /** Sets the value, clamped, and returns it. */
  set (value: number): number;
  /** Stops listening. */
  destroy (): void;
}

/**
 * One number by pinching: the size of the items in a grid, a font size. Two fingers,
 * a trackpad pinch or ctrl + wheel change it; one finger still scrolls.
 */
export declare function adjustable (element: Element, options?: AdjustableOptions): AdjustableHandle;

/** The options of {@link dismissable}. */
export interface DismissableOptions {
  /** The axis it follows. Default `x`. */
  axis?       : 'x' | 'y';
  /** The directions it can leave in. Default both of the axis. */
  directions? : Direction[];
  /** The share of its size that dismisses on release. Default `0.4`. */
  distance?   : number;
  /** Fades while it moves. Default `true`. */
  fade?       : boolean;
  /** Delete and backspace dismiss it once it has focus. Default `true`. */
  keyboard?   : boolean;
  /** Called when it leaves. */
  onDismiss?  : (detail: { direction: Direction; element: Element }) => void;
  /** Called while it follows, `progress` from 0 to 1 toward dismissal. */
  onMove?     : (detail: { element: Element; offset: number; progress: number }) => void;
  /** Removes it from the dom once it left. Default `false`. */
  remove?     : boolean;
  /** The speed in px per ms that dismisses whatever the distance. Default `0.5`. */
  speed?      : number;
}

/** What {@link dismissable} returns. */
export interface DismissableHandle {
  /** Dismisses it, in a direction of its own choosing when left out. */
  dismiss (direction?: Direction): void;
  /** Brings it back to where it started. */
  reset (): void;
  /** Stops listening. */
  destroy (): void;
}

/** Swipe away: the element follows along one axis, then leaves or snaps back. */
export declare function dismissable (element: Element, options?: DismissableOptions): DismissableHandle;

/** What the callbacks of {@link draggable} get. */
export interface DragDetail {
  /** The dragged element. */
  element  : Element;
  /** Its offset from where it started. */
  position : Point;
  /** The drop target under the pointer, or null. */
  target   : Element | null;
}

/** The options of {@link draggable}. */
export interface DraggableOptions {
  /** Locks it to an axis. */
  axis?       : 'x' | 'y' | null;
  /** Keeps it inside its parent or an element. */
  bounds?     : 'parent' | Element | null;
  /** A selector for the drop targets. */
  drop?       : string | null;
  /** A step in px it snaps to on release. */
  grid?       : number | null;
  /** Glides on after a flick. Default `true`. */
  inertia?    : boolean;
  /** Arrow keys move it once it has focus. Default `true`. */
  keyboard?   : boolean;
  /** Called when it is dropped onto a target. */
  onDrop?     : (detail: DragDetail) => void;
  /** Called when a drag ends. */
  onEnd?      : (detail: DragDetail) => void;
  /** Called when it moves over a drop target. */
  onEnter?    : (detail: DragDetail) => void;
  /** Called when it leaves a drop target. */
  onLeave?    : (detail: DragDetail) => void;
  /** Called on every move. */
  onMove?     : (detail: DragDetail) => void;
  /** Called when a drag starts. */
  onStart?    : (detail: DragDetail) => void;
  /** Returns to its start unless dropped onto a target. Default `false`. */
  revert?     : boolean;
  /** The share it follows past the bounds, pulled back on release. Default `0`, a hard edge. */
  rubberband? : number;
  /** Points it snaps to on release, the nearest one. */
  snap?       : Point[] | null;
  /** The px an arrow key moves it, shift five times as far. Default `10`. */
  step?       : number;
}

/** What {@link draggable} returns. */
export interface DraggableHandle {
  /** Its offset from where it started. */
  get (): Point;
  /** Moves it to an offset. */
  set (position: Partial<Point>): void;
  /** Moves it back to where it started. */
  reset (): void;
  /** Stops listening. */
  destroy (): void;
}

/** An element that follows a pointer, moved with the css `translate` property. */
export declare function draggable (element: Element, options?: DraggableOptions): DraggableHandle;

/** The options of {@link pullable}. */
export interface PullableOptions {
  /** What moves with the pull. Default the first child. */
  content?    : Element;
  /** How far it can be pulled, as a multiple of the threshold. Default `1.75`. */
  maximum?    : number;
  /** Called while pulling, `progress` 1 at the threshold, for an indicator. */
  onPull?     : (detail: { distance: number; progress: number; refreshing: boolean }) => void;
  /** Called on a release past the threshold, a promise is awaited. */
  onRefresh?  : () => unknown;
  /** How much the pull lags behind the pointer. Default `0.5`. */
  resistance? : number;
  /** The px that trigger a refresh. Default `64`. */
  threshold?  : number;
}

/** What {@link pullable} returns. */
export interface PullableHandle {
  /** Runs a refresh as if pulled, for a refresh button. */
  refresh (): Promise<void>;
  /** Stops listening and restores the container. */
  destroy (): void;
}

/** Pull to refresh on a scroll container. */
export declare function pullable (element: Element, options?: PullableOptions): PullableHandle;

/** What {@link sortable} reports when the order changed. */
export interface SortDetail {
  /** The index it came from, in its source list. */
  from   : number;
  /** The moved item. */
  item   : Element;
  /** The list it is in now. */
  list   : Element;
  /** The items of that list in their new order. */
  order  : Element[];
  /** The list it came from. */
  source : Element;
  /** Its index in the list it is in now. */
  to     : number;
}

/** The options of {@link sortable}. */
export interface SortableOptions {
  /** The text announced to screen readers after a move, or `false`. Default `"3 / 7"`. */
  announce?   : ((detail: SortDetail & { length: number }) => string) | false;
  /** Scrolls the scroll container while an item is dragged near its edges. Default `true`. */
  autoScroll? : boolean;
  /** The axis the list scrolls on, for `touch-action` and auto scroll. Default `y`. */
  axis?       : 'x' | 'y' | null;
  /** The px from the scroll container's edge where auto scroll starts. Default `48`. */
  edge?       : number;
  /** Lists with the same group take each other's items. */
  group?      : string | null;
  /** A selector inside an item that starts the drag, shadow roots too. */
  handle?     : string | null;
  /** The ms of the long press that lifts an item on touch and pen. Default `350`. */
  hold?       : number;
  /** A selector for the items, the children by default. */
  items?      : string | null;
  /** Alt + arrow moves the focused item. Default `true`. */
  keyboard?   : boolean;
  /** Called when a drag ends. */
  onEnd?      : (detail: { from: number; item: Element; to: number }) => void;
  /** Called when the order changed. */
  onSort?     : (detail: SortDetail) => void;
  /** Called when a drag starts. */
  onStart?    : (detail: { from: number; item: Element }) => void;
  /** The px per frame auto scroll moves at the very edge. Default `16`. */
  speed?      : number;
}

/** What {@link sortable} returns. */
export interface SortableHandle {
  /** The items in their current order. */
  order (): Element[];
  /** Stops listening. */
  destroy (): void;
}

/** Reorders the items of a list or grid by dragging; the others slide into place. */
export declare function sortable (element: Element, options?: SortableOptions): SortableHandle;

/** Where a transformable element is. */
export interface TransformState {
  /** Degrees turned. */
  rotation : number;
  /** The zoom factor. */
  scale    : number;
  /** The offset in px from the left. */
  x        : number;
  /** The offset in px from the top. */
  y        : number;
}

/** The options of {@link transformable}. */
export interface TransformableOptions {
  /** The zoom per px of a double tap drag (down zooms in), `0` turns it off. Default `0.01`. */
  doubleTapDrag?  : number;
  /** The scale a double tap zooms to. Default `2`. */
  doubleTapScale? : number;
  /** Where it starts. */
  initial?        : Partial<TransformState>;
  /** Arrows, + and -, [ and ] and 0 on the focused surface. Default `true`. */
  keyboard?       : boolean;
  /** The highest scale. Default `8`. */
  maximumScale?   : number;
  /** The lowest scale. Default `0.25`. */
  minimumScale?   : number;
  /** Called on every change. */
  onChange?       : (state: TransformState) => void;
  /** Two fingers turn it as well. Default `true`. */
  rotate?         : boolean;
  /** The element the gestures are taken on. Default the parent. */
  surface?        : Element;
  /** What the wheel does. Default `zoom`. */
  wheel?          : 'zoom' | 'pan' | false;
  /** How fast the wheel zooms. Default `0.0015`. */
  wheelIntensity? : number;
}

/** What {@link transformable} returns. */
export interface TransformableHandle {
  /** Where it is. */
  get (): TransformState;
  /** Moves, zooms or turns it. */
  set (state: Partial<TransformState>): void;
  /** Back to the initial state. */
  reset (): void;
  /** Stops listening. */
  destroy (): void;
}

/** Free move, zoom and turn of an element; the point under the fingers stays under them. */
export declare function transformable (element: Element, options?: TransformableOptions): TransformableHandle;

/** A side or a corner of an element. */
export type ResizeEdge = Edge | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

/** What the callbacks of {@link resizable} get. */
export interface ResizeDetail {
  /** The edge being dragged. */
  edge    : ResizeEdge;
  /** The resized element. */
  element : Element;
  /** Its border box height in px. */
  height  : number;
  /** Its border box width in px. */
  width   : number;
}

/** The options of {@link resizable}. */
export interface ResizableOptions {
  /** Keeps a width to height ratio, `true` the current one. */
  aspectRatio?   : number | true | null;
  /** The edges and corners that resize. Default `['right', 'bottom', 'bottom-right']`. */
  edges?         : ResizeEdge[];
  /** A step in px the size snaps to. */
  grid?          : number | null;
  /** Shift + arrows resize it once it has focus. Default `true`. */
  keyboard?      : boolean;
  /** The highest height. */
  maximumHeight? : number;
  /** The highest width. */
  maximumWidth?  : number;
  /** The lowest height. Default `24`. */
  minimumHeight? : number;
  /** The lowest width. Default `24`. */
  minimumWidth?  : number;
  /** Called on every change. */
  onChange?      : (detail: ResizeDetail) => void;
  /** Called when a resize ends. */
  onEnd?         : (detail: ResizeDetail) => void;
  /** Called when a resize starts. */
  onStart?       : (detail: ResizeDetail) => void;
  /** The px of the grip zone along an edge. Default `8`. */
  size?          : number;
  /** The px a key resizes by. Default `10`. */
  step?          : number;
}

/** What {@link resizable} returns. */
export interface ResizableHandle {
  /** Its border box size. */
  get (): { height: number; width: number };
  /** Resizes it, within its limits. */
  set (size: Partial<{ height: number; width: number }>): void;
  /** Stops listening. */
  destroy (): void;
}

/** Resizes an element by its edges and corners; anywhere else the content keeps the pointer. */
export declare function resizable (element: Element, options?: ResizableOptions): ResizableHandle;
