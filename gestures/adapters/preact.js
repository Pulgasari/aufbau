// @aufbau/gestures/preact

import { useMemo, useRef }      from 'preact/hooks';
import { compose, RECOGNIZERS } from './../index.js';

const IS_CALLBACK = /^on[A-Z]/;

// callbacks are re-read from the live options on every fire, so inline arrows in
// the render body stay correct without rebinding anything. `read` returns the
// current options object (or the current namespace object) rather than closing
// over it, which is what keeps the indirection live across re-renders.
function live (read) {
  const source = read();
  const out    = {};

  for (const key in source) {
    const value = source[key];
    out[key] =
        IS_CALLBACK.test(key) && typeof value === 'function' ? (...args) => read()?.[key]?.(...args)
      : RECOGNIZERS.includes(key) && value                   ? live(() => read()?.[key])
      :                                                        value;
  }
  return out;
}

// useGesture returns a ref callback — pass it to a dom element's `ref`, not to a
// component's. the returned function doubles as a ref object: `.current` is the
// node it is attached to and `.handle` the compose handle, so a recognizer's
// imperative api (adjustable's `set`, transformable's `set`/`get`) stays reachable
// and a second consumer can share the one ref slot.
//
// scalar options and which recognizers are active are read once, at attach time —
// to change those at runtime, remount the node via `key`.
function useGesture (options) {
  const latest   = useRef(options);
  const instance = useRef(null);
  latest.current = options;

  return useMemo(() => {
    const attach = node => {
      instance.current?.destroy();
      instance.current = null;
      attach.current   = node ?? null;
      attach.handle    = null;
      if (!node) return;

      // preact hands a function component's own instance to `ref`, never a node,
      // which would fail deep inside compose — say so here instead
      if (!(node instanceof Element)) throw new TypeError(
        'useGesture: ref must land on a dom element, got ' + (node?.constructor?.name ?? typeof node) +
        '. preact ignores refs on function components — put it on the element, or forward it.'
      );

      instance.current = compose(node, live(() => latest.current));
      attach.handle    = instance.current;
    };

    attach.current = null;
    attach.handle  = null;
    return attach;
  }, []);
}

export { compose, useGesture };
