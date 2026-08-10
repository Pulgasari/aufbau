// @aufbau/stylesheet/skills/pattern-load.js

import { importFile } from '@aufbau/import';

const SVG_SPECIFIER = '@aufbau/svg/patterns/';
const REGEX_USAGE   = /aufbau-pattern:\s*([a-z0-9-]+)/gi;

// module-level cache: a given pattern svg is fetched once per session, not once
// per compile. keys are ids, values are raw svg strings.
const cache = new Map();

/**
 * scans ass source for every aufbau-pattern usage and loads the referenced raw
 * svgs, returning an id -> svg map for the synchronous transform to substitute
 * into. runs before runPipeline; the only async step in the compile.
 *
 * @param {string} code raw ass source
 * @returns {Promise<Record<string, string>>}
 */
export async function loadPatternSvgs (code) {
  const ids = new Set();
  for (const m of code.matchAll(REGEX_USAGE)) ids.add(m[1]);

  const out = {};
  await Promise.all([...ids].map(async id => {
    if (!cache.has(id)) {
      const url = import.meta.resolve(`${SVG_SPECIFIER}${id}.svg`);
      cache.set(id, await importFile(url, 'raw'));
    }
    out[id] = cache.get(id);
  }));
  return out;
}
