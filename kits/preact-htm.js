// @aufbau/kits/preact-htm

// :::::: IMPORT ::::::::::::::::::::::::::::::::::::::::::::::::

// ::: AUFBAU
import aufbau  from '@aufbau/kits/aufbau.js';

// ::: HTM
import htm from 'htm'; 

// ::: PREACT
import * as preactCore    from 'preact';
import * as preactHooks   from 'preact/hooks';
import * as preactSignals from '@preact/signals';

// :::::: BUNDLE ::::::::::::::::::::::::::::::::::::::::::::::::

const html = htm.bind(h);

const preact = { 
  ...preactCore,
  ...preactHooks,
  ...preactSignals,
};

aufbau.htm    = htm;
aufbau.html   = html;
aufbau.preact = preact;

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export aufbau;
export htm;
export html;
export preact;

export default aufbau;

/* :::::: USAGE ::::::::::::::::::::::::::::::::::::::::::::::::: 

import aufbau, { html, preact } from '@aufbau/kits/preact-htm';

*/
