// @aufbau/store
// @ts-self-types="./index.d.ts"

/*
  aufbau's persistence preset. no storage logic lives here — that is all
  @bunker/storage. what this file owns is the aufbau-specific part: one namespace,
  one version, and the `persist` attribute contract the elements speak.
*/

import { codecs } from '@bunker/core';
import { createStorage } from '@bunker/storage';
import { createLogger } from '@aufbau/js';

const NAMESPACE = 'aufbau';
const VERSION   = 1;

const log = createLogger('aufbau-store');

const onError = ({ error, key, operation }) => log.warn(`could not ${operation} "${key}":`, error);

// :::::: STORES ::::::::::::::::::::::::::::::::::::::::::::::::

const shared = { namespace: NAMESPACE, onError, version: VERSION };

/** survives the tab. themes, skins, control values. */
export const store = createStorage({ ...shared, area: 'local' });

/** dies with the tab. */
export const session = createStorage({ ...shared, area: 'session' });

/*
  compiled css, keyed by href.

  kept out of the json store on purpose: the boot path reads a whole stylesheet
  synchronously before the first paint, and json would make it pay for quoting and
  escaping a value that is already a string. separate namespace so a sweep of one
  never touches the other.
*/
export const sheets = createStorage({
  area      : 'local',
  codec     : codecs.text,
  namespace : `${NAMESPACE}:sheets`,
  onError,
  version   : VERSION,
});

/*
  which stylesheets a given page uses, keyed by pathname.

  boot.js runs before the <link> elements exist — it is the first thing in <head>,
  which is the whole point — so it cannot discover them from the dom. this manifest
  is how it knows what to inject, and in which order.
*/
export const pages = createStorage({
  area      : 'local',
  namespace : `${NAMESPACE}:pages`,
  onError,
  version   : VERSION,
});

/** the exact key layout boot.js reads. it is a standalone classic script and
    cannot import any of this, so the two must be kept in step. */
export const BOOT_KEYS = {
  pages  : pages.keyspace.prefix,
  sheets : sheets.keyspace.prefix,
};

// :::::: PERSIST ATTRIBUTE :::::::::::::::::::::::::::::::::::::

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
  if (spec === null || spec === undefined) return null;

  const raw       = String(spec).trim();
  const isSession = raw === SESSION || raw.startsWith(`${SESSION}:`);
  const named     = isSession ? raw.slice(SESSION.length + 1) : raw;
  const key       = named || name || id;

  if (!key) return null;
  return { key, store: isSession ? session : store };
}

// :::::: MAINTENANCE :::::::::::::::::::::::::::::::::::::::::::

/** drops what an older version of aufbau left behind. cheap, worth calling at boot. */
export function sweep () {
  return pages.sweepSync() + session.sweepSync() + sheets.sweepSync() + store.sweepSync();
}

export default store;
