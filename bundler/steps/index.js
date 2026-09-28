// @aufbau/bundler/steps
// the steps in the order bundle() runs them. each one reads its own part of the
// config and does nothing without it.

import copy     from './copy.js';
import packages from './packages.js';
import report   from './report.js';
import start    from './start.js';

const STEPS = [copy, packages, start, report];

export { copy, packages, report, start, STEPS };
