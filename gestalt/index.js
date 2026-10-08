// @aufbau/gestalt
// the appearance of a page as a whole: palette, mode, density, geometry,
// look, layout and skin, one controller for all of them.
//
//   await gestalt.set({ palette: 'oled', mode: 'dark', density: 'touch', geometry: 'round' });
//   gestalt.get('palette')    // 'oled'
//   gestalt.colors()          // { bg, fg, ink } as the browser computed them
//   await gestalt.palettes()  // the preset names of gestalt/palettes.css
//
// palette, mode, density and geometry are custom properties on the root,
// mode as --scheme.
// gestalt/palettes.css reads palette, gestalt/gestalt.css the scheme, so a palette is a preset name or any css color:
// 'dracula', 'teal', '#ff8800'.
// look and layout are stylesheets, one per kind, swapped in place, false
// removes one. skin is both: the --skin token, and the sheet the elements adopt
// into @layer aufbau.skin (@aufbau/element).

export const 
CSS_PATH     = 'https://code.pulgasari.dev/aufbau/css',
GESTALT_PATH = 'https://code.pulgasari.dev/aufbau/gestalt',
DENSITIES    = ['compact', 'normal', 'comfortable', 'touch'],
GEOMETRIES   = ['sharp', 'soft', 'round', 'pill'],
LAYOUTS      = ['landing', 'mobile-basic', 'three-panels'],
LOOKS        = ['flat', 'rounded'],
MODES        = ['auto', 'dark', 'light'],
SKINS        = ['andromeda', 'monochrome'];

// TOKENS :: the properties gestalt.css and palettes.css read, mirrored as data-* for selectors
// SHEETS :: the folder of each stylesheet kind
const TOKENS  = { density: 'density', geometry: 'geometry', mode: 'scheme', palette: 'palette', skin: 'skin' };      
const SHEETS  = { layout: 'layouts', look: 'looks' };
const current = {};

// the skin sheet belongs to the elements, one adoption in their layer. false or null removes it
const setSkin = async name => (await import('@aufbau/element')).setSkin(name || null);

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
  if (!name) return (await domina('releaseStyleSheet'))(key);
  return (await domina('adoptStyleSheet'))(`${GESTALT_PATH}/${SHEETS[kind]}/${name}.css`, { key, replace: true });
}

// :::::: PRESETS
// the presets are read off the container queries of gestalt/palettes.css,
// so the stylesheet stays the only place that lists them.
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
  if (!presets.has(property)) presets.set(property, loadSheet(`${GESTALT_PATH}/${file}`)
    .then(sheet => [...new Set(presetsOf(sheet.cssRules, presetPattern(property)))])
    .catch(error => { presets.delete(property); throw error; }));
  return presets.get(property);
}

const palettes = () => presetNames('palettes.css', 'palette');

// :::::: API

/** sets any of palette, mode, theme, density, geometry, layout, look and skin. resolves once the stylesheets are in */
async function set (values = {}) {
  for (const [key, name] of Object.entries(TOKENS)) if (key in values) setToken(name, values[key]);
  await Promise.all([
    ...Object.keys(SHEETS).filter(key => key in values).map(key => setSheet(key, values[key])),
    'skin' in values && setSkin(values.skin),
  ]);
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
  return Object.fromEntries(['bg', 'fg', 'ink'].map(name => [name, style.getPropertyValue(`--color-${name}`).trim()]));
};

export const gestalt = { colors, get, palettes, set, densities: DENSITIES, geometries: GEOMETRIES, layouts: LAYOUTS, looks: LOOKS, modes: MODES, skins: SKINS };

export default gestalt;
