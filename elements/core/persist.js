// @aufbau/elements/core/persist.js
//
// the `persist` attribute contract the controls speak, plus the two stores it
// resolves to. storage logic itself is all @bunker/storage — this owns only the
// aufbau-specific part: one namespace, one version, and the attribute grammar.

import { createStorage } from '@bunker/storage';
import { createLogger }  from '@aufbau/js';

const namespace = 'aufbau';
const version   = 1;

const log     = createLogger('aufbau-persist');
const onError = ({ error, key, operation }) => log.warn(`could not ${operation} "${key}":`, error);

export const store   = createStorage({ area: 'local',   namespace, onError, version }); // survives the tab
export const session = createStorage({ area: 'session', namespace, onError, version }); // dies with the tab

const SESSION = 'session';

/*
  resolves the `persist` attribute of a control to a store and a key.

    persist                  local,   key from name or id
    persist="session"        session, key from name or id
    persist="theme"          local,   key "theme"
    persist="session:theme"  session, key "theme"

  returns null when there is nothing to store under, which is not an error: a
  control can carry `persist` before it has been given a name.
*/
export function resolvePersist (spec, { id = '', name = '' } = {}) {
  if (spec == null) return null;

  const raw       = String(spec).trim();
  const isSession = raw === SESSION || raw.startsWith(`${SESSION}:`);
  const named     = isSession ? raw.slice(SESSION.length + 1) : raw;
  const key       = named || name || id;

  if (!key) return null;
  return { key, store: isSession ? session : store };
}
