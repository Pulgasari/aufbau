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

// ── compose ──────────────────────────────────────────────────────────────

export type GestureOptions =
  PressableOptions & HoldableOptions & SwipeableOptions & PannableOptions & AdjustableOptions & {
    pressable?: PressableOptions;
    holdable?: HoldableOptions;
    swipeable?: SwipeableOptions;
    pannable?: PannableOptions;
    adjustable?: AdjustableOptions;
  };

export interface GestureHandle {
  parts: RecognizerPart[];
  destroy (): void;
}
export function gestures (element: Element, options?: GestureOptions): GestureHandle;

// ── math helpers ─────────────────────────────────────────────────────────

export function clamp (value: number, min: number, max: number): number;
export function distance (a: Point, b: Point): number;
export function midpoint (a: Point, b: Point): Point;
export function snap (value: number, steps: number | number[] | null): number;
