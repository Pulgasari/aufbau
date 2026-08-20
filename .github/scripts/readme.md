# .github/scripts

Build-time scripts for the aufbau repo.

## generate-assets.mjs

Regenerates the static assets under [`@aufbau/svg`](../../svg) from the source
functions in [`@aufbau/filters`](../../filters) and
[`@aufbau/patterns`](../../patterns).

Every filter and pattern is a JS function that builds SVG. This script renders
each one in its **live** (CSS-var-driven) form and writes:

- `svg/filters/<id>.svg`, `svg/patterns/<id>.svg` — standalone assets for
  build-free consumers that reference the markup directly.
- `svg/filters/data.json5`, `svg/patterns/data.json5` — the option catalogues
  (`id`, `name`, `vars`), derived from each module's named exports.
- `svg/index.json5` — the combined `{ filters, patterns }` catalogue.

The JS is the single source of truth; the files under `svg/` are generated
output and must not be edited by hand.

```sh
npm run generate        # from the repo root
```

CI runs this via [`.github/workflows/generate-assets.yml`](../workflows/generate-assets.yml)
on any change to `filters/lib`, `patterns/lib`, the package `core.js` files, or
this script.
