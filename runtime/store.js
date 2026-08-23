// @aufbau/runtime/store.js
//
// the runtime bundle's own aufbau-namespaced storage presets over @bunker/storage.
// exposed on the bundle as `aufbau.store`.

import { createStorage } from '@bunker/storage';

const namespace = 'aufbau';
const version   = 1;

export const 
store   = createStorage({ area: 'local',   namespace, version }),
session = createStorage({ area: 'session', namespace, version });

export default store;
