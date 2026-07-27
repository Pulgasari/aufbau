// @aufbau/kit/worker.js

import { handleStylesheetFetch } from '@aufbau/plugins/worker';

export * from '@aufbau/plugins/worker';

/**
 * Combined master fetch handler for Service Workers.
 * Checks all registered Aufbau plugins in sequence.
 * 
 * @param {FetchEvent} event
 * @returns {Promise<Response>|null}
 */
export async function handleAufbauFetch (event) {
  // 1. Check stylesheet plugin
  const stylesheetResponse = await handleStylesheetFetch(event);
  if (stylesheetResponse) return stylesheetResponse;

  return null;
}
