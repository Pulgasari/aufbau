// @aufbau/kits/preact-htm

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU
import aufbau  from './aufbau.js';

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

export { aufbau, htm, html, preact };

export default aufbau;

/* :::::: USAGE :::::::::::::::::::::::::::::::::::::::::::::::::

import aufbau, { html, signal, render } from '@aufbau/kits/preact-htm';

await aufbau.init();

const count = signal(0);
render(html`<button onClick=${() => count.value++}>${count}</button>`, document.body);

*/
