// <aufbau-slider>
// a value on an axis. every type is projected onto one numeric track through
// valueTypes, so color, date, datetime, time and number share this one
// implementation. `range` turns it into a two handle span.

import { AufbauControl, AXIS_TYPES, valueType } from './core/index.js';
import { attrs, html } from './core/html.js';
import { setValue } from '@domina/methods/setValue.js';

export default class AufbauSlider extends AufbauControl {
  static attr = {
    controls : Boolean,
    editable : Boolean,
    marks    : Boolean,
    max      : String,
    min      : String,
    range    : Boolean,
    step     : Number,
    type     : { type: String, default: 'number', values: AXIS_TYPES },
    unit     : String,
  };

  // children: optional step buttons, the track box (one or two native range
  // inputs stacked, ::before is the track line, ::after the fill between
  // --slider-from and --slider-to) and an <output> with the readout
  static styles = `aufbau-slider {
    --slider-thumb-size : 1em;
    --slider-track-size : 0.35em;

    align-items : center;
    display     : flex;
    gap         : var(--aufbau-control-gap, 0.5em);

    > div {
      align-items     : center;
      block-size      : var(--slider-thumb-size);
      display         : flex;
      flex            : 1 1 auto;
      isolation       : isolate;
      /* in range mode both inputs are out of flow, without a floor the box collapses */
      min-inline-size : var(--slider-min-size, 10em);
      position        : relative;

      &::before,
      &::after {
        block-size        : var(--slider-track-size);
        content           : '';
        inset-block-start : 50%;
        pointer-events    : none;
        position          : absolute;
        translate         : 0 -50%;
        z-index           : 1;
      }

      &::before { inset-inline: 0; }

      &::after {
        inline-size        : calc(var(--slider-to, 0%) - var(--slider-from, 0%));
        inset-inline-start : var(--slider-from, 0%);
      }

      > input {
        appearance  : none;
        background  : none;
        block-size  : var(--slider-thumb-size);
        inline-size : 100%;
        margin      : 0;
        z-index     : 2;

        &:focus { outline: none; }
      }
    }

    /* both handles have to stay reachable, so only the thumbs take pointer events */
    &[range] > div > input {
      inset          : 0;
      pointer-events : none;
      position       : absolute;

      &::-webkit-slider-thumb { pointer-events: auto; }
      &::-moz-range-thumb     { pointer-events: auto; }
    }

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

    > output {
      align-items          : center;
      display              : flex;
      flex                 : none;
      font-variant-numeric : tabular-nums;
      gap                  : 0.25em;

      > input {
        background  : none;
        border      : 0;
        color       : inherit;
        font        : inherit;
        inline-size : var(--slider-readout-size, 5ch);
        margin      : 0;
        padding     : 0;
        text-align  : end;

        &:focus { outline: none; }
      }

      > small { font-size: inherit; opacity: 0.65; }
    }
  }`;

  get valueType () { return valueType(this.getAttr('type')); }

  // :::::: AXIS ::::::::::::::::::::::::::::::::::::::::::::::::

  /** [min, max] on the numeric track, from attributes or the type's own defaults */
  get bounds () {
    const domain    = this.valueType;
    const [low, up] = domain.bounds ?? [0, 100];
    const { max, min } = this.getAttr();

    return [
      min === undefined ? low : domain.toNumber(domain.parse(min)),
      max === undefined ? up  : domain.toNumber(domain.parse(max)),
    ];
  }

  get step () { return this.getAttr('step') ?? this.valueType.step ?? 1; }

  clamp (number) {
    const [min, max] = this.bounds;
    return Math.min(max, Math.max(min, Number(number) || 0));
  }

  // :::::: VALUE :::::::::::::::::::::::::::::::::::::::::::::::

  /** always an array internally, [value] or [from, to]. keeps both modes on one path */
  parseValue (raw) {
    const domain = this.valueType;
    const parts  = String(raw ?? '').split(',').filter(part => part !== '');
    const numbers = parts.map(part => this.clamp(domain.toNumber(domain.parse(part.trim()))));

    if (!this.getAttr('range')) return numbers.length ? [numbers[0]] : [this.bounds[0]];

    const [min, max] = this.bounds;
    const [from = min, to = max] = numbers;
    return from <= to ? [from, to] : [to, from];
  }

