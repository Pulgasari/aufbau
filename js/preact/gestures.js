// preact-gestures.js — thin wrapper around gestures.js

import { useRef, useMemo } from 'preact/hooks';
import { gestures }        from './../dom/gestures.js';

let IS_CALLBACK = /^on[A-Z]/;

/* useGesture returns a ref callback, not a props bag:

   let ref = useGesture({ onClick, onLongClick, onSwipeLeft, onAdjust });
   return <div ref={ref} />;

   Callbacks are read through a ref on every fire, so inline arrow functions
   are fine and nothing rebinds on re-render. Scalar options (threshold, min,
   max, …) and *which* gestures are active are read once, at attach time — if
   that has to change at runtime, remount the node via `key`. */
export let useGesture = options => {
  let latest   = useRef(options);
  let instance = useRef(null);
  latest.current = options;

  return useMemo(() => node => {
    instance.current?.destroy();
    instance.current = null;
    if (!node) return;

    let forwarded = {};
    for (let key in latest.current) {
      let value = latest.current[key];
      forwarded[key] = IS_CALLBACK.test(key) && typeof value === 'function'
        ? (...args) => latest.current[key]?.(...args)
        : value;
    }

    instance.current = gestures(node, forwarded);
  }, []);
};

export { gestures } from './../dom/gestures.js';
