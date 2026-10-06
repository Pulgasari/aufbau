// @aufbau/bundler/steps/survey.js
// what the output holds before prune drops what nothing reaches, so the report
// can tell what went in from what came out.

import { inventory } from './../shared.js';

async function survey (context) {
  context.input = await inventory(context.out);
}

export { survey };
export default survey;
