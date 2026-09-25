// @aufbau/signals/TypedSignal.js

/*
anstatt wie bisher so ein chaos zu veranstalten und ein "betterSignal" zu haben,
dass dann aber als "signal" nach aussen gegeben wird unddas original signal von @preact shadowed,
und dann wiederum dessen Umbenennung erfordert, soll das jetzt sauber und klarer werden.

typedSignal und signalStore sind dann quasi die successor von betterSignal.
*/

import { BoolSignal }   from './BoolSignal.js';
import { EnumSignal }   from './EnumSignal.js';
import { MapSignal }    from './MapSignal.js';
import { ScalarSignal } from './ScalarSignal.js';
import { SetSignal }    from './SetSignal.js';
import { StringSignal } from './StringSignal.js';

function typedSignal (obj) {
  const { type, value, values } = obj;
  
  return {
    bool    : () => new   BoolSignal (value),
    boolean : () => new   BoolSignal (value),
    enum    : () => new   EnumSignal (value, values),
    map     : () => new    MapSignal (value),
    set     : () => new    SetSignal (value),
    string  : () => new StringSignal (value),
  }[type]();
}

export default typedSignal;
