// @aufbau/gestures2/bundles/transformable.js
// free move, zoom and turn of an element: one finger moves it, two fingers
// pinch and turn it around their center, the wheel or a trackpad pinch zooms
// toward the cursor, a double tap zooms in and back. the point under the
// fingers stays under the fingers.
//
// the gestures are taken on `surface` (the parent by default), so the element
// can be grabbed anywhere around it and its own transform does not move the
// target area. the element gets transform-origin 0 0 and a matrix().
//
// keyboard, once the surface has focus: arrows move (shift: more), + and -
// zoom, [ and ] turn, 0 resets.
//
//   const view = transformable(image, { maximumScale: 6, onChange: state => … });
//   view.set({ scale: 2 }); view.reset(); view.destroy();

import gestures from './../index.js';

// :::::: MATRIX
// { a, b, c, d, e, f } as in matrix(a, b, c, d, e, f), similarities only

const multiply = (m, n) => ({
  a: m.a * n.a + m.c * n.b,
  b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d,
  d: m.b * n.c + m.d * n.d,
  e: m.a * n.e + m.c * n.f + m.e,
  f: m.b * n.e + m.d * n.f + m.f,
});

// scale and turn around a point
const around = (point, scale, degrees) => {
  const radians = degrees * Math.PI / 180;
  const cos     = Math.cos(radians) * scale;
  const sin     = Math.sin(radians) * scale;
  return { a: cos, b: sin, c: -sin, d: cos, e: point.x - cos * point.x + sin * point.y, f: point.y - sin * point.x - cos * point.y };
};

const translation = (x, y) => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });

const stateOf = m => ({ rotation: Math.atan2(m.b, m.a) * 180 / Math.PI, scale: Math.hypot(m.a, m.b), x: m.e, y: m.f });

const matrixOf = ({ rotation = 0, scale = 1, x = 0, y = 0 } = {}) => {
  const radians = rotation * Math.PI / 180;
  return { a: Math.cos(radians) * scale, b: Math.sin(radians) * scale, c: -Math.sin(radians) * scale, d: Math.cos(radians) * scale, e: x, f: y };
};

// :::::: MAIN

function transformable (element, options = {}) {
  const {
    doubleTapScale = 2,
    initial        = {},
    keyboard       = true,
    maximumScale   = 8,
    minimumScale   = 0.25,
    onChange       = null,
    rotate         = true,
    surface        = element.parentElement,
    wheel          = 'zoom',   // 'zoom', 'pan' or false
    wheelIntensity = 0.0015,
  } = options;

  let matrix  = matrixOf(initial);
  let applied = null;   // the event whose movement is applied, pinch and rotate report the same one

  element.style.transformOrigin = '0 0';

  // the element's untransformed top left in client coordinates: the transform
  // happens around it, so every gesture point is taken relative to it. measured
  // exactly (offsetLeft rounds to whole pixels, which drifts the pivot while
  // zooming) with the transform taken off for a moment: one layout per touch or
  // wheel run, kept until the next one starts
  let base = null;
  const origin = () => {
    if (base) return base;
    const transform = element.style.transform;
    element.style.transform = 'none';
    const rect = element.getBoundingClientRect();
    element.style.transform = transform;
    return base = { x: rect.left, y: rect.top };
  };
  const local = point => { const at = origin(); return { x: point.x - at.x, y: point.y - at.y }; };

  function render () {
    element.style.transform = `matrix(${matrix.a}, ${matrix.b}, ${matrix.c}, ${matrix.d}, ${matrix.e}, ${matrix.f})`;
    onChange?.(stateOf(matrix));
  }

  // the scale stays within its bounds, the pivot stays put
  function transform (point, scale = 1, degrees = 0) {
    const current = Math.hypot(matrix.a, matrix.b);
    const factor  = Math.min(maximumScale, Math.max(minimumScale, current * scale)) / current;
    matrix = multiply(around(local(point), factor, degrees), matrix);
  }

  function move (gesture) {
    if (applied === gesture.sourceEvent) return;
    applied = gesture.sourceEvent;
    matrix  = multiply(translation(gesture.movement.x, gesture.movement.y), matrix);
  }

  // :::::: GESTURES

  const handle = gestures(surface, {
    onDoubleTap  : gesture => {
      const scale = Math.hypot(matrix.a, matrix.b);
      transform(gesture.center, scale > 1.01 ? 1 / scale : doubleTapScale);
      render();
    },
    onPanMove    : gesture => { move(gesture); render(); },
    onPressStart : () => { base = null; },
    // the pair's movement first, then scale and turn around where the center is now:
    // the point that was under the fingers stays under them
    onPinchMove  : gesture => { if (gesture.input !== 'trackpad') move(gesture); transform(gesture.center, gesture.scaleChange); render(); },
    ...(rotate ? { onRotateMove: gesture => { if (gesture.input !== 'trackpad') move(gesture); transform(gesture.center, 1, gesture.rotationChange); render(); } } : {}),
    ...(wheel ? {
      onWheelStart: () => { base = null; },
      onWheelMove: gesture => {
        if (wheel === 'pan') matrix = multiply(translation(-gesture.movement.x, -gesture.movement.y), matrix);
        else transform(gesture.center, Math.exp(-gesture.movement.y * wheelIntensity));
        render();
      },
    } : {}),
    pan    : { pointers: 1 },
    pinch  : { threshold: 0.02 },
    rotate : { threshold: 5 },
  });

  // :::::: KEYBOARD

  const center = () => { base = null; const rect = surface.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; };

  const KEYS = {
    '+'          : () => transform(center(), 1.2),
    '-'          : () => transform(center(), 1 / 1.2),
    '0'          : () => { matrix = matrixOf(initial); },
    '='          : () => transform(center(), 1.2),
    '['          : () => rotate && transform(center(), 1, -15),
    ']'          : () => rotate && transform(center(), 1, 15),
    'ArrowDown'  : distance => { matrix = multiply(translation(0, distance), matrix); },
    'ArrowLeft'  : distance => { matrix = multiply(translation(-distance, 0), matrix); },
    'ArrowRight' : distance => { matrix = multiply(translation(distance, 0), matrix); },
    'ArrowUp'    : distance => { matrix = multiply(translation(0, -distance), matrix); },
  };

  function keydown (event) {
    const action = KEYS[event.key];
    if (!action || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    action(event.shiftKey ? 100 : 20);
    render();
  }

  if (keyboard) {
    if (!surface.hasAttribute('tabindex')) surface.tabIndex = 0;
    surface.addEventListener('keydown', keydown);
  }

  render();

  return {
    get   : () => stateOf(matrix),
    reset : () => { matrix = matrixOf(initial); render(); },
    set   : values => { matrix = matrixOf({ ...stateOf(matrix), ...values }); render(); },
    destroy () {
      handle.destroy();
      surface.removeEventListener('keydown', keydown);
    },
  };
}

export { transformable };
export default transformable;
