// @aufbau/signals/hooks.js

import { boolSignal }   from './BoolSignal.js';
import { enumSignal }   from './EnumSignal.js';
import { mapSignal }    from './MapSignal.js';
import { setSignal }    from './SetSignal.js';
import { stringSignal } from './StringSignal.js';

import { betterSignal } from './BetterSignal.js';
import { querySignal }  from './QuerySignal.js';
import { typedSignal }  from './TypedSignal.js';
import { useRef }       from './shared.js';

function createUseHook (signalType) {
  return function (...args) {
    let ref = useRef(null);
    if (ref.current === null) ref.current = signalType (...args);
    return ref.current;
  }
}

export const
useSignal       = createUseHook (betterSignal), // deprecated form
useTypedSignal  = createUseHook (typedSignal),
useQuerySignal  = createUseHook (querySignal),
useBoolSignal   = createUseHook (boolSignal),
useEnumSignal   = createUseHook (enumSignal),
useMapSignal    = createUseHook (mapSignal),
useSetSignal    = createUseHook (setSignal),
useStringSignal = createUseHook (stringSignal);
