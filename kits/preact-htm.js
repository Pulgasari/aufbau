// @aufbau/kits/preact-htm

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU
import aufbau  from './aufbau.js';
import { betterSignal } from '../js/preact/x.js';

// single scalar signal
aufbau.signal = betterSignal;

// batch: object in, deep-node proxy out.
// each key becomes an independent leaf signal, accessible without .value:
//   state.currentRoute        -> get
//   state.currentRoute = '..' -> set
aufbau.signals = (obj) => betterSignal({ value: obj, deep: true });


// ::: HTM
import htm from 'htm'; 

// ::: PREACT
import * as preactCore    from 'preact';
import * as preactHooks   from 'preact/hooks';
import * as preactSignals from '@preact/signals';

// :::::: BUNDLE ::::::::::::::::::::::::::::::::::::::::::::::::

const preact = { 
  ...preactCore,
  ...preactHooks,
  ...preactSignals,
};

const html = htm.bind(preact.h);

Object.assign(
  aufbau, 
  preact, // flattened into aufbauObj
  { htm, html, preact }
);

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export * from 'preact';
export * from 'preact/hooks';
export * from '@preact/signals';

const dom = aufbau.domina;

export { aufbau, dom, htm, html, preact };

export default aufbau;

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

import aufbau, { html, signal, render } from '@aufbau/kits/preact-htm';

await aufbau.init();

const count = signal(0);
render(html`<button onClick=${() => count.value++}>${count}</button>`, document.body);

*/
