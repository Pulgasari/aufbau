// <widget-calculator>

import './svg-icon.js';

import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';
import { localeOf }      from '../lib/locale.js';

// :::::: PARSER

// + - * / ( ) % and numbers with . or , as decimal mark. × ÷ − are the same as * / -
const TOKEN = /\s*(\d+(?:[.,]\d*)?|[.,]\d+|[-+*/()%×÷−])/y;

function tokenize (text) {
  const tokens = [];
  TOKEN.lastIndex = 0;
  const source = String(text).trim();

  while (TOKEN.lastIndex < source.length) {
    const match = TOKEN.exec(source);
    if (!match) return null;
    const token = match[1];
    if (/[\d.,]/.test(token[0])) tokens.push(Number(token.replace(',', '.')));
    else tokens.push({ '×': '*', '÷': '/', '−': '-' }[token] ?? token);
  }

  return tokens;
}

// the result, or null for an expression that is not one. `a + b%` is a plus b
// percent of a, `a × b%` is b percent of a
export function calculate (text) {
  const tokens = tokenize(text);
  if (!tokens?.length) return null;

  let index = 0;
  const peek = () => tokens[index];
  const next = () => tokens[index++];

  function expression () {
    let value = term().value;
    while (peek() === '+' || peek() === '-') {
      const operator = next();
      const right    = term();
      const amount   = right.percent ? value * right.value : right.value;
      value = operator === '+' ? value + amount : value - amount;
    }
    return value;
  }

  function term () {
    let { percent, value } = factor();
    while (peek() === '*' || peek() === '/' || peek() === '(' || typeof peek() === 'number') {
      const operator = peek() === '*' || peek() === '/' ? next() : '*';   // 2(3) is 2 × 3
      const right    = factor().value;
      value   = operator === '*' ? value * right : value / right;
      percent = false;
    }
    return { percent, value };
  }

  function factor () {
    let value = unary();
    let percent = false;
    while (peek() === '%') { next(); value /= 100; percent = true; }
    return { percent, value };
  }

  function unary () {
    if (peek() === '-') { next(); return -unary(); }
    if (peek() === '+') { next(); return unary(); }
    return primary();
  }

  function primary () {
    const token = next();
    if (typeof token === 'number') return token;
    if (token === '(') {
      const value = expression();
      if (peek() === ')') next();   // open brackets at the end close themselves
      return value;
    }
    throw new SyntaxError(`unexpected ${token ?? 'end'}`);
  }

  try {
    const value = expression();
    return index === tokens.length && Number.isFinite(value) ? value : null;
  }
  catch { return null; }
}

// :::::: KEYS

