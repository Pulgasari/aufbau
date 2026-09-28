# @aufbau/bundler

turns a project that loads its code live (importmap, package origins, cdns) into
one self-contained directory, e.g. the www/ of a capacitor app. early: see
[concept.md](concept.md) for the steps and what comes next.

## usage

```js
import { bundle } from '@aufbau/bundler';

const { summary } = await bundle({
  root     : '.',
  out      : 'build/notes/www',
  copy     : [{ from: 'index.html' }, { from: '.shared' }, { from: 'apps/notes', to: 'notes' }],
  packages : { origin: 'https://code.pulgasari.dev', path: '/_pkg', source: 'build/_pkg', clone: 'https://github.com/Pulgasari/{repo}.git' },
  start    : '/notes/',
  vendor   : { importmap: { imports: { preact: 'https://esm.sh/preact@10.20.1' } } },
});
```

or with a config module, whose default export is the config or a function of the
`key=value` arguments:

```sh
node aufbau/bundler/cli.js bundler.config.js slug=notes out=build/notes/www
```

## config

| key        | step       | |
|------------|------------|---|
| `root`     |            | the project directory, default `.` |
| `out`      |            | the output directory, emptied first, default `dist` |
| `quiet`    |            | no log lines |
| `copy`     | `copy`     | `[{ from, to }]`, relative to `root` and `out` |
| `packages` | `packages` | `{ origin, path, source, clone }` |
| `start`    | `start`    | the path `/` moves to |
| `vendor`   | `vendor`   | `{ exclude, hosts, importmap, inject, pages, path }` |

the vendor step needs the bundler's dependencies (`npm install` in `bundler/`).

`bundle()` returns `{ out, sections, summary }`, the summary as markdown (what is
local, what was vendored, what still goes over the network, the size).
