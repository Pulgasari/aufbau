// ass runtime semantics and evaluation engine
import { createDefaultTokenMap } from './tokens.js';
import * from './skills.js';

export class ASSEngine {
  constructor (options = {}) {
    this.config    = {};
    this.options   = options;
    this.tokens    = createDefaultTokenMap(options.tokens);
    this.traits    = new Map();
    this.variables = new Map();
    this.webfonts  = new Set();
  }

  evaluate (ast) {
    if (!Array.isArray(ast)) return ast;
    this.variables.clear();
    this.traits.clear();
    this.tokens = createDefaultTokenMap(this.options.tokens);
    this.config = {};
    this.webfonts.clear();

    this.collectDefinitions(ast);
    const configAtRules = this.generateConfigAtRules();
    const flattened = this.flattenStatements(ast);

    return [...configAtRules, ...flattened];
  }

  collectDefinitions(statements) {
    for (const node of statements) {
      if (!node) continue;
      if (node.type === 'VarDecl') {
        const name = node.name?.value;
        if (name) this.variables.set(name, this.resolveValue(node.value));
      } else if (node.type === 'AtRule') {
        if (node.name?.value === '@trait') this.registerTrait(node);
        if (node.name?.value === '@tokens') this.registerTokens(node);
        if (node.name?.value === '@config' || node.name?.value === '@aufbau-config') this.processConfig(node);
      }
      if (node.body && Array.isArray(node.body)) this.collectDefinitions(node.body);
    }
  }

  registerTrait(node) {
    const name = node.params ? node.params.map(p => p.value).join('') : '';
    if (!name) return;
    this.traits.set(name, node.body || []);
    if (name.startsWith('.')) this.traits.set(name.slice(1), node.body || []);
  }

  registerTokens(node) {
    const targetProps = (node.params || []).map(p => p.value).join('').split(',').map(s => s.trim()).filter(Boolean);
    for (const prop of targetProps) {
      if (!this.tokens.has(prop)) this.tokens.set(prop, new Map());
      const tokenMap = this.tokens.get(prop);
      for (const item of (node.body || [])) {
        if (item.type === 'Declaration' && item.name?.value) {
          tokenMap.set(item.name.value, extractString(item.value));
        }
      }
    }
  }

  processConfig(node) {
    for (const item of (node.body || [])) {
      if (!item.name?.value) continue;
      const key = item.name.value;
      if (item.type === 'MapDeclaration') {
        const map = {};
        for (const entry of (item.entries || [])) {
          if (entry.name?.value) map[entry.name.value] = extractString(entry.value);
        }
        this.config[key] = map;
      } else {
        this.config[key] = extractList(item.value);
      }
    }
  }

  generateConfigAtRules() {
    const rules = [];
    if (this.config.charset) {
      const charset = Array.isArray(this.config.charset) ? this.config.charset[0] : this.config.charset;
      rules.push({ type: 'AtRule', name: { value: '@charset' }, params: [{ value: `"${charset}"` }] });
    }
    for (const fontUrl of this.webfonts) {
      rules.push({ type: 'AtRule', name: { value: '@import' }, params: [{ value: `"${fontUrl}"` }] });
    }
    if (Array.isArray(this.config.import)) {
      for (const name of this.config.import) {
        if (!name) continue;
        const url = name.startsWith('http') ? name : `https://pulgasari.github.io/aufbau/css/${name}.css`;
        rules.push({ type: 'AtRule', name: { value: '@import' }, params: [{ value: `"${url}"` }] });
      }
    }
    if (Array.isArray(this.config.themes)) {
      for (const theme of this.config.themes) {
        if (!theme) continue;
        const url = theme.startsWith('http') ? theme : `https://pulgasari.github.io/aufbau/css/themes/${theme}.css`;
        rules.push({ type: 'AtRule', name: { value: '@import' }, params: [{ value: `"${url}"` }] });
      }
    }
    return rules;
  }

  flattenStatements(statements, parentSelector = '') {
    const result = [];
    for (const node of statements) {
      if (!node || node.type === 'VarDecl') continue;
      if (node.type === 'AtRule' && (node.name?.value === '@trait' || node.name?.value === '@tokens' || node.name?.value === '@config' || node.name?.value === '@aufbau-config')) {
        if (node.name?.value === '@trait' && node.params) {
          const name = node.params.map(p => p.value).join('');
          if (name.startsWith('.')) {
            const implicitRule = { type: 'Rule', selector: name, body: node.body || [] };
            result.push(...this.processRule(implicitRule, parentSelector));
          }
        }
        continue;
      }
      if (node.type === 'Rule') {
        result.push(...this.processRule(node, parentSelector));
      } else if (node.type === 'AtRule') {
        result.push(this.processAtRule(node, parentSelector));
      } else {
        result.push(node);
      }
    }
    return result;
  }

