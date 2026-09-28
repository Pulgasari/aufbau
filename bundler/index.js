// @aufbau/bundler
// turns a project that loads its code live (importmaps, package origins, cdns)
// into a self-contained directory, e.g. the www/ of a capacitor app. a pipeline
// of steps over one output directory, see concept.md for the plan:
//
//   import { bundle } from '@aufbau/bundler';
//   const { summary } = await bundle({ root: '.', out: 'build/www', copy: [...], packages: {...}, start: '/notes/' });

import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { STEPS } from './steps/index.js';

async function bundle (config, { steps = STEPS } = {}) {
  const root = resolve(config.root ?? '.');
  const out  = resolve(root, config.out ?? 'dist');

  const sections = new Map;
  const context  = {
    config,
    log    : message => config.quiet || console.log(`[bundler] ${message}`),
    out,
    report : (title, lines) => sections.set(title, [...(sections.get(title) ?? []), ...lines]),
    root,
  };

  await rm(out, { force: true, recursive: true });
  await mkdir(out, { recursive: true });
  for (const step of steps) await step(context);

  // markdown, e.g. for a ci step summary
  const summary = [...sections].map(([title, lines]) => [`#### ${title}`, '', ...lines.map(line => `- ${line}`)].join('\n')).join('\n\n');
  return { out, sections, summary };
}

export { bundle };
export default bundle;
