// @aufbau/bundler/steps
// the steps in the order bundle() runs them. each one reads its own part of the
// config and does nothing without it.

import copy     from './copy.js';
import icons    from './icons.js';
import packages from './packages.js';
import prune    from './prune.js';
import report   from './report.js';
import start    from './start.js';
import survey   from './survey.js';
import vendor   from './vendor.js';
import webfonts from './webfonts.js';

const STEPS = [copy, packages, vendor, icons, webfonts, start, survey, prune, report];

export { copy, icons, packages, prune, report, start, STEPS, survey, vendor, webfonts };
