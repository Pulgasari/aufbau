// @aufbau/kits/preact-htm

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU
import aufbau from './../runtime/index.js';

// ::: HTM
import htm from 'htm'; 

// ::: PREACT
import * as preactCore    from 'preact';
import * as preactHooks   from 'preact/hooks';
import * as preactSignals from '@preact/signals';
import { betterSignal, signalStore } from '@aufbau/signals';

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

aufbau.signal  = betterSignal;
aufbau.signals = obj => betterSignal({ value: obj, deep: true });

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export * from 'preact';
export * from 'preact/hooks';
export * from '@preact/signals';

export const { bunker, dom, domina, str } = aufbau;
export { aufbau, htm, html, preact, signalStore };
export default aufbau;

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

import aufbau, { dom, html, preact, str } from '@aufbau/kits/preact-htm';

await aufbau.init();

const count = signal(0);
render(html`<button onClick=${() => count.value++}>${count}</button>`, document.body);

*/
