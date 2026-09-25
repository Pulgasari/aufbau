// @aufbau/signals/hooks.js

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

function useTypedSignal (typedSignal) {
  return function (...args) {
    let ref = useRef(null);
    if (ref.current === null) ref.current = typedSignal (...args);
    return ref.current;
  }
}

const
useBoolSignal   = useTypedSignal (boolSignal),
useEnumSignal   = useTypedSignal (enumSignal),
useMapSignal    = useTypedSignal (mapSignal),
useSetSignal    = useTypedSignal (setSignal),
useStringSignal = useTypedSignal (stringSignal);