  processRule(node, parentSelector = '') {
    const rawSel = Array.isArray(node.selector) ? node.selector.map(s => s.value).join('') : (node.selector?.value || '');
    const fullSel = combineSelectors(parentSelector, rawSel);
    const decls = [];
    const nestedNodes = [];

    for (const child of (node.body || [])) {
      if (child.type === 'Declaration' || child.type === 'MapDeclaration') {
        const propName = child.name?.value;
        if (propName === 'use') {
          this.applyTraits(child, decls, nestedNodes);
        } else if (propName === 'colors') {
          decls.push(...expandColors(child, this.tokens));
        } else if (propName === 'pattern') {
          decls.push(...expandPattern(child, this.tokens));
        } else if (propName === 'shader') {
          decls.push(...expandShader(child));
        } else {
          decls.push(this.resolveDeclaration(child));
        }
      } else {
        nestedNodes.push(child);
      }
    }

    const currentRule = { ...node, selector: fullSel, body: decls };
    const flattened = [currentRule];
    if (nestedNodes.length > 0) {
      flattened.push(...this.flattenStatements(nestedNodes, fullSel));
    }
    return flattened;
  }

  applyTraits(useDecl, decls, nestedNodes) {
    const rawValues = extractList(useDecl.value);
    for (const traitName of rawValues) {
      if (!traitName || traitName === ';') continue;
      const traitBody = this.traits.get(traitName);
      if (!traitBody) continue;
      for (const item of traitBody) {
        if (item.type === 'Declaration') decls.push(this.resolveDeclaration(item));
        else nestedNodes.push(item);
      }
    }
  }

  resolveDeclaration(decl) {
    const propName = decl.name?.value;
    if (!propName || decl.type === 'MapDeclaration') return decl;

    const category = getPropertyCategory(propName);
    const tokenMap = this.tokens.get(category);

    let valueItems = Array.isArray(decl.value) ? decl.value : [decl.value];
    let resolvedItems = [];

    for (const item of valueItems) {
      if (!item) continue;
      if (item.type === 'BinaryExpr') {
        resolvedItems.push({ type: 'IDENTIFIER', value: this.evaluateBinaryExpr(item) });
      } else if (item.type === 'VARIABLE') {
        const resolvedVar = this.variables.get(item.value) || item.value;
        resolvedItems.push({ type: 'IDENTIFIER', value: resolvedVar });
      } else if (item.type === 'CUSTOM_PROP') {
        resolvedItems.push({ type: 'IDENTIFIER', value: `var(${item.value})` });
      } else if (item.type === 'IDENTIFIER' && tokenMap && tokenMap.has(item.value)) {
        resolvedItems.push({ type: 'IDENTIFIER', value: tokenMap.get(item.value) });
      } else {
        resolvedItems.push(item);
      }
    }
    return { ...decl, value: resolvedItems };
  }

  evaluateBinaryExpr(expr) {
    const leftVal = this.resolveValue(expr.left);
    const rightVal = this.resolveValue(expr.right);
    const op = expr.operator?.value || '+';

    const matchL = String(leftVal).match(/^(-?\d+(?:\.\d+)?)([a-zA-Z%]*)$/);
    const matchR = String(rightVal).match(/^(-?\d+(?:\.\d+)?)([a-zA-Z%]*)$/);

    if (matchL && matchR) {
      const numL = parseFloat(matchL[1]);
      const unitL = matchL[2];
      const numR = parseFloat(matchR[1]);
      const unitR = matchR[2];

      if (unitL === unitR || !unitR || !unitL) {
        const unit = unitL || unitR;
        let res = 0;
        if (op === '+') res = numL + numR;
        if (op === '-') res = numL - numR;
        if (op === '*') res = numL * numR;
        if (op === '/') res = numL / numR;
        return `${res}${unit}`;
      }
    }
    return `calc(${leftVal} ${op} ${rightVal})`;
  }

  resolveValue(node) {
    if (!node) return '';
    if (node.type === 'VARIABLE') return this.variables.get(node.value) || node.value;
    if (node.type === 'CUSTOM_PROP') return `var(${node.value})`;
    if (node.type === 'BinaryExpr') return this.evaluateBinaryExpr(node);
    if (Array.isArray(node)) return node.map(n => this.resolveValue(n)).join(' ');
    return node.value || '';
  }

  processAtRule(node, parentSelector = '') {
    if (node.name?.value === '@scope') return this.handleScope(node);
    if (node.body && Array.isArray(node.body)) {
      return { ...node, body: this.flattenStatements(node.body, parentSelector) };
    }
    return node;
  }

  handleScope(node) {
    return { ...node, isAssScope: true };
  }
}

function extractString(val) {
  if (!val) return '';
  if (Array.isArray(val)) return val.map(v => v.value).join(' ').trim();
  return val.value || '';
}

function extractList(val) {
  const str = extractString(val);
  return str.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
}

function getPropertyCategory(prop) {
  if (prop === 'margin'  || prop.startsWith('margin-'))  return 'margin';
  if (prop === 'padding' || prop.startsWith('padding-')) return 'padding';
  if (prop === 'gap'     || prop.  endsWith('-gap'))     return 'gap';
  return prop;
}

function combineSelectors(parent, child) {
  if (!parent) return child;
  if (child.includes('&')) return child.replaceAll('&', parent);
  return `${parent} ${child}`;
}
