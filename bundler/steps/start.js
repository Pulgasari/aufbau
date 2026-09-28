// @aufbau/bundler/steps/start.js
// the path the output's index.html moves to before anything else runs, for a
// shell that reads its route from the location and is opened at / (capacitor
// opens https://localhost/). a query goes along, `/notes/?dev` opens with it:
//
//   start: '/notes/'

import { joinPath, readText, writeText } from './../shared.js';

async function start ({ config, log, out }) {
  if (!config.start) return;
  const script = `<script>if (location.pathname === '/') history.replaceState(null, '', ${JSON.stringify(config.start)} + location.hash);</script>`;
  const index  = joinPath(out, 'index.html');
  await writeText(index, (await readText(index)).replace(/<head>/, `<head>\n  ${script}`));
  log(`start ${config.start}`);
}

export { start };
export default start;
