# @aufbau/bundler

turns an aufbau-project into a self-contained directory.

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
| `packages` | `packages` | `{ origin, path, source, clone }`, or by specifier: `{ importmap, sources, source, clone, pages, strict }` (concept.md) |
| `start`    | `start`    | the path `/` moves to |
| `vendor`   | `vendor`   | `{ exclude, hosts, importmap, inject, pages, path }` |
| `icons`    | `icons`    | `{ element, include, pages, path }` |
| `webfonts` | `webfonts` | `{ catalog, keep, scan }` |
| `prune`    | `prune`    | `{ entries, exclude, importmap, keep, loaders, origins, pages }` |

vendor and prune need the bundler's dependencies (`npm install` in `bundler/`).
`BUNDLER_WHY=<output path>` makes prune log why a file stays.

a package can name the paths it loads by computed names in its package.json,
relative to itself. they stay as soon as prune reaches a file of that package:

```json
"aufbau": { "bundle": { "keep": ["../css/"] } }
```
vendor and icons install what they need from npm into the system temp dir.

`bundle()` returns `{ out, sections, summary }`, the summary as markdown: what is
local, what was vendored, the files in and out per extension, their size with
gzip and brotli, the areas (own files, packages, vendored modules), the largest
files, duplicate contents, what still goes over the network and the time of
every step.
