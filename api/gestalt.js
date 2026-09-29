// @aufbau/api/gestalt.js
// the appearance of a page as a whole: palette, mode, theme, look, layout and
// skin, one controller for all of them.
//
//   await gestalt.set({ palette: 'oled', mode: 'dark', look: 'rounded' });
//   gestalt.get('palette')    // 'oled'
//   gestalt.colors()          // { accent, bg, fg } as the browser computed them
//   await gestalt.palettes()  // the preset names of css/palettes.css
//   await gestalt.themes()    // the preset names of css/themes.css
//
// palette, mode and theme are custom properties on the root. css/palettes.css
// reads palette and mode, so a palette is a preset name or any css color:
// 'dracula', 'teal', '#ff8800'. css/themes.css turns a theme into a palette
// and a skin.
// look, layout and skin are stylesheets, one per kind, swapped in place, false
// removes one.

export const CSS_PATH = 'https://code.pulgasari.dev/aufbau/css';

export const MODES   = ['auto', 'dark', 'light'];
export const LAYOUTS = ['landing', 'mobile-basic', 'three-panels'];
export const LOOKS   = ['flat', 'rounded'];
export const SKINS   = ['monochrome'];

// the properties palettes.css and themes.css read, mirrored as data-* for selectors
const TOKENS = { mode: 'palette-mode', palette: 'palette', theme: 'theme' };

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

// :::::: PRESETS
// the presets are read off the container queries of css/palettes.css and
// css/themes.css, so the stylesheets stay the only place that lists them.
// loaded once, on first ask

const presetPattern = property => new RegExp(`style\\(\\s*--${property}\\s*:\\s*([\\w-]+)\\s*\\)`);

// @layer and @media nest rules, an @import carries its own sheet
function presetsOf (rules, pattern, names = []) {
  for (const rule of rules) {
    const match = rule instanceof CSSContainerRule && rule.conditionText.match(pattern);
    if (match) names.push(match[1]);
    else if (rule.cssRules ?? rule.styleSheet?.cssRules) presetsOf(rule.cssRules ?? rule.styleSheet.cssRules, pattern, names);
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

const presets = new Map;   // property -> promise of names

/** the preset names of --property in a stylesheet, in their order there. a failed load is retried on the next call */
function presetNames (file, property) {
  if (!presets.has(property)) presets.set(property, loadSheet(`${CSS_PATH}/${file}`)
    .then(sheet => [...new Set(presetsOf(sheet.cssRules, presetPattern(property)))])
    .catch(error => { presets.delete(property); throw error; }));
  return presets.get(property);
}

const palettes = () => presetNames('palettes.css', 'palette');
const themes   = () => presetNames('themes.css', 'theme');

// :::::: API

/** sets any of palette, mode, theme, layout, look and skin. resolves once the stylesheets are in */
async function set (values = {}) {
  for (const [key, name] of Object.entries(TOKENS)) if (key in values) setToken(name, values[key]);
  await Promise.all(Object.keys(SHEETS).filter(key => key in values).map(key => setSheet(key, values[key])));
  Object.assign(current, values);
  return { ...current };
}

/** one value, or all of them. the tokens fall back to what the css resolved */
const get = key => {
  const read = name => name in TOKENS ? current[name] ?? readToken(TOKENS[name]) : current[name] ?? null;
  return key ? read(key) : Object.fromEntries([...Object.keys(TOKENS), ...Object.keys(SHEETS)].map(name => [name, read(name)]));
};

/** the colors the palette resolved to, as rgb() strings. on body, where the presets land */
const colors = (element = document.body) => {
  const style = getComputedStyle(element);
  return Object.fromEntries(['accent', 'bg', 'fg'].map(name => [name, style.getPropertyValue(`--${name}`).trim()]));
};

export const gestalt = { colors, get, palettes, set, themes, layouts: LAYOUTS, looks: LOOKS, modes: MODES, skins: SKINS };

export default gestalt;
