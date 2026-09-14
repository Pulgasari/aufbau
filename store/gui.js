// @aufbau/store/gui
// the toElement adapter: renders a store key as an @aufbau/gui control and
// two-way binds it. optional subpath so the core stays dom/gui-free; importing
// it registers store.toElement(). browser-only.

import { field, readValues }  from '@aufbau/gui';
import { effect }             from './reactive.js';
import { useElementAdapter }  from './index.js';

// carrier type/spec -> gui field descriptor
function fieldSpecOf (carrier, opts) {
  const { type, spec } = carrier;
  const base = { label: opts.label ?? undefined };
       if (type === 'bool')   return { ...base, type: 'boolean' };
  else if (type === 'number') return { ...base, type: 'number', min: spec.min, max: spec.max, step: spec.step };
  else if (type === 'enum')   return { ...base, values: spec.values };
  return { ...base, type: 'text' };
}

export function toElement (store, key, opts = {}) {
  const carrier = store.leaf(key);
  if (!carrier) throw new Error(`[@aufbau/store] no such key: "${key}"`);

  const fieldSpec = fieldSpecOf(carrier, opts);
  const element   = field(key, fieldSpec, store.get(key));   // <label> + aufbau-* control
  const spec      = { [key]: fieldSpec };

  // store -> control
  effect(() => {
    const value   = store.get(key);
    const control = element.querySelector?.('[name]');
    if (!control) return;
    if (fieldSpec.type === 'boolean') control.checked = Boolean(value);
    else if (control.value !== String(value)) control.value = value;
  });

  // control -> store
  const push = () => { const value = readValues(element, spec)[key]; if (value !== undefined) store.set(key, value); };
  element.addEventListener('change', push);
  element.addEventListener('input', push);

  return element;
}

useElementAdapter(toElement);
export default toElement;
