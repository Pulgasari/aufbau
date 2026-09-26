// @aufbau/api/gestalt.js
// the appearance of a page as a whole: theme, mode, look, layout and skin, one
// controller for all of them.
//
//   await gestalt.set({ theme: 'oled', mode: 'dark', look: 'rounded' });
//   gestalt.get('theme')    // 'oled'
//   gestalt.colors()        // { accent, bg, fg } as the browser computed them
//   await gestalt.themes()  // the preset names of css/themes.css
//
// theme and mode are custom properties on the root, which css/themes.css reads.
// so a theme is a preset name or any css color: 'dracula', 'teal', '#ff8800'.
// look, layout and skin are stylesheets, one per kind, swapped in place, false
// removes one.

export const CSS_PATH = 'https://code.pulgasari.dev/aufbau/css';

export const MODES   = ['auto', 'dark', 'light'];
export const LAYOUTS = ['landing', 'mobile-basic', 'three-panels'];
export const LOOKS   = ['flat', 'rounded'];
export const SKINS   = ['monochrome'];

// the properties themes.css reads, mirrored as data-* for selectors
const TOKENS = { mode: 'theme-mode', theme: 'theme' };

// the folder of each stylesheet kind
const SHEETS = { layout: 'layouts', look: 'looks', skin: 'skins' };

const current = {};

const domina = name => import(`@domina/methods/${name}.js`).then(module => module[name] ?? module.default);

// :::::: TOKENS

function setToken (name, value) {
  const root = document.documentElement;
  const data = name.replace(/-(\w)/g, (_, char) => char.toUpperCase());

  if (value == null || value === false) {
    root.style.removeProperty(`--${name}`);
    delete root.dataset[data];
    return;
  }

  root.style.setProperty(`--${name}`, value);
  root.dataset[data] = value;
}

const readToken = name => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || null;

// :::::: SHEETS

async function setSheet (kind, name) {
  const key = `gestalt:${kind}`;
  if (!name) return (await domina('releaseStylesheet'))(key);
  return (await domina('adoptStylesheet'))(`${CSS_PATH}/${SHEETS[kind]}/${name}.css`, { key, replace: true });
}

// :::::: THEMES
// the presets are read off the container queries of css/themes.css, so the
// stylesheet stays the only place that lists them. loaded once, on first ask

const PRESET = /style\(\s*--theme\s*:\s*([\w-]+)\s*\)/;

// @layer and @media nest rules, an @import carries its own sheet
function presetsOf (rules, names = []) {
  for (const rule of rules) {
    const match = rule instanceof CSSContainerRule && rule.conditionText.match(PRESET);
    if (match) names.push(match[1]);
    else if (rule.cssRules ?? rule.styleSheet?.cssRules) presetsOf(rule.cssRules ?? rule.styleSheet.cssRules, names);
  }
  return names;
}

// a css module where the browser has them, fetched and parsed where not
async function loadSheet (url) {
  try {
    return (await import(url, { with: { type: 'css' } })).default;
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`[@aufbau/api] gestalt: ${response.status} ${response.statusText} - ${url}`);
    return new CSSStyleSheet().replace(await response.text());
  }
}

let presets = null;

/** the preset names of css/themes.css, in their order there. a failed load is retried on the next call */
const themes = () => presets ??= loadSheet(`${CSS_PATH}/themes.css`)
  .then(sheet => [...new Set(presetsOf(sheet.cssRules))])
  .catch(error => { presets = null; throw error; });

// :::::: API

/** sets any of theme, mode, layout, look and skin. resolves once the stylesheets are in */
async function set (values = {}) {
  for (const [key, name] of Object.entries(TOKENS)) if (key in values) setToken(name, values[key]);
  await Promise.all(Object.keys(SHEETS).filter(key => key in values).map(key => setSheet(key, values[key])));
  Object.assign(current, values);
  return { ...current };
}

/** one value, or all of them. theme and mode fall back to what the css resolved */
const get = key => {
  const read = name => name in TOKENS ? current[name] ?? readToken(TOKENS[name]) : current[name] ?? null;
  return key ? read(key) : Object.fromEntries(['theme', 'mode', ...Object.keys(SHEETS)].map(name => [name, read(name)]));
};

/** the colors the theme resolved to, as rgb() strings. on body, where the presets land */
const colors = (element = document.body) => {
  const style = getComputedStyle(element);
  return Object.fromEntries(['accent', 'bg', 'fg'].map(name => [name, style.getPropertyValue(`--${name}`).trim()]));
};

export const gestalt = { colors, get, set, themes, layouts: LAYOUTS, looks: LOOKS, modes: MODES, skins: SKINS };

export default gestalt;
