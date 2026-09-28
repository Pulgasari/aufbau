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
| `vendor`   | next  | third-party modules (esm.sh, jsdelivr, unpkg) become local files, the importmap points at them |
| `icons`    | later | the icon names a project uses, their svgs in one local file `aufbau-icon` reads |
| `webfonts` | later | only the fonts a config names, the rest stays out |
| `prune`    | later | files nothing loads are dropped |
| `report`   | built | what still goes over the network, and the size |

## vendor

resolving esm.sh is a solved problem, the bundler uses an existing tool:

- **jspm** (`@jspm/generator`) works on importmaps directly: it traces what is
  imported, downloads it and writes an importmap to the local files. the
  project stays unbundled, it just stops leaving the device. first choice.
- **esbuild** for real bundles (one file per entry, minified), with a plugin
  that resolves through the importmap. later, as an option.

## scanning

`icons`, `webfonts` and `prune` need to know what a project uses:

- icons: `icon="set:name"` and `name=` in markup and components, the aliases of
  a project's icon data, names in data files (e.g. a registry). names built at
  runtime can not be found, they need a list in the config or the network.
- webfonts: a font chosen at runtime (a settings picker) can not be scanned
  either. the config names the fonts that ship, the settings offer only those.
- prune: the static module graph from the entries. imports by name at runtime
  (`zugriff.component(name)`, `app.view(name)`) are kept by convention: every file
  in a directory such a loader reads from (`components/*`) stays. **open**: a
  manifest instead of the convention, so a loader could be pruned too.

## size

the packages step copies whole repos, aufbau alone is 25 mb, 23 of them fonts.
`webfonts` and `prune` are what brings that down.
