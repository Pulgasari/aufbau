// @aufbau/filters/lib/registry.js
// lazy filter registry. static metadata (id, name, vars, backends) comes from
// ../manifest.js — one cheap file — while each filter's render/css/canvas/webgl
// implementation loads on demand from ./<id>.js and is cached. this is why the
// render path (filterSvg/applyFilter/filterCanvas/…) is async: importing the
// barrel, listing the catalogue or probing backends no longer pulls in every
// implementation module.

import { manifest } from '../manifest.js';

export { manifest };

// static metadata for an id: { id, name, vars, backends } where backends holds raw
// presence flags { svg, css, canvas, webgl }. synchronous, no implementation loaded.
export function metaOf (id) {
  const meta = manifest[id];
  if (!meta) throw new Error(`[@aufbau/filters] unknown filter "${id}"`);
  return meta;
}

// the full registry entry for an id, implementation loaded once and cached:
// { id, name, vars, render, css, canvas, webgl }. render is the svg backend (the
// default export unless the module provides a canvas/webgl backend, then its named
// `svg` export if any); css/canvas/webgl are their backends or null.
const loaded = new Map();
export function load (id) {
  metaOf(id); // validate before importing
  if (!loaded.has(id)) {
    loaded.set(id, import(`./${id}.js`).then(m => ({
      id     : m.id,
      name   : m.name,
      vars   : m.vars,
      render : m.svg ?? ((m.canvas || m.webgl) ? null : m.default) ?? null,
      css    : m.css ?? null,
      canvas : m.canvas ?? null,
      webgl  : m.webgl ?? null,
    })));
  }
  return loaded.get(id);
}

// which backends can realise a filter, from the static manifest (no load). canvas is
// true for a dedicated imageData backend OR any bridge-able one (svg/css/webgl) — i.e.
// filterCanvas can always render it. single source of truth for supports()/list().
export const backendsOf = ({ backends: b }) => ({
  css    : !!b.css,
  svg    : !!b.svg,
  canvas : !!b.canvas || !!b.svg || !!b.css || !!b.webgl,
  webgl  : !!b.webgl,
});
