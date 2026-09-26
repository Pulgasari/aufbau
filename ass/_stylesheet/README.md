# ass/_stylesheet

parked, not part of @aufbau/ass: what was worth keeping of the retired
@aufbau/stylesheet. its string and regex skills cover what ass still lists as
spec, so they are the starting point once that gets built on the ass ast.

| file         | covers                                                         |
|--------------|----------------------------------------------------------------|
| config.js    | `@aufbau-config` (charset, font, import, theme)                |
| media.js     | `@aufbau-media` breakpoints                                    |
| tokens.js    | `@aufbau colors` pairs and `aufbau-colors`                     |
| filter.js    | `aufbau-filter`, defs injected by the async pre-pass            |
| icon.js      | `aufbau-icon`                                                  |
| pattern.js   | `aufbau-pattern`, the prebuilt data-uri                        |
| webfont.js   | `aufbau-webfont`                                               |
| layout.js    | `aufbau-flex`, `aufbau-grid` shorthands                         |
| center.js    | `aufbau-center`                                                |
| dirty.js     | bare values that name their property (`pointer;`, `flex;`)      |
| parse.js     | comment safe block helpers the at-rule parsers share           |
| pipeline.js  | the old entry, the order the skills ran in                     |
| syntax.md    | the old readme, the syntax of all of the above                  |
| brainstorm.md| notes                                                          |

left behind: `@aufbau-trait` / `aufbau-use` (ass has `@mixin` and `use:`) and
`aufbau-unset` (ass has `@value unset : margin padding`).

the imports inside still point at the old layout and are not meant to run as
they are. `config.js` still imports themes from the removed `css/themes/`,
css/themes.css and `--theme` replace them.
