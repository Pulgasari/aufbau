// <aufbau-icon>
// pure css, no markup: the host is a box masked (or painted) by the icon svg.
//
// `icon` takes an iconify id ('lucide:save', 'lucide/save') or an alias ('save').
// aliases come from AufbauIcon.register(). the aufbau default list lives in
// @aufbau/icons and is loaded lazily the first time an unknown alias shows up,
// so elements carry no icon data and pages that only use full ids never load it.
//
// the svg itself comes from the iconify api unless it was handed over with
// AufbauIcon.provide() first. that is the hook for offline bundles, see the
// bundling notes in @aufbau/icons/README.md.

import { AufbauElement } from './core/index.js';

const API      = 'https://api.iconify.design';
const DEFAULTS = '@aufbau/icons/aliases.js';
const FALLBACK = 'material-symbols:help';

const aliases  = new Map;
const provided = new Map;
const warned   = new Set;

let defaults       = null;
let defaultsLoaded = false;

const warnOnce = (key, message) => {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[aufbau-icon] ${message}`);
};

/** 'set:name' | 'set/name' | alias -> 'set:name', or null when it is an alias not (yet) known */
export function resolveIcon (icon) {
  if (!icon) return null;
  const value = String(icon).trim().replace('/', ':');
  return value.includes(':') ? value : aliases.get(value) ?? null;
}

/** css ready url for an iconify id. a provided svg wins over the api */
export function iconUrl (id) {
  const svg = provided.get(id);
  if (svg) return `data:image/svg+xml,${encodeURIComponent(svg)}`;

  // collection and name are encoded separately, the colon is part of the iconify path
  const [collection, ...rest] = id.split(':');
  const name = rest.join(':');
  return collection && name ? `${API}/${encodeURIComponent(collection)}:${encodeURIComponent(name)}.svg` : null;
}

export default class AufbauIcon extends AufbauElement {
  static attr = {
    color : String,
    icon  : String,
    // an icon without a label is decoration and hidden from assistive tech
    label : String,
    // mask recolours the svg with currentColor and throws its own colours away,
    // image keeps them. multicolour art (flags, logos, emoji) needs image
    mode  : { type: String, default: 'mask', values: ['mask', 'image'] },
    size  : String,
  };

  // without the mask nothing is ever visible, so this is structure, not theming.
  // no url yet (alias still loading) masks everything away instead of showing a solid box
  static styles = `aufbau-icon {
    background-color : var(--icon-color, currentColor);
    block-size       : var(--icon-size, 1em);
    display          : inline-block;
    flex             : none;
    inline-size      : var(--icon-size, 1em);
    mask             : var(--icon-url, linear-gradient(transparent, transparent)) center / 100% 100% no-repeat;
    vertical-align   : var(--icon-align, -0.125em);

    &[mode="image"] {
      background : var(--icon-url, none) center / contain no-repeat;
      mask       : none;
    }

    &:not([icon]) { display: none; }
  }`;

  // :::::: REGISTRY ::::::::::::::::::::::::::::::::::::::::::::

  /** adds aliases, { save: 'material-symbols:file-save', … }. later calls override earlier ones */
  static register (map) {
    for (const [alias, id] of Object.entries(map ?? {})) aliases.set(alias, id);
    return this;
  }

  /** hands over svg markup by iconify id, those icons never touch the network */
  static provide (svgs) {
    for (const [id, svg] of Object.entries(svgs ?? {})) provided.set(id, svg);
    return this;
  }

  // once per page. resolves either way, a missing @aufbau/icons only means no default aliases
  static loadDefaults () {
    return defaults ??= import(DEFAULTS)
      .then(module => { this.register(module.default); })
      .catch(() => warnOnce(DEFAULTS, `default aliases unavailable, "${DEFAULTS}" could not be imported.`))
      .finally(() => { defaultsLoaded = true; });
  }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  sync () {
    const { color, icon, label, size } = this.getAttr();
    let id = resolveIcon(icon);

    // an unknown alias: fetch the defaults once, then try again. until then nothing is painted
    if (icon && !id && !defaultsLoaded) {
      AufbauIcon.loadDefaults().then(() => this.update());
      return;
    }

    if (icon && !id) {
      warnOnce(icon, `unknown icon "${icon}", showing ${FALLBACK}.`);
      id = FALLBACK;
    }

    const url = id ? iconUrl(id) : null;

    this.style.setProperty('--icon-url',   url ? `url("${url}")` : '');
    this.style.setProperty('--icon-size',  size  || '');
    this.style.setProperty('--icon-color', color || '');

    if (this.internals) {
      this.internals.role       = label ? 'img' : null;
      this.internals.ariaLabel  = label || null;
      this.internals.ariaHidden = label ? null : 'true';
    }
  }
}

AufbauIcon.init();
