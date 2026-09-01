// @aufbau/signals/hooks.js
// preact bindings — create the carrier once per component instance and keep it stable
// across renders via a ref.

import { betterSignal } from './BetterSignal.js';
import { querySignal }  from './QuerySignal.js';
import { useRef }       from './shared.js';

export function useSignal (input) {
  let ref = useRef(null);
  if (ref.current === null) ref.current = betterSignal(input);
  return ref.current;
}

export function useQuerySignal (fetcher, options) {
  let ref = useRef(null);
  if (ref.current === null) ref.current = querySignal(fetcher, options);
  return ref.current;
}
