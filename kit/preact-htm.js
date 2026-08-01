// @aufbau/kit

import * as preactCore    from 'preact';
import * as preactHooks   from 'preact/hooks';
import * as preactSignals from '@preact/signals';

const preact = {
  ...preactCore,
  ...preactHooks,
  ...preactSignals,
};

export {
  preact,
}
