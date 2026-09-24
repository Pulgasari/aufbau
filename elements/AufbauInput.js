// <aufbau-input>
// a single value of a single type. `type` is the value domain and nothing else:
// type="range" lives in <aufbau-slider>, type="file" in <aufbau-upload>.

import { AufbauControl, TYPE_NAMES, valueType } from './core/index.js';
import { attrs, html } from './core/html.js';
import { setAttr } from '@domina/methods/setAttr.js';
import { setValue } from '@domina/methods/setValue.js';

// value domains that <aufbau-input> deliberately does not carry
const MOVED = { file: 'aufbau-upload', range: 'aufbau-slider' };
const warned = new Set;

export default class AufbauInput extends AufbauControl {
  static reflect = ['look'];

  static attr = {
    autocomplete : String,
    icon         : String,
    list         : String,
    look         : { type: String, default: 'field', values: ['field', 'stepper', 'swatch'] },
    max          : String,
    maxlength    : Number,
    min          : String,
    minlength    : Number,
    pattern      : String,
    placeholder  : String,
    step         : Number,
    type         : { type: String, default: 'text', values: TYPE_NAMES },
  };

  // the host is the field. children are addressed structurally, no classes:
  // the native <input>, the type icon and the stepper buttons
  static styles = `aufbau-input {
    align-items     : center;
    display         : inline-flex;
    gap             : var(--aufbau-control-gap, 0.5em);
    min-inline-size : 0;

    > input {
      background      : none;
      border          : 0;
      color           : inherit;
      flex            : 1 1 auto;
      font            : inherit;
      margin          : 0;
      min-inline-size : 0;
      padding         : 0;

      &:focus { outline: none; }
    }

    > aufbau-icon { flex: none; opacity: 0.65; }

    > button {
      align-items     : center;
      background      : none;
      border          : 0;
      color           : inherit;
      cursor          : pointer;
      display         : inline-flex;
      flex            : none;
      font            : inherit;
      justify-content : center;
      margin          : 0;
    }

    /* look="stepper" ships its own buttons, the native spinner would double them */
    &[look="stepper"] > input {
      appearance : textfield;
      text-align : center;

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button { appearance: none; margin: 0; }
    }

    /* look="swatch" draws the colour as a pseudo element, fed by --input-swatch from sync() */
    &[look="swatch"]::after {
      background  : var(--input-swatch, transparent);
      block-size  : 1.1em;
      content     : '';
      flex        : none;
      inline-size : 1.1em;
    }
  }`;

  get type () {
    const raw = this.getAttribute('type');
    if (raw && MOVED[raw] && !warned.has(raw)) {
      warned.add(raw);
      console.warn(`[aufbau-input] type="${raw}" is not an input type, use <${MOVED[raw]}> instead.`);
    }
    return this.getAttr('type');
  }

  get valueType () { return valueType(this.type); }

  // the raw field string is the value, coercion happens on read
  parseValue  (raw)   { return raw == null ? '' : String(raw); }
  formatValue (value) { return value == null ? '' : String(value); }

  /** the value parsed into its type: a Number for number, epoch ms for date, … */
  get typedValue () { return this.valueType.parse(this.getAttribute('value')); }

  onMount () {
    this.on('input',  'input', (event, input) => this.commit(input.value));
    this.on('change', 'input', (event, input) => this.commit(input.value));

    this.on('click', '[data-step]', (event, button) => {
      if (this.isDisabled) return;
      this.stepBy(Number(button.dataset.step));
    });
  }

  stepBy (direction) {
    const { max, min, step } = this.getAttr();
    const size    = step || this.valueType.step || 1;
    const current = Number(this.getAttribute('value')) || 0;

    const lower = min === undefined ? -Infinity : Number(min);
    const upper = max === undefined ?  Infinity : Number(max);

    this.commit(Math.min(upper, Math.max(lower, current + direction * size)));
    return this;
  }

  // the native field, not the first focusable child (that would be the minus button of a stepper)
  get focusTarget () { return this.$(':scope > input'); }

  render () {
    const { autocomplete, icon, look, max, maxlength, min, minlength, pattern, placeholder, step } = this.getAttr();

    const domain   = this.valueType;
    const iconName = icon === 'false' ? null : (icon || domain.icon);
    const stepper  = look === 'stepper';

    const stepButton = (direction, glyph) => html`
      <button type="button" data-step="${direction}"><aufbau-icon icon="${glyph}"></aufbau-icon></button>
    `;

    // markup is in visual order. value and disabled are absent on purpose, both are
    // applied in sync(): rebuilding on every keystroke would drop the caret out of the field
    return html`
      ${stepper && stepButton(-1, 'lucide:minus')}
      <input ${attrs({ autocomplete, max, maxlength, min, minlength, pattern, placeholder, step, type: domain.input })} />
      ${iconName && html`<aufbau-icon icon="${iconName}"></aufbau-icon>`}
      ${stepper && stepButton(1, 'lucide:plus')}
    `;
  }

  sync () {
    super.sync();

    const input = this.focusTarget;
    if (!input) return;

    const { list, look, readonly } = this.getAttr();
    const value = this.getAttribute('value') ?? '';

    // list is an attribute rather than a template hole, interpolating markup
    // into html`` would escape the quotes
    setAttr(input, { list: list || false, readonly });

    // never write back into the field while the user is typing in it
    if (input !== document.activeElement) setValue(input, value);

    if (look === 'swatch') this.style.setProperty('--input-swatch', this.valueType.format(value));
    else this.style.removeProperty('--input-swatch');
  }
}

AufbauInput.init();