const KEYS = [
  ['alpha', '()', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', 'decimal', 'backspace', 'done'],
];

const ICONS = {
  backspace : 'lucide:delete',
  close     : 'lucide:x',
  copy      : 'lucide:copy',
  done      : 'lucide:check',
  keyboard  : 'lucide:keyboard',
  paste     : 'lucide:clipboard-paste',
  reset     : 'lucide:rotate-ccw',
};

const OPERATORS = new Set(['+', '−', '×', '÷', '%']);

let count = 0;

// :::::: MAIN

export default class WidgetCalculator extends AufbauElement {
  static attr = {
    alpha : Boolean,
    value : String,
  };

  static styles = `widget-calculator {
    --calculator-gap : --space(small);

    background     : var(--calculator-bg, var(--color-bg, Canvas));
    color          : var(--color-fg, CanvasText);
    box-sizing     : border-box;
    display        : inline-flex;
    flex-direction : column;
    gap            : var(--calculator-gap);
    inline-size    : min(100%, var(--calculator-size, 20rem));
    padding        : var(--calculator-gap);
    touch-action   : manipulation;
    user-select    : none;

    button {
      background    : none;
      border        : 0;
      border-radius : var(--calculator-radius, 0.6rem);
      color         : inherit;
      cursor        : pointer;
      display       : grid;
      font          : inherit;
      margin        : 0;
      padding       : 0;
      place-content : center;
    }

    [part="head"] {
      display : flex;
      gap     : var(--calculator-gap);

      > button { block-size: 2.25rem; inline-size: 2.25rem; font-size: 1.25rem; }
      > [data-act="close"] { margin-inline-end: auto; }
    }

    [part="screen"] {
      background    : color-mix(in oklch, var(--color-bg, Canvas), var(--color-fg, CanvasText) 15%);
      border-radius : 0.25rem;
      display       : grid;
      padding       : --space(normal);
    }

    [part="display"] {
      background : none;
      border     : 0;
      color      : inherit;
      font       : inherit;
      font-size  : 2rem;
      min-width  : 0;
      outline    : none;
      text-align : center;
    }

    [part="preview"] {
      font-size  : 0.9rem;
      min-height : 1.2em;
      opacity    : 0.6;
      text-align : center;
    }

    &[data-invalid] [part="screen"] { outline: 2px solid var(--color-error, #d33); }

    [part="keys"] {
      display               : grid;
      gap                   : var(--calculator-gap);
      grid-template-columns : repeat(4, minmax(0, 1fr));

      > button {
        aspect-ratio : 1;
        background   : color-mix(in oklch, var(--color-bg, Canvas), var(--color-fg, CanvasText) 22%);
        font-size    : 1.35rem;
        font-weight  : 600;
      }

      > [data-kind="operator"] {
        background : color-mix(in oklch, var(--color-fg, CanvasText) 80%, var(--color-bg, Canvas));
        color      : var(--color-bg, Canvas);
      }

      > [data-key="done"] {
        background : var(--color-ink, Highlight);
        color      : var(--accent-fg, HighlightText);
      }
    }

    widget-keyboard { inline-size: 100%; }
  }`;

  displayId = `calculator-${++count}`;

  get display () { return this.querySelector('[part="display"]'); }

  get expression () { return this.display?.value ?? this.getAttr('value') ?? ''; }

  // the decimal mark of the element's language
  get decimal () {
    try   { return new Intl.NumberFormat(localeOf(this)).formatToParts(1.5).find(part => part.type === 'decimal')?.value ?? '.'; }
    catch { return '.'; }
  }

  get result () { return calculate(this.expression); }

  format (value) {
    try   { return new Intl.NumberFormat(localeOf(this), { maximumFractionDigits: 10, useGrouping: false }).format(value); }
    catch { return String(value); }
  }

  // :::::: EDITING

  insert (text) {
    const field = this.display;
    if (!field) return this;
    const start = field.selectionStart ?? field.value.length;
    const end   = field.selectionEnd   ?? start;
    field.setRangeText(text, start, end, 'end');
    return this.changed();
  }

  backspace () {
    const field = this.display;
    if (!field) return this;
    const start = field.selectionStart ?? field.value.length;
    const end   = field.selectionEnd   ?? start;
    if (end > start) field.setRangeText('', start, end, 'end');
    else if (start > 0) field.setRangeText('', start - 1, start, 'end');
    return this.changed();
  }

  // ( where a bracket can open, ) where one is open and something stands before it
  bracket () {
    const field  = this.display;
    const before = field.value.slice(0, field.selectionStart ?? field.value.length).trimEnd();
    const open   = (before.match(/\(/g) ?? []).length - (before.match(/\)/g) ?? []).length;
    const last   = before.at(-1) ?? '';
    const closes = open > 0 && /[\d.,)%]/.test(last);
    return this.insert(closes ? ')' : '(');
  }

  setExpression (text) {
    const field = this.display;
    if (field) {
      field.value = text;
      field.setSelectionRange(text.length, text.length);
    }
    return this.changed();
  }

  changed () {
    delete this.dataset.invalid;
    const preview = this.querySelector('[part="preview"]');
    if (!preview) return this;
    const value = this.result;
    const plain = /^\s*-?[\d.,]*\s*$/.test(this.expression);
    preview.textContent = value == null || plain ? '' : `= ${this.format(value)}`;
    return this;
  }

  done () {
    const value = this.result;
    if (value == null && this.expression.trim()) { this.dataset.invalid = ''; return this; }
    if (value != null) this.setExpression(this.format(value));
    this.emit('widget-calculator', { action: 'done', value });
    return this;
  }

  close () {
    this.emit('widget-calculator', { action: 'close' });
    return this;
  }

  // :::::: ACTIONS

  async act (name, button) {
    switch (name) {
      case 'close'    : return this.close();
      case 'reset'    : return this.setExpression(this._initial ?? '');
      case 'copy'     : try { await navigator.clipboard.writeText(this.expression); } catch {} return this;
      case 'paste'    : try { this.insert((await navigator.clipboard.readText()).trim()); } catch {} return this;
      case 'keyboard' : {
        const field = this.display;
        const on    = field.inputMode === 'none';
        field.inputMode = on ? 'decimal' : 'none';
        button.setAttribute('aria-pressed', String(on));
        field.blur();
        field.focus();
        return this;
      }
    }
  }

  press (key) {
    switch (key) {
      case 'alpha'     : import('./widget-keyboard.js'); return this.setAttr({ alpha: !this.getAttr('alpha') });
      case 'backspace' : return this.backspace();
      case 'decimal'   : return this.insert(this.decimal);
      case 'done'      : return this.done();
      case '()'        : return this.bracket();
      default          : return this.insert(key);
    }
  }

  // :::::: LIFECYCLE

  onConnected () {
    this._initial ??= this.getAttr('value') ?? '';

    this.on('pointerdown', 'button', event => event.preventDefault());
    this.on('click', 'button[data-key]', (event, button) => this.press(button.dataset.key));
    this.on('click', 'button[data-act]', (event, button) => this.act(button.dataset.act, button));
    this.on('input', '[part="display"]', () => this.changed());
    this.on('keydown', '[part="display"]', event => {
      if (event.key === 'Enter')  { event.preventDefault(); this.done(); }
      if (event.key === 'Escape') { event.preventDefault(); this.close(); }
    });
  }

  onAttributeChanged (name) {
    if (name === 'value') { this._initial = this.getAttr('value') ?? ''; this.setExpression(this._initial); }
  }

  // :::::: RENDER

  key (key) {
    const label = { alpha: 'α', decimal: this.decimal }[key] ?? key;
    const icon  = ICONS[key];
    const kind  = OPERATORS.has(key) || key === '()' || key === 'alpha' ? 'operator' : null;

    return html`<button type="button" tabindex="-1" ${attrs({ 'aria-label': icon && key, 'aria-pressed': key === 'alpha' && String(this.getAttr('alpha')), 'data-key': key, 'data-kind': kind })}>${icon ? html`<svg-icon icon="${icon}"></svg-icon>` : label}</button>`;
  }

  render () {
    const alpha = this.getAttr('alpha');
    const value = this.display?.value ?? this.getAttr('value') ?? '';

    return html`
      <div part="head">
        ${['close', 'copy', 'paste', 'reset', 'keyboard'].map(act => html`
          <button type="button" tabindex="-1" data-act="${act}" aria-label="${act}" title="${act}"><svg-icon icon="${ICONS[act]}"></svg-icon></button>
        `)}
      </div>
      <div part="screen">
        <input part="display" id="${this.displayId}" inputmode="none" autocomplete="off" spellcheck="false" value="${value}">
        <output part="preview"></output>
      </div>
      ${alpha
        ? html`<div part="keys">${this.key('alpha')}</div><widget-keyboard target="#${this.displayId}" rows="keys" native-keyboard="keep"></widget-keyboard>`
        : html`<div part="keys">${KEYS.flat().map(key => this.key(key))}</div>`}
    `;
  }

  // a new display starts with the caret at the end
  onRender () { this.setExpression(this.display?.value ?? ''); }
}

WidgetCalculator.init();
