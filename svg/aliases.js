// @aufbau/svg/aliases.js
// the aufbau default alias list, alias -> icon id. data only, it imports no
// element, so <svg-icon> can load it lazily without a package cycle.

// fetched instead of imported with { type: 'json' }: json modules are too new for
// some browsers still in use, the whole list would be missing there
const load = name => fetch(new URL(`./data/${name}.json`, import.meta.url)).then(response => response.ok ? response.json() : {});

const [brands, code, icons] = await Promise.all(['brands', 'code', 'icons'].map(load));

export { brands, code, icons };

export default { ...icons, ...code, ...brands };
