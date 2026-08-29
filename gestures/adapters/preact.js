// @aufbau/gestures/preact
// thin preact binding over core.js. useGesture returns a ref callback, not a
// props bag:
//
//   const ref = useGesture({ onClick, onSwipeLeft, onAdjust });
//   return html`<div ref=${ref} />`;
//
// callbacks are read through a ref on every fire, so inline arrows are fine and
// nothing rebinds on re-render. scalar options (threshold, min, max, …) and
// which recognizers are active are read once, at attach time — to change those
// at runtime, remount the node via `key`.

import { useMemo, useRef } from 'preact/hooks';
import { compose }         from './../index.js';

const IS_CALLBACK = /^on[A-Z]/;

export function useGesture (options) {
  const latest   = useRef(options);
  const instance = useRef(null);
  latest.current = options;

  return useMemo(() => node => {
    instance.current?.destroy();
    instance.current = null;
    if (!node) return;

    const forwarded = {};
    for (const key in latest.current) {
      const value = latest.current[key];
      forwarded[key] = IS_CALLBACK.test(key) && typeof value === 'function'
        ? (...args) => latest.current[key]?.(...args)
        : value;
    }
    instance.current = compose(node, forwarded);
  }, []);
}

export { compose } from './../index.js';
