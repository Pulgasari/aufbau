// <aufbau-input>
// a single value of a single type. `type` is the value domain and nothing else:
// type="range" lives in <aufbau-slider>, type="file" in <aufbau-upload>.

import { AufbauControl, TYPE_NAMES, valueType } from './core/index.js';
import { attrs, html } from '@aufbau/js';
import * as dom from '@domina/core';

// value domains that <aufbau-input> deliberately does not carry
const MOVED = { file: 'aufbau-upload', range: 'aufbau-slider' };
const warned = new Set;

export default class AufbauInput extends AufbauControl {
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

  render () {
    const { autocomplete, icon, look, max, maxlength, min, minlength, pattern, placeholder, step } = this.getAttr();

    const domain   = this.valueType;
    const iconName = icon === 'false' ? null : (icon || domain.icon);

    // value and disabled are absent on purpose, both are applied in sync().
    // rebuilding on every keystroke would drop the caret out of the field.
    const field = html`<input class="input-field" ${attrs({
      autocomplete,
      max,
      maxlength,
      min,
      minlength,
      pattern,
      placeholder,
      step,
      type : domain.input,
    })} />`;

    const stepButton = (direction, glyph) => html`
      <button type="button" class="input-step btn-${direction > 0 ? 'inc' : 'dec'}" data-step="${direction}">
        <aufbau-icon icon="${glyph}"></aufbau-icon>
      </button>
    `;

    return html`
      <div class="aufbau-input-wrapper look-${look}">
        ${look === 'stepper' && stepButton(-1, 'lucide:minus')}
        ${iconName && html`<aufbau-icon icon="${iconName}" class="input-icon"></aufbau-icon>`}
        ${field}
        ${look === 'swatch' && html`<span class="input-swatch"></span>`}
        ${look === 'stepper' && stepButton(1, 'lucide:plus')}
      </div>
    `;
  }

  sync () {
    super.sync();

    const input = this.$('.input-field');
    if (!input) return;

    const { list, readonly } = this.getAttr();
    const value = this.getAttribute('value') ?? '';

    // list is an attribute rather than a template hole, interpolating markup
    // into html`` would escape the quotes
    dom.setAttr(input, { list: list || false, readOnly: readonly });

    // never write back into the field while the user is typing in it
    if (input !== document.activeElement) dom.setValue(input, value);

    const swatch = this.$('.input-swatch');
    if (swatch) swatch.style.background = this.valueType.format(value);
  }
}

AufbauInput.init();
