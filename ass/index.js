// @aufbau/ass

function toKebabCase (str) {
  return str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
}

const AUFBAU_ALIASES = {
  pattern : 'aufbau-pattern',
  use     : 'aufbau-use',
  trait   : 'aufbau-use',
  colors  : 'aufbau-colors',
  dirty   : 'aufbau-dirty',
  unset   : 'aufbau-unset',
  webfont : 'aufbau-webfont',
  flex    : 'aufbau-flex',
  grid    : 'aufbau-grid',
  center  : 'aufbau-center',
  icon    : 'aufbau-icon',
  shader  : 'aufbau-shader'
};

function normalizeProperty (key) {
  const kebab = toKebabCase(key);
  return AUFBAU_ALIASES[kebab] || kebab;
}

export class AufbauStylesheet {
  constructor() {
    // Stores rules as: Map<selector, Map<property, value>>
    this._rules = new Map();
  }

  /**
   * Declare CSS rules with object syntax.
   * Supports single/multiple selectors, camelCase, aufbau aliases, and nested rules.
   */
  rule (selector, declarations) {
    if (!selector || !declarations) return this;

    // 1. Normalize selector input into an array
    const selectors = Array.isArray(selector)
      ? selector
      : selector.split(',').map(s => s.trim());

    for (const sel of selectors) {
      if (!this._rules.has(sel)) {
        this._rules.set(sel, new Map());
      }
      const ruleMap = this._rules.get(sel);

      for (const [key, value] of Object.entries(declarations)) {
        // 2. Handle nested rule objects (e.g. '> main' or '&:hover')
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          let nestedSelector = key;
          if (nestedSelector.startsWith('&')) {
            nestedSelector = nestedSelector.replace('&', sel);
          } else {
            nestedSelector = `${sel} ${nestedSelector}`;
          }
          // Recursively add nested rule
          this.rule(nestedSelector, value);
        } else {
          // 3. Regular property declaration
          const propName = normalizeProperty(key);
          ruleMap.set(propName, String(value));
        }
      }
    }

    return this; // Enable method chaining
  }

  /**
   * Generates formatted CSS output.
   */
  asString() {
    let css = '';
    for (const [sel, props] of this._rules) {
      css += `${sel} {\n`;
      for (const [prop, val] of props) {
        css += `  ${prop}: ${val};\n`;
      }
      css += `}\n\n`;
    }
    return css.trim();
  }
}

export class AufbauStylesheetProcessor {

  process () {
    for (const [key, value] of Object.entries(declarations)) {
        const cleanKey = key.toLowerCase();

        // 1. Direct Skill Evaluation
        if (cleanKey === 'pattern' || cleanKey === 'aufbau-pattern') {
          const nativeCss = transformPattern(value, this._tokens);
          parseCssDeclarationString(nativeCss, ruleMap);
        } 
        else if (cleanKey === 'dirty' || cleanKey === 'aufbau-dirty') {
          const nativeCss = transformDirty(value);
          parseCssDeclarationString(nativeCss, ruleMap);
        } 
        else if (cleanKey === 'unset' || cleanKey === 'aufbau-unset') {
          const nativeCss = transformUnset(value);
          parseCssDeclarationString(nativeCss, ruleMap);
        }
        // 2. Nested rules handling (&:hover, > main)
        else if (typeof value === 'object' && value !== null) {
          let nestedSel = key.startsWith('&') ? key.replace('&', sel) : `${sel}${key}`;
          this.rule(nestedSel, value);
        }
        // 3. Standard CSS property
        else {
          const kebabProp = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
          ruleMap.set(kebabProp, String(value));
        }
    }
  }
}

const sheet = ass.new(); // returns new AufbauStylesheet
sheet.rules(...);

const stillASS = sheet.asString();

const nowCSS = sheet.process().asString();
const nowCSSStyleElement = sheet.process().asElement();



function prefers (key, value) {
  if (key === undefined) {
    return {
      contrast : pref('contrast'),
      motion   : pref('motion'),
      scheme   : pref('scheme'),
    };
  }

  const map = {
    'scheme'         : 'color-scheme',
    'color-scheme'   : 'color-scheme',
    'contrast'       : 'contrast',
    'motion'         : 'reduced-motion',
    'reduced-motion' : 'reduced-motion',
    'no'             : 'no-preference',
    'no-preference'  : 'no-preference',
  };
  const feature = map[key];
  if (!feature) throw new Error(`Unbekannte Preference: "${key}"`);

  const possible = {
    'color-scheme'   : ['no-preference', 'dark', 'light'],
    'contrast'       : ['no-preference', 'custom', 'less', 'more'],
    'reduced-motion' : ['no-preference', 'reduce'],
  };

  // Zwei Parameter: expliziter Check
  if (value !== undefined) {
    const bool = window.matchMedia(`(prefers-${feature}: ${value})`).matches;
    return {
      bool, string: value,
      valueOf  () { return this.bool; },
      toString () { return this.string; }
    };
  }

  // Ein Parameter: automatische Erkennung
  let matched = 'no-preference';
  for (const v of possible[feature]) {
    if (window.matchMedia(`(prefers-${feature}: ${v})`).matches) {
      matched = v;
      break;
    }
  }

  const bool = matched !== 'no-preference';
  return {
    bool, string: matched,
    valueOf  () { return this.bool; },
    toString () { return this.string; }
  };
}

const ass = {};
ass.client = { prefers };

const stylesheet = ass.new();



/*
const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

// Initialer Check
darkModeQuery.matches ? switchToDark() : switchToLight();

// Listener für Live-Wechsel
darkModeQuery.addEventListener("change", (e) => {
  if (e.matches) {
    console.log("Nutzer hat auf Dark umgestellt");
  } else {
    console.log("Nutzer hat auf Light umgestellt");
  }
});
*/