  /** the raw parts of the current attribute, per handle */
  get parts () { return String(this.getAttribute('value') ?? '').split(',').map(part => part.trim()); }

  formatValue (value) {
    const domain   = this.valueType;
    const previous = this.parts;
    const numbers  = Array.isArray(value) ? value : this.parseValue(value);

    // previous is handed down so a lossy axis keeps what it does not carry:
    // a color slider moves the hue and leaves saturation and lightness alone
    return numbers.map((number, index) => domain.format(domain.fromNumber(number, previous[index]))).join(',');
  }

  /** the values in their own type, not as track positions */
  get typedValue () {
    const domain   = this.valueType;
    const previous = this.parts;
    const typed    = this.value.map((number, index) => domain.fromNumber(number, previous[index]));
    return this.getAttr('range') ? typed : typed[0];
  }

  setAt (index, number) {
    if (this.isDisabled || this.getAttr('readonly')) return this;

    const numbers = [...this.value];
    numbers[index] = this.clamp(number);

    // handles must not cross each other
    if (this.getAttr('range')) numbers.sort((a, b) => a - b);

    this.commit(numbers);
    return this;
  }

  stepBy (direction) { return this.setAt(0, this.value[0] + direction * this.step); }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  onMount () {
    this.on('input', 'input[type="range"]', (event, input) => this.setAt(Number(input.dataset.index), input.value));

    this.on('change', ':scope > output > input', (event, input) => {
      const domain = this.valueType;
      this.setAt(Number(input.dataset.index), domain.toNumber(domain.parse(input.value)));
    });

    this.on('click', '[data-step]', (event, button) => {
      if (this.isDisabled) return;
      this.stepBy(Number(button.dataset.step));
    });
  }

  // :::::: RENDER ::::::::::::::::::::::::::::::::::::::::::::::

  /**
   * structure only. value and disabled are deliberately absent, otherwise every
   * keystroke would rebuild the markup and drop focus out of the number input.
   */
  render () {
    const { controls, editable, range, unit } = this.getAttr();
    const [min, max] = this.bounds;
    const step       = this.step;
    const domain     = this.valueType;

    const track = (index) => html`<input type="range" ${attrs({ 'data-index': index, max, min, step })} />`;

    const readout = (index) => editable
      ? html`<input type="${domain.input}" data-index="${index}" />`
      : html`<span data-index="${index}"></span>`;

    const stepButton = (direction, glyph) => html`
      <button type="button" data-step="${direction}"><aufbau-icon icon="${glyph}"></aufbau-icon></button>
    `;

    return html`
      ${controls && !range && stepButton(-1, 'lucide:minus')}
      <div>
        ${track(0)}
        ${range && track(1)}
      </div>
      ${controls && !range && stepButton(1, 'lucide:plus')}
      <output>
        ${readout(0)}
        ${range && html`–${readout(1)}`}
        ${unit && html`<small>${unit}</small>`}
      </output>
    `;
  }

  sync () {
    super.sync();

    const domain     = this.valueType;
    const numbers    = this.value;
    const parts      = this.parts;
    const [min, max] = this.bounds;
    const span       = (max - min) || 1;

    // the attribute already holds the formatted form, no need to round trip it
    const shown = (index) => parts[index] ?? domain.format(domain.fromNumber(numbers[index] ?? numbers[0]));

    for (const input of this.$$('input[data-index]')) {
      // never write back into the field the user is currently in
      if (input === document.activeElement) continue;

      const index = Number(input.dataset.index);
      setValue(input, input.type === 'range' ? (numbers[index] ?? numbers[0]) : shown(index));
    }

    for (const label of this.$$(':scope > output > span[data-index]')) {
      label.textContent = shown(Number(label.dataset.index));
    }

    // the filled portion, as percentages of the track, for css to pick up
    const from = ((numbers[0] - min) / span) * 100;
    const to   = numbers.length > 1 ? ((numbers[1] - min) / span) * 100 : from;

    this.style.setProperty('--slider-from', `${this.getAttr('range') ? from : 0}%`);
    this.style.setProperty('--slider-to',   `${to}%`);

    // a color slider shows where it is, not an abstract number
    if (this.getAttr('type') === 'color') this.style.setProperty('--slider-color', shown(0));
  }
}

AufbauSlider.init();
