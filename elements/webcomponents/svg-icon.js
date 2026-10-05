import { AufbauElement } from '@aufbau/element';

const API      = 'https://api.iconify.design';
const DEFAULTS = '@aufbau/svg/aliases.js';
const FALLBACK = 'material-symbols:help';

// prefixes served from files instead of iconify, resolved through the importmap
const LOCAL = { aufbau: '@aufbau/svg/icons/' };

const aliases  = new Map;
const provided = new Map;
const warned   = new Set;

let defaults       = null;
let defaultsLoaded = false;

const warnOnce = (key, message) => {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[svg-icon] ${message}`);
};

export function resolveIcon (icon) {
  if (!icon) return null;
  const value = String(icon).trim().replace('/', ':');
  return value.includes(':') ? value : aliases.get(value) ?? null;
}

// base + name -> the url of name.svg through the importmap, null without an entry
export function localUrl (base, name) {
  try { return import.meta.resolve(`${base}${name}.svg`); }
  catch {
    warnOnce(base, `"${base}" could not be resolved, add it to the importmap.`);
    return null;
  }
}

export function iconUrl (id) {
  const svg = provided.get(id);
  if (svg) return `data:image/svg+xml,${encodeURIComponent(svg)}`;

  const [collection, ...rest] = id.split(':');
  const name = rest.join(':');
  if (!collection || !name) return null;
  if (LOCAL[collection]) return localUrl(LOCAL[collection], name);
  return `${API}/${encodeURIComponent(collection)}:${encodeURIComponent(name)}.svg`;
}

export default class SvgIcon extends AufbauElement {
  static attr = {
    color : String,
    icon  : String,
    label : String,
    mode  : { type: String, default: 'mask', values: ['mask', 'image'] },
    size  : String,
  };

  static styles = `svg-icon {
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

  static register (map) {
    for (const [alias, id] of Object.entries(map ?? {})) aliases.set(alias, id);
    return this;
  }

  static provide (svgs) {
    for (const [id, svg] of Object.entries(svgs ?? {})) provided.set(id, svg);
    return this;
  }

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

    if (icon && !id && !defaultsLoaded) {
      SvgIcon.loadDefaults().then(() => this.update());
      return;
    }

    if (icon && !id) {
      warnOnce(icon, `unknown icon "${icon}", showing ${FALLBACK}.`);
      id = FALLBACK;
    }

    const url = id ? iconUrl(id) : null;

    this.setVar({ '--icon-color': color, '--icon-size': size, '--icon-url': url && `url("${url}")` });

    if (this.internals) {
      this.internals.role       = label ? 'img' : null;
      this.internals.ariaLabel  = label || null;
      this.internals.ariaHidden = label ? null : 'true';
    }
  }
}

SvgIcon.init();
