// @aufbau/gestures/bundles/adjustable.js
// one number by pinching: the size of the items in a grid, a font size. two
// fingers spread it, a trackpad pinch or ctrl + wheel too, clamped to
// `minimum` and `maximum`, snapped to `steps` on release. one finger still
// scrolls, only the browser's own pinch zoom is off.
//
// keyboard: none, the value is the keyboard counterpart (a slider, + and -).
//
//   const size = adjustable(grid, { value: 120, minimum: 56, maximum: 240, onChange: (value, { final }) => … });
//   size.set(80); size.get(); size.destroy();

import gestures from './../index.js';

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function adjustable (element, options = {}) {
  const {
    maximum  = 256,
    minimum  = 48,
    onChange = null,
    steps    = null,   // a number snaps to its multiples on release
  } = options;

  let value = clamp(options.value ?? minimum, minimum, maximum);
  let base  = value;

  const snap = next => typeof steps === 'number' && steps > 0 ? Math.round(next / steps) * steps : next;

  function change (next, final) {
    value = clamp(final ? snap(next) : next, minimum, maximum);
    onChange?.(value, { element, final });
  }

  const handle = gestures(element, {
    onPinchStart  : () => { base = value; },
    onPinchMove   : gesture => change(base * gesture.scale, false),
    onPinchEnd    : () => change(value, true),
    onPinchCancel : () => change(value, true),
    touchAction   : 'pan-x pan-y',
  });

  return {
    destroy : () => handle.destroy(),
    get     : () => value,
    set     : next => { value = clamp(next, minimum, maximum); return value; },
  };
}

export { adjustable };
export default adjustable;
