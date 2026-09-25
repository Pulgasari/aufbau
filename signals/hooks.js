// @aufbau/signals/hooks.js

// preact's own useSignal, useComputed and useSignalEffect are re-exported by
// index.js as they are. these add one hook per signal type

import { boolSignal }   from './BoolSignal.js';
import { enumSignal }   from './EnumSignal.js';
import { mapSignal }    from './MapSignal.js';
import { numberSignal } from './NumberSignal.js';
import { setSignal }    from './SetSignal.js';
import { stringSignal } from './StringSignal.js';

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
useTypedSignal  = createUseHook (typedSignal),
useQuerySignal  = createUseHook (querySignal),
useBoolSignal   = createUseHook (boolSignal),
useEnumSignal   = createUseHook (enumSignal),
useMapSignal    = createUseHook (mapSignal),
useNumberSignal = createUseHook (numberSignal),
useSetSignal    = createUseHook (setSignal),
useStringSignal = createUseHook (stringSignal);
