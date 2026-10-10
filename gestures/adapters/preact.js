// @aufbau/gestures/preact
// @ts-self-types="./preact.d.ts"
// useGesture returns a ref callback for a dom element:
//
//   const ref = useGesture({ onSwipeLeft: () => next(), onTap: { input: 'touch', handler } });
//   return html`<div ref=${ref} />`;
//
// handlers are read live, inline arrows are fine and nothing rebinds on a
// render. which gestures are active and the recognizer options are read once,
// when the ref lands: remount via `key` to change them. the callback doubles as
// a ref object, `.current` is the node and `.handle` what gestures() returned.

import { useMemo, useRef } from 'preact/hooks';
import { gestures }        from './../index.js';

const HANDLER = /^on[A-Z]/;

// a handler, plain or with guards, that calls the latest one of that name
function live (read) {
  const out = {};
  for (const [key, value] of Object.entries(read())) {
    if (!HANDLER.test(key)) { out[key] = value; continue; }
    const call = (...args) => {
      const current = read()?.[key];
      return (typeof current === 'function' ? current : current?.handler)?.(...args);
    };
    out[key] = typeof value === 'function' ? call : { ...value, handler: call };
  }
  return out;
}

function useGesture (options) {
  const latest = useRef(options);
  latest.current = options;

  return useMemo(() => {
    const attach = node => {
      attach.handle?.destroy();
      attach.handle  = null;
      attach.current = node ?? null;
      if (!node) return;

      // preact hands a function component its own instance, never a node
      if (!(node instanceof Element)) throw new TypeError(
        `useGesture: the ref has to land on a dom element, got ${node?.constructor?.name ?? typeof node}`
      );

      attach.handle = gestures(node, live(() => latest.current));
    };

    attach.current = null;
    attach.handle  = null;
    return attach;
  }, []);
}

export { gestures, useGesture };
