// ass runtime property & value resolver

import { defaultTokens } from 'meta.js';

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
    const num = parseFloat(numMatch[1]);
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
