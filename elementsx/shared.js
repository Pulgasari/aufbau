// shared.js

export { coerce, toBoolean } from '@pulgasari/coerce';
export { Logger }            from '@pulgasari/logger';
export { default as shift }  from '@pulgasari/shift';

export * from '@pulgasari/is';
export * from '@pulgasari/str';

export const log  = new Logger({ prefix: '@aufbau/elements' });

import delegateEvent from '@domina/methods/delegateEvent.js';
import emitEvent     from '@domina/methods/emitEvent.js';
import hasAttr       from '@domina/methods/hasAttr.js';
import offEvent      from '@domina/methods/offEvent.js';
import onEvent       from '@domina/methods/onEvent.js';
import setAttr       from '@domina/methods/setAttr.js';

export const dom = {
  delegateEvent,
  emitEvent,
  hasAttr,
  offEvent,
  onEvent,
  setAttr,
};

