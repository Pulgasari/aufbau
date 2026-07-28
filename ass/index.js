// @aufbau/ass

import { transformPattern } from '../skills/pattern.js';
import { transformDirty }   from '../skills/dirty.js';
import { transformUnset }   from '../skills/unset.js';

/**
 * Converts camelCase strings to kebab-case.
 */
function toKebabCase(str) {
  return str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
}

/**
 * Property aliases for @aufbau shorthands.
 */
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

function normalizeProperty(key) {
  const kebab = toKebabCase(key);
  return AUFBAU_ALIASES[kebab] || kebab;
}

/**
 * Parses a raw CSS string into property-value pairs on a target map.
 */
function parseCssDeclarationString(cssString, ruleMap) {
  if (!cssString) return;
  const declarations = cssString.split(';');
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx !== -1) {
      const prop = decl.slice(0, colonIdx).trim();
      const val  = decl.slice(colonIdx + 1).trim();
      if (prop && val) {
        ruleMap.set(prop, val);
      }
    }
  }
}

/**
 * Processor class that compiles ASS declarations into native CSS.
 */
export class AufbauStylesheetProcessor {
  constructor(tokens = {}) {
    this._tokens = tokens;
  }

  /**
   * Compiles an AufbauStylesheet instance into a new, fully processed AufbauStylesheet.
   */
  process(stylesheet) {
    const processedSheet = new AufbauStylesheet();
    processedSheet._isProcessed = true;

    for (const [selector, props] of stylesheet._rules) {
      for (const [prop, val] of props) {
        const cleanProp = prop.toLowerCase();

        // 1. Process aufbau skills
        if (cleanProp === 'aufbau-pattern') {
          const nativeCss = transformPattern(val, this._tokens);
          const targetMap = processedSheet._getOrCreateRuleMap(selector);
          parseCssDeclarationString(nativeCss, targetMap);
        } else if (cleanProp === 'aufbau-dirty') {
          const nativeCss = transformDirty(val);
          const targetMap = processedSheet._getOrCreateRuleMap(selector);
          parseCssDeclarationString(nativeCss, targetMap);
        } else if (cleanProp === 'aufbau-unset') {
          const nativeCss = transformUnset(val);
          parseCssDeclarationString(targetMap);
        } else {
          // Standard CSS properties pass through
          processedSheet._getOrCreateRuleMap(selector).set(prop, val);
        }
      }
    }

    return processedSheet;
  }
}

/**
 * Core Stylesheet AST & Declaration Store.
 */
export class AufbauStylesheet {
  constructor() {
    this._rules = new Map();
    this._isProcessed = false;
  }

  _getOrCreateRuleMap(selector) {
    if (!this._rules.has(selector)) {
      this._rules.set(selector, new Map());
    }
    return this._rules.get(selector);
  }

  /**
   * Declare CSS rules using object syntax.
   */
  rule(selector, declarations) {
    if (!selector || !declarations) return this;

    const selectors = Array.isArray(selector)
      ? selector
      : selector.split(',').map(s => s.trim());

    for (const sel of selectors) {
      const ruleMap = this._getOrCreateRuleMap(sel);

      for (const [key, value] of Object.entries(declarations)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          let nestedSel = key.startsWith('&') ? key.replace('&', sel) : `${sel} ${key}`;
          this.rule(nestedSel, value);
        } else {
          const propName = normalizeProperty(key);
          ruleMap.set(propName, String(value));
        }
      }
    }

    return this;
  }

  /**
   * Compiles the stylesheet using the processor.
   */
  process(tokens = {}) {
    const processor = new AufbauStylesheetProcessor(tokens);
    return processor.process(this);
  }

  /**
   * Returns the plain object representation of the stylesheet.
   */
  asObject() {
    const result = {};
    for (const [sel, props] of this._rules) {
      result[sel] = Object.fromEntries(props);
    }
    return result;
  }

  /**
   * Formats the stylesheet as a CSS string (raw ASS or native CSS depending on state).
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

  /**
   * Returns an HTMLStyleElement containing the compiled CSS.
   */
  asElement(id = 'aufbau-stylesheet') {
    if (typeof document === 'undefined') return null;

    let styleEl = document.getElementById(id);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = id;
      styleEl.type = 'text/css';
    }
    styleEl.textContent = this.asString();
    return styleEl;
  }

  /**
   * Appends the stylesheet directly to the document head.
   */
  toHead(id = 'aufbau-stylesheet') {
    const el = this.asElement(id);
    if (el && !document.head.contains(el)) {
      document.head.appendChild(el);
    }
    return el;
  }
}

// Module Export API
export const ass = {
  new: () => new AufbauStylesheet()
};

export default ass;

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
