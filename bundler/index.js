// @aufbau/bundler
// turns a project that loads its code live (importmaps, package origins, cdns)
// into a self-contained directory, e.g. the www/ of a capacitor app. a pipeline
// of steps over one output directory, see concept.md for the plan:
//
//   import { bundle } from '@aufbau/bundler';
//   const { summary } = await bundle({ root: '.', out: 'build/www', copy: [...], packages: {...}, start: '/notes/' });

import { makeDirectory, removePath, resolvePath } from './shared.js';
import { STEPS } from './steps/index.js';

async function bundle (config, { steps = STEPS } = {}) {
  const root = resolvePath(config.root ?? '.');
  const out  = resolvePath(root, config.out ?? 'dist');

  const sections = new Map;
  const context  = {
    config,
    log    : message => config.quiet || console.log(`[bundler] ${message}`),
    out,
    report : (title, lines) => sections.set(title, [...(sections.get(title) ?? []), ...lines]),
    root,
  };

  await removePath(out);
  await makeDirectory(out);
  // how long each step took, for the report
  const timing = [];
  for (const step of steps) {
    const started = performance.now();
    await step(context);
    timing.push([step.name, performance.now() - started]);
  }

  const total = timing.reduce((sum, [, ms]) => sum + ms, 0);
  context.report('timing', [`${(total / 1000).toFixed(1)} s in all`, ...timing.filter(([, ms]) => ms >= 1).map(([name, ms]) => `${name} ${ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`}`)]);

  // markdown, e.g. for a ci step summary
  const summary = [...sections].map(([title, lines]) => [`#### ${title}`, '', ...lines.map(line => `- ${line}`)].join('\n')).join('\n\n');
  return { out, sections, summary };
}

export { bundle };
export default bundle;
