# @aufbau/bundler — concept

a working draft, it grows step by step. **open** marks what is not decided yet.

## goal

aufbau projects load their code live: an importmap, package origins like
code.pulgasari.dev, cdns like esm.sh, icons and fonts fetched on demand. that is
right for the web. for a packaged app (e.g. the www/ of a capacitor apk) the
same project has to run from one local directory, without a build step changing
how it is written.

the bundler takes the project as it is and produces that directory.

## shape

a pipeline of steps over one output directory. each step reads its own part of
the config and does nothing without it, so a config switches steps on by naming
them.

```js
import { bundle } from '@aufbau/bundler';

const { summary } = await bundle({
  root     : '.',
  out      : 'build/notes/www',
  copy     : [{ from: 'index.html' }, { from: '.shared' }, { from: 'apps/notes', to: 'notes' }],
  packages : { origin: 'https://code.pulgasari.dev', path: '/_pkg', source: 'build/_pkg', clone: 'https://github.com/Pulgasari/{repo}.git' },
  start    : '/notes/',
});
```

a step is `async function (context)` with `{ config, log, out, report, root }`.
`report(title, lines)` adds to the markdown summary bundle() returns.

## steps

| step       | state | does |
|------------|-------|------|
| `copy`     | built | the project's own files, everything under a source for now |
| `packages` | built | repos from a package origin become local copies, the origin is rewritten to them |
| `start`    | built | index.html moves / to the start path before the shell reads its route |
| `vendor`   | built | third-party modules (esm.sh, jsdelivr, unpkg) become local files, the importmap points at them |
| `icons`    | built | the icon ids a project uses, their svgs in one module that hands them to `SvgIcon.provide()` |
| `webfonts` | built | only the fonts a config names or the code quotes, the catalog lists only those |
| `prune`    | built | files nothing reaches are dropped |
| `report`   | built | what still goes over the network, and the size |

## vendor

the cdns are not needed to build: a cdn url names an npm package, a version and
a subpath (`esm.sh/preact@10.20.1/hooks`, `cdn.jsdelivr.net/npm/gifenc@1.0.3/+esm`,
`esm.sh/jsr/@scope/name` as `@jsr/scope__name`). the step installs those packages
from the npm registry (jsr through npm.jsr.io) and builds one browser module per
url with **esbuild**. whatever the importmap maps stays a bare import, so preact
is one instance for everything that uses it.

- importmap entries on a cdn host that a staged file names become local entries,
  handed to the pages before anything else (`inject`, default an importmap
  script; zugriff lays them over its own map through `__BOOT_CONFIG__`)
- cdn urls written out in the staged files are rewritten in place
- a url that does not build (node builtins, a package that is not on npm) stays
  as it is and is listed as not vendored

**open**: jspm (`@jspm/generator`) as an alternative that keeps the modules
unbundled. **open**: a lockfile, the versions a url does not pin (`@11`, jsr
without one) are resolved at build time.

## scanning

`icons`, `webfonts` and `prune` need to know what a project uses:

- icons: every quoted `set:name` in the staged code and data whose set is an
  iconify collection (`@iconify/collections`), which covers `icon="…"`, alias
  lists (@aufbau/svg, a project's own) and data files like a registry. the
  svgs come from `@iconify-json/<set>` on npm through `@iconify/utils`. ids built
  at runtime go into `include`, or come from the api as before.
- webfonts: the fonts in `keep`, plus every font whose name the staged css and js
  quote (a font stack, a default). a font picked at runtime can not be scanned,
  the catalog is cut down to the kept ones so a picker only offers those.
- prune: what the pages reach, followed file by file: static and literal dynamic
  imports (es-module-lexer), bare specifiers through the importmap, css
  `@import`/`url()`, and every quoted string that is an importmap key or names a
  file of the output (paths built from a constant and a literal, like a font
  catalog's `files/…`, are caught that way). importmap targets only count through
  their keys, so a map written into a page does not keep all it lists.
  a loader that imports by name is declared with the path its names stand for
  (`loaders: { 'zugriff.component': '/.shared/js/components/{name}.js' }`): the
  string arguments of its calls in reachable files keep exactly those files.
  what is loaded by a name that is never written out goes into `keep`
  (directories kept whole) or `entries`.
  a package declares the paths it loads by computed names in its own
  package.json, relative to itself (`@aufbau/api`: `"aufbau": { "bundle": { "keep":
  ["../css/"] } }`, once there is an @aufbau/css that becomes a dependency). the
  packages step collects them, prune keeps them as soon as a file of the declaring
  package is reached, so a project config does not have to know them.
  `exclude` cuts a part off on purpose, e.g. `@aufbau/devtools/boot.js` for a
  release build; a dev build leaves it in.
  `BUNDLER_WHY=<output path>` logs the chain a file was reached through.

## size

the packages step copies whole repos, aufbau alone is 25 mb, 23 of them fonts.
vendor adds what the staged files name, not what an app loads: in zugriff every
app gets ffmpeg's wasm (32 mb) because .shared names it. `webfonts` took 22 mb
off, `prune` the rest (zugriff podcasts: 63.6 -> 41.6 -> 2.9 mb without
devtools, 7.6 mb with), once the loaders replaced keeping the whole components
directory.
