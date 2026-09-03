// <aufbau-slider>
// a value on an axis. every type is projected onto one numeric track through
// valueTypes, so color, date, datetime, time and number share this one
// implementation. `range` turns it into a two handle span.

import { AufbauControl, AXIS_TYPES, valueType } from './core/index.js';
import { attrs, html } from './core/html.js';
import * as dom from '@domina/core';

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

  // the fill consumes --slider-from / --slider-to, both are already written by
  // sync(). in range mode the two native tracks are stacked on top of each other
  // so they read as one axis with two handles
  static styles = `
    aufbau-slider { --slider-track-size: 0.35em; --slider-thumb-size: 1em; }

    aufbau-slider .aufbau-slider-wrapper {
      display: flex;
      align-items: center;
      gap: var(--aufbau-control-gap, 0.5em);
      inline-size: 100%;
    }

    aufbau-slider .slider-tracks {
      position: relative;
      flex: 1 1 auto;
      /* in range mode both tracks are taken out of flow, so there is nothing
         left to give this box an intrinsic width. without a floor it collapses */
      min-inline-size: var(--slider-min-size, 10em);
      block-size: var(--slider-thumb-size);
      display: flex;
      align-items: center;
      isolation: isolate;
    }

    aufbau-slider .slider-track {
      appearance: none;
      -webkit-appearance: none;
      inline-size: 100%;
      block-size: var(--slider-thumb-size);
      margin: 0;
      background: none;
      z-index: 2;
    }

    aufbau-slider .slider-track:focus { outline: none; }

    /* both handles have to stay reachable, so only the thumbs take pointer events */
    aufbau-slider .is-range .slider-track {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    aufbau-slider .is-range .slider-track::-webkit-slider-thumb { pointer-events: auto; }
    aufbau-slider .is-range .slider-track::-moz-range-thumb     { pointer-events: auto; }

    aufbau-slider .slider-fill {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: var(--slider-from, 0%);
      inline-size: calc(var(--slider-to, 0%) - var(--slider-from, 0%));
      block-size: var(--slider-track-size);
      translate: 0 -50%;
      z-index: 1;
      pointer-events: none;
    }

    aufbau-slider .slider-display {
      display: flex;
      align-items: center;
      gap: 0.25em;
      flex: none;
      font-variant-numeric: tabular-nums;
    }

    aufbau-slider .slider-number {
      inline-size: var(--slider-readout-size, 5ch);
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-align: end;
    }

    aufbau-slider .slider-number:focus { outline: none; }
    aufbau-slider .slider-unit { opacity: 0.65; }

    aufbau-slider .slider-step {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      margin: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
  `;

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
    this.on('input', '.slider-track', (event, input) => this.setAt(Number(input.dataset.index), input.value));

    this.on('change', '.slider-number', (event, input) => {
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
    const { controls, editable, range, type, unit } = this.getAttr();
    const [min, max] = this.bounds;
    const step       = this.step;
    const domain     = this.valueType;

    const track = (index) => html`<input class="slider-track" type="range" ${attrs({
      'data-index' : index,
      max,
      min,
      step,
    })} />`;

    const readout = (index) => editable
      ? html`<input class="slider-number" type="${domain.input}" ${attrs({ 'data-index': index })} />`
      : html`<span class="slider-value" data-index="${index}"></span>`;

    const stepButton = (direction, glyph) => html`
      <button type="button" class="slider-step btn-${direction > 0 ? 'inc' : 'dec'}" data-step="${direction}">
        <aufbau-icon icon="${glyph}"></aufbau-icon>
      </button>
    `;

    return html`
      <div class="aufbau-slider-wrapper type-${type} ${range ? 'is-range' : ''}">
        ${controls && !range && stepButton(-1, 'lucide:minus')}

        <div class="slider-tracks">
          ${track(0)}
          ${range && track(1)}
          <div class="slider-fill"></div>
        </div>

        ${controls && !range && stepButton(1, 'lucide:plus')}

        <div class="slider-display">
          ${readout(0)}
          ${range && html`<span class="slider-separator">–</span>`}
          ${range && readout(1)}
          ${unit && html`<span class="slider-unit">${unit}</span>`}
        </div>
      </div>
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

    for (const input of this.$$('.slider-track, .slider-number')) {
      const index = Number(input.dataset.index);

      // never write back into the field the user is currently in
      if (input === document.activeElement) continue;

      dom.setValue(input, input.classList.contains('slider-track')
        ? (numbers[index] ?? numbers[0])
        : shown(index));
    }

    for (const label of this.$$('.slider-value')) {
      label.textContent = shown(Number(label.dataset.index));
    }

    // the filled portion, as percentages of the track, for css to pick up
    const from = ((numbers[0] - min) / span) * 100;
    const to   = numbers.length > 1 ? ((numbers[1] - min) / span) * 100 : from;

    const wrapper = this.$('.aufbau-slider-wrapper');
    if (wrapper) {
      wrapper.style.setProperty('--slider-from', `${this.getAttr('range') ? from : 0}%`);
      wrapper.style.setProperty('--slider-to',   `${to}%`);
    }

    // a color slider shows where it is, not an abstract number
    if (this.getAttr('type') === 'color') this.style.setProperty('--slider-color', shown(0));
  }
}

AufbauSlider.init();
