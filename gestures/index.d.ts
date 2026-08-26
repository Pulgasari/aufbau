// @aufbau/gestures — type declarations

export type Axis = 'x' | 'y' | 'both' | 'auto';
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface Point { x: number; y: number; }

export interface RecognizerPart {
  handlers: Record<string, (event: Event) => void>;
  style?: Partial<CSSStyleDeclaration>;
  touchAction?: string;
  destroy?: () => void;
  set?: (value: number) => void;
}

// ── recognizers ──────────────────────────────────────────────────────────

export interface PressableOptions {
  onClick?: (event: PointerEvent) => void;
  onDoubleClick?: (event: PointerEvent) => void;
  onLongClick?: (event: PointerEvent) => void;
  threshold?: number;      // ms held before a long-press fires (default 500)
  tolerance?: number;      // px of movement that cancels the tap (default 8)
  doubleWithin?: number;   // ms window for a double-tap (default 300)
}
export function pressable (options?: PressableOptions): RecognizerPart;

export interface HoldableOptions {
  onHold?: (count: number) => void;
  delay?: number;          // ms before repeating starts (default 500)
  speed?: number;          // ms between repeats (default 100)
}
export function holdable (options?: HoldableOptions): RecognizerPart;

export interface SwipePayload {
  direction: SwipeDirection;
  deltaX: number;
  deltaY: number;
  duration: number;
  event: PointerEvent;
}
export interface SwipeableOptions {
  onSwipe?: (payload: SwipePayload) => void;
  onSwipeUp?: (payload: SwipePayload) => void;
  onSwipeDown?: (payload: SwipePayload) => void;
  onSwipeLeft?: (payload: SwipePayload) => void;
  onSwipeRight?: (payload: SwipePayload) => void;
  threshold?: number;       // px before a swipe registers (default 50)
  holdTime?: number;        // ms; ignore swipes slower than this (default 0 = off)
  preventScroll?: boolean;  // lock native scrolling while swiping (default false)
}
export function swipeable (options?: SwipeableOptions): RecognizerPart;

export interface PanPayload {
  deltaX: number;   // total movement since the gesture started
  deltaY: number;
  stepX: number;    // movement since the previous move event
  stepY: number;
  event: PointerEvent;
}
export interface PannableOptions {
  onPanStart?: (payload: PanPayload) => void;
  onPan?: (payload: PanPayload) => void;
  onPanEnd?: (payload: PanPayload) => void;
  tolerance?: number;   // px before the drag starts (default 8)
}
export function pannable (options?: PannableOptions): RecognizerPart;

export interface AdjustMeta { axis: Axis; final: boolean; element: Element; }
export interface AdjustableOptions {
  onAdjust?: (value: number, meta: AdjustMeta) => void;
  value?: number;                       // starting value (default 48)
  min?: number;                         // default 48
  max?: number;                         // default 256
  steps?: number | number[] | null;     // snap target on release (default null)
  axis?: Axis;                          // 'auto' derives from the finger pair
  wheelStep?: number;                   // ctrl/cmd + wheel increment (default 16)
  wheel?: boolean;                      // enable the wheel fallback (default true)
}
export function adjustable (options?: AdjustableOptions): RecognizerPart & { set: (value: number) => void };

export type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt';

export interface WheelPayload { deltaX: number; deltaY: number; event: WheelEvent; }
export interface WheelableOptions {
  onWheel?: (payload: WheelPayload) => void;
  modifier?: Modifier | null;   // only react while this key is held (default null)
}
export function wheelable (options?: WheelableOptions): RecognizerPart;

export interface PinchPayload {
  scale: number;        // relative to the gesture start (start = 1)
  deltaScale: number;   // ratio since the previous event
  focal: Point;         // finger midpoint (client coords)
  event: PointerEvent;
}
export interface PinchableOptions {
  onPinchStart?: (payload: PinchPayload) => void;
  onPinch?: (payload: PinchPayload) => void;
  onPinchEnd?: (payload: PinchPayload) => void;
}
export function pinchable (options?: PinchableOptions): RecognizerPart;

export interface RotatePayload {
  rotation: number;        // accumulated degrees over the gesture
  deltaRotation: number;   // degrees since the previous event
  focal: Point;
  event: PointerEvent;
}
export interface RotatableOptions {
  onRotateStart?: (payload: RotatePayload) => void;
  onRotate?: (payload: RotatePayload) => void;
  onRotateEnd?: (payload: RotatePayload) => void;
}
export function rotatable (options?: RotatableOptions): RecognizerPart;

export interface Transform { x: number; y: number; scale: number; rotation: number; }
export interface TransformPayload extends Transform {
  matrix: [number, number, number, number, number, number];   // matrix(a,b,c,d,e,f)
  focal: Point;
  event: PointerEvent | WheelEvent;
}
export interface TransformableOptions extends Partial<Transform> {
  onTransformStart?: (payload: TransformPayload) => void;
  onTransform?: (payload: TransformPayload) => void;
  onTransformEnd?: (payload: TransformPayload) => void;
  minScale?: number;         // default 0.05
  maxScale?: number;         // default 40
  pan?: boolean;             // single-pointer + midpoint translation (default true)
  zoom?: boolean;            // default true
  rotate?: boolean;          // default true
  wheel?: boolean;           // wheel zoom (default true)
  wheelIntensity?: number;   // zoom per normalized wheel pixel (default 0.0015)
  wheelModifier?: Modifier | null;
}
export function transformable (options?: TransformableOptions): RecognizerPart & {
  set: (transform: Partial<Transform>) => void;
  get: () => Transform;
};

// ── compose ──────────────────────────────────────────────────────────────

export type GestureOptions =
  PressableOptions & HoldableOptions & SwipeableOptions & PannableOptions &
  PinchableOptions & RotatableOptions & WheelableOptions & AdjustableOptions & TransformableOptions & {
    pressable?: PressableOptions;
    holdable?: HoldableOptions;
    swipeable?: SwipeableOptions;
    pannable?: PannableOptions;
    pinchable?: PinchableOptions;
    rotatable?: RotatableOptions;
    wheelable?: WheelableOptions;
    adjustable?: AdjustableOptions;
    transformable?: TransformableOptions;
  };

export interface GestureHandle {
  parts: RecognizerPart[];
  destroy (): void;
}
export function gestures (element: Element, options?: GestureOptions): GestureHandle;

// ── math helpers ─────────────────────────────────────────────────────────

export function angle (a: Point, b: Point): number;   // degrees
export function clamp (value: number, min: number, max: number): number;
export function distance (a: Point, b: Point): number;
export function midpoint (a: Point, b: Point): Point;
export function snap (value: number, steps: number | number[] | null): number;
