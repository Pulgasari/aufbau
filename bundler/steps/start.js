// @aufbau/bundler/steps/start.js
// the path the output's index.html moves to before anything else runs, for a
// shell that reads its route from the location and is opened at / (capacitor
// opens https://localhost/):
//
//   start: '/notes/'

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function start ({ config, log, out }) {
  if (!config.start) return;
  const script = `<script>if (location.pathname === '/') history.replaceState(null, '', ${JSON.stringify(config.start)} + location.search + location.hash);</script>`;
  const index  = join(out, 'index.html');
  await writeFile(index, (await readFile(index, 'utf8')).replace(/<head>/, `<head>\n  ${script}`));
  log(`start ${config.start}`);
}

export { start };
export default start;
