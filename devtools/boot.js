// @aufbau/devtools/boot.js
// puts <dev-tools> on the page. imported on demand, e.g. behind ?dev

import { autoloader } from '@aufbau/elements';

import settings     from './settings.js';
import { DevTools } from './dev-tools.js';

// the panels use elements of their own (write-code, data-table, …)
autoloader();

const $devtools = document.createElement('dev-tools');
document.body.append($devtools);

const panels = $devtools.panels;
const toggle = (key, force) => $devtools.toggle(key, force);

export { $devtools, DevTools, panels, settings, toggle };
