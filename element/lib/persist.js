import { createStorage } from '@bunker/storage';
import { Logger }        from '@pulgasari/logger';

const namespace = 'aufbau';
const version   = 1;

const log     = new Logger({ prefix: 'aufbau-persist' });
const onError = ({ error, key, operation }) => log.warn(`could not ${operation} "${key}":`, error);

export const store   = createStorage({ area: 'local',   namespace, onError, version }); // survives the tab
export const session = createStorage({ area: 'session', namespace, onError, version }); // dies with the tab

const SESSION = 'session';

export function resolvePersist (spec, { id = '', name = '' } = {}) {
  if (spec == null) return null;

  const raw       = String(spec).trim();
  const isSession = raw === SESSION || raw.startsWith(`${SESSION}:`);
  const named     = isSession ? raw.slice(SESSION.length + 1) : raw;
  const key       = named || name || id;

  if (!key) return null;
  return { key, store: isSession ? session : store };
}
