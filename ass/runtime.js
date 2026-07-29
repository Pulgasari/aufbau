// ass runtime property & value resolver

import { defaultTokens } from 'meta.js';

// :::::: Helpers

// ::: Checks

const isNumber        = value => typeof value === 'number';
const isNumericString = value => typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value.trim());   
const isNumeric       = value => isNumber(value) || isNumericString(value);
const isString        = value => typeof value === 'string';

// :::

export function normalizeProp (prop) {
  if (typeof prop !== 'string') return prop;
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getCategory (prop) {
  const norm = normalizeProp(prop);
  if (norm.startsWith('margin')) return 'margin';
  if (norm.startsWith('padding')) return 'padding';
  if (norm.endsWith('Gap') || norm === 'gap') return 'gap';
  return norm;
}

export function resolveValue (prop, val, explicitUnit, customTokens) {
  if (val === null || val === undefined) return '';

  // handle css variable reference (--var)
  if (typeof val === 'string' && val.startsWith('--')) {
    if (typeof window !== 'undefined' && window.CSSVariableReferenceValue) {
      return new window.CSSVariableReferenceValue(val);
    }
    return `var(${val})`;
  }

  // handle explicit unit function (e.g. CSS.px)
  if (typeof explicitUnit === 'function') {
    const num = parseFloat(val);
    try {
      return explicitUnit(num);
    } catch {
      // fallback if not a typed om factory
    }
  }

  // handle explicit unit string (e.g. 'px')
  if (typeof explicitUnit === 'string' && explicitUnit) {
    const num = parseFloat(val);
    return isNaN(num) ? val : `${num}${explicitUnit}`;
  }

  // handle numeric input or numeric string with default unit
  const isNumeric = typeof val === 'number' || (typeof val === 'string' && /^-?\d+(?:\.\d+)?$/.test(val.trim()));
  if (isNumeric) {
    const norm = normalizeProp(prop);
    const unit = defaultUnits[norm] ?? 'px';
    return `${val}${unit}`;
  }

  // handle token lookup
  if (typeof val === 'string') {
    const tokens = customTokens || defaultTokens;
    const category = getCategory(prop);
    if (tokens[category] && tokens[category][val]) {
      return tokens[category][val];
    }
  }

  return val;
}

export function parseTypedValue (valStr, prop) {
  if (!valStr) return null;

  const numMatch = String(valStr).trim().match(/^(-?\d+(?:\.\d+)?)([a-zA-Z%]*)$/);
  if (numMatch) {
    const num     = parseFloat(numMatch[1]);
    const unitStr = numMatch[2] || 'px';

    if (typeof window !== 'undefined' && window.CSS && typeof window.CSS[unitStr] === 'function') {
      return window.CSS[unitStr](num);
    }
    return { value: num, unit: unitStr };
  }

  if (typeof valStr === 'string' && valStr.startsWith('var(')) {
    const varName = valStr.slice(4, -1).trim();
    if (typeof window !== 'undefined' && window.CSSVariableReferenceValue) {
      return new window.CSSVariableReferenceValue(varName);
    }
    return { variable: varName };
  }

  return valStr;


}

// :::::: ASS DOM Integration

export class ASSValue extends String {
  constructor (val, element, prop, options = {}) {
    super(val);
    this.element = element;
    this.prop = prop;
    this.options = options;
  }

  get () {
    return String(this);
  }

  getTyped () {
    if (this.element.attributeStyleMap) {
      const typed = this.element.attributeStyleMap.get(this.prop);
      if (typed) return typed;
    }
    return parseTypedValue(String(this), this.prop);
  }

  set (val, explicitUnit) {
    setAssProperty(this.element, this.prop, val, explicitUnit, this.options);
    return this;
  }
}

export function getAssProperty (element, prop) {
  const norm = normalizeProp(prop);
  if (element.attributeStyleMap) {
    const typed = element.attributeStyleMap.get(norm);
    if (typed) return String(typed);
  }
  return element.style[norm] || '';
}

export function setAssProperty (element, prop, val, explicitUnit, options = {}) {
  const norm = normalizeProp(prop);
  const resolved = resolveValue(norm, val, explicitUnit, options.tokens);

  if (element.attributeStyleMap && typeof resolved === 'object') {
    try {
      element.attributeStyleMap.set(norm, resolved);
      return;
    } catch {
      // fallback to style string assignment
    }
  }

  element.style[norm] = String(resolved);
}

export function createAssProxy (element, options = {}) {
  return new Proxy(element, {
    get (target, prop) {
      if (typeof prop !== 'string' || prop === 'then') return Reflect.get(target, prop);
      const norm = normalizeProp(prop);
      const val = getAssProperty(target, norm);
      return new ASSValue(val, target, norm, options);
    },
    set (target, prop, val) {
      if (typeof prop !== 'string') return Reflect.set(target, prop, val);
      setAssProperty(target, prop, val, undefined, options);
      return true;
    }
  });
}

export function attachAssToDOM (options = {}) {
  if (typeof Element === 'undefined' || Element.prototype.ass) return;

  Object.defineProperty(Element.prototype, 'ass', {
    get () {
      if (!this._assProxy) this._assProxy = createAssProxy(this, options);
      return this._assProxy;
    },
    configurable: true
  });
}

