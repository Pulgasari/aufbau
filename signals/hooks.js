// @aufbau/signals/hooks.js

// :::::: IMPORT

import betterSignal from './betterSignal.js';
import querySignal  from './querySignal.js';
import { useRef }   from 'preact/hooks';

// ::::::

export function useBetterSignal (input) {
  let ref = useRef(null);
  if (ref.current === null) ref.current = betterSignal(input);
  return ref.current;
};

export function useQuerySignal (fetcher, options) {
  let ref = useRef(null);
  if (ref.current === null) ref.current = querySignal(fetcher, options);    
  return ref.current;
};
