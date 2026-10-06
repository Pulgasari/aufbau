// @aufbau/gestures

export interface Point { x: number; y: number; }

export type Direction = 'down' | 'left' | 'right' | 'up';
export type Input     = 'mouse' | 'pen' | 'touch' | 'trackpad' | 'wheel';
export type Tolerance = number | { mouse?: number; pen?: number; touch?: number };

// the session as every gesture carries it, see concept.md
export interface Gesture {
  angle           : number;
  buttons         : number;
  center          : Point;
  delta           : Point;
  direction       : Direction | null;
  distance        : number;
  duration        : number;
  element         : Element;
  gesture         : string;
  input           : Input;
  maximumPointers : number;
  modifiers       : { alt: boolean; control: boolean; meta: boolean; shift: boolean };
  movement        : Point;
  phase           : 'start' | 'move' | 'end' | 'cancel';
  pointers        : number;
  rotation        : number;
  scale           : number;
  sourceEvent     : Event | null;
  start           : Point;
  target          : Element;
  time            : number;
  travel          : number;
  velocity        : { speed: number; x: number; y: number };

  count?          : number;   // tap, doubleTap, pressRepeat
  edge?           : Direction; // edgeSwipe
  progress?       : number;   // edgeSwipe
  rotationChange? : number;   // rotateMove
  scaleChange?    : number;   // pinchMove
}

export type Handler = (gesture: Gesture, event: CustomEvent<Gesture>) => void;

// a guard only filters what reaches its handler
export interface Guarded {
  handler          : Handler;
  input?           : Input;
  minimumDistance? : number;
  minimumSpeed?    : number;
  pointers?        : number;
}

export type GestureName =
  | 'doubleTap' | 'longPress' | 'secondary' | 'tap'
  | 'pressCancel' | 'pressEnd' | 'pressRepeat' | 'pressStart'
  | 'swipe' | 'swipeDown' | 'swipeLeft' | 'swipeRight' | 'swipeUp'
  | 'edgeSwipeCancel' | 'edgeSwipeEnd' | 'edgeSwipeMove' | 'edgeSwipeStart'
  | 'panCancel' | 'panEnd' | 'panMove' | 'panStart'
  | 'pinchCancel' | 'pinchEnd' | 'pinchMove' | 'pinchStart'
  | 'rotateCancel' | 'rotateEnd' | 'rotateMove' | 'rotateStart'
  | 'wheelEnd' | 'wheelMove' | 'wheelStart';

export type Handlers = { [K in GestureName as `on${Capitalize<K>}`]?: Handler | Guarded };

// thresholds, per recognizer
export interface RecognizerOptions {
  edgeSwipe? : { edges?: Direction[]; relativeTo?: 'element' | 'viewport'; size?: number; tolerance?: Tolerance };
  longPress? : { duration?: number; tolerance?: Tolerance };
  pan?       : { after?: 'longPress' | { [input: string]: 'longPress' }; axis?: 'x' | 'y' | null; pointers?: number; tolerance?: Tolerance; touchAction?: string };
  pinch?     : { threshold?: number; trackpad?: boolean; wheelIntensity?: number };
  press?     : { delay?: number; interval?: number; tolerance?: Tolerance };
  rotate?    : { threshold?: number; trackpad?: boolean };
  secondary? : { nativeMenu?: boolean };
  swipe?     : { minimumDistance?: number; minimumSpeed?: number; touchAction?: string };
  tap?       : { interval?: number; maximumDuration?: number; tolerance?: Tolerance; waitForDoubleTap?: boolean };
  wheel?     : { modifier?: 'alt' | 'control' | 'meta' | 'shift' | null; nativeScroll?: boolean };
}

export interface GestureOptions extends Handlers, RecognizerOptions {
  recognize?   : GestureName[];   // for listeners added with addEventListener
  touchAction? : string;          // instead of the strictest one the recognizers ask for
}

export interface GestureHandle {
  readonly element : Element;
  readonly session : Gesture | null;
  destroy (): void;
}

export function gestures (element: Element, options?: GestureOptions): GestureHandle;
export default gestures;

// :::::: BUNDLES

export interface AdjustableOptions {
  maximum?  : number;
  minimum?  : number;
  onChange? : (value: number, meta: { element: Element; final: boolean }) => void;
  steps?    : number | null;
  value?    : number;
}
export function adjustable (element: Element, options?: AdjustableOptions): { destroy (): void; get (): number; set (value: number): number };

export interface DismissableOptions {
  axis?       : 'x' | 'y';
  directions? : Direction[];
  distance?   : number;
  fade?       : boolean;
  keyboard?   : boolean;
  onDismiss?  : (detail: { direction: Direction; element: Element }) => void;
  onMove?     : (detail: { element: Element; offset: number; progress: number }) => void;
  remove?     : boolean;
  speed?      : number;
}
export function dismissable (element: Element, options?: DismissableOptions): { destroy (): void; dismiss (direction?: Direction): void; reset (): void };

export interface DragDetail { element: Element; position: Point; target: Element | null }
export interface DraggableOptions {
  axis?     : 'x' | 'y' | null;
  bounds?   : 'parent' | Element | null;
  drop?     : string | null;
  grid?     : number | null;
  inertia?  : boolean;
  keyboard? : boolean;
  onDrop?   : (detail: DragDetail) => void;
  onEnd?    : (detail: DragDetail) => void;
  onEnter?  : (detail: DragDetail) => void;
  onLeave?  : (detail: DragDetail) => void;
  onMove?   : (detail: DragDetail) => void;
  onStart?  : (detail: DragDetail) => void;
  revert?   : boolean;
  snap?     : Point[] | null;
  step?     : number;
}
export function draggable (element: Element, options?: DraggableOptions): { destroy (): void; get (): Point; reset (): void; set (position: Point): void };

export interface PullableOptions {
  content?    : Element;
  maximum?    : number;
  onPull?     : (detail: { distance: number; progress: number; refreshing: boolean }) => void;
  onRefresh?  : () => unknown;
  resistance? : number;
  threshold?  : number;
}
export function pullable (element: Element, options?: PullableOptions): { destroy (): void; refresh (): Promise<void> };

export interface SortableOptions {
  axis?     : 'x' | 'y' | null;
  handle?   : string | null;
  hold?     : number;
  items?    : string | null;
  keyboard? : boolean;
  onEnd?    : (detail: { from: number; item: Element; to: number }) => void;
  onSort?   : (detail: { from: number; item: Element; order: Element[]; to: number }) => void;
  onStart?  : (detail: { from: number; item: Element }) => void;
}
export function sortable (element: Element, options?: SortableOptions): { destroy (): void; order (): Element[] };

export interface TransformState { rotation: number; scale: number; x: number; y: number }
export interface TransformableOptions {
  doubleTapScale? : number;
  initial?        : Partial<TransformState>;
  keyboard?       : boolean;
  maximumScale?   : number;
  minimumScale?   : number;
  onChange?       : (state: TransformState) => void;
  rotate?         : boolean;
  surface?        : Element;
  wheel?          : 'zoom' | 'pan' | false;
  wheelIntensity? : number;
}
export function transformable (element: Element, options?: TransformableOptions): { destroy (): void; get (): TransformState; reset (): void; set (state: Partial<TransformState>): void };
