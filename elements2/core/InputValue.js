// @aufbau/elements2/core/InputValue.js
// the base of every input-* element. four questions, four places:
//
//   what      the type: the tag of a preset (input-number), `type` on <input-value>
//   how many  one value, two with `range` ("from..to"), n with `multiple` ("a,b,c")
//   from      free, or a list: option children, `src`, or a list type (language, …)
//   how       `look`, a render module of ../looks/, drawn into the own shadow root
//
// one element, one control: no inner element holds the value, nothing is
// forwarded. the looks share one protocol of data attributes, handled here:
//
//   input[data-index]   a text field of the value at that index
//   input[data-axis]    a native range input, the position of the value at that index
//   [data-step]         steps the value at [data-index] (default 0) by ±1 step
//   [data-value]        a rendered option, selects its value
//   [data-remove]       removes the value at that index (multiple)
//   [data-toggle]       turns a bool on or off
//   [data-action]       copy, paste, clear, reveal (./actions.js)

// the looks draw icons inside the shadow root, where no autoloader looks
import '../svg/icon.js';

import { importFile } from '@aufbau/import';
import { isArray }    from '@pulgasari/is';

import { AufbauControl }                                 from './AufbauControl.js';
import { bindActions }                                   from './actions.js';
import { html }                                          from './html.js';
import { LIST_ATTR, listType }                           from './listTypes.js';
import { localeOf }                                      from './locale.js';
import { normalizeOptions, observeOptions, readOptions } from './options.js';
import { AXIS_TYPES, valueType }                         from './valueTypes.js';
import { LOOKS, lookFor }                                from '../looks/index.js';

const SEPARATORS = { multiple: ',', range: '..' };

const isInactive = item => item.hidden || item.matches(':disabled, [aria-disabled="true"]');

// structure shared by every look. the looks add theirs under :host([look="…"]).
// the box carries frame and spacing, not the host: page css like a reset with
// * { padding: 0 } beats every :host rule, it never reaches into the shadow root
const BASE = `
  :host {
    box-sizing      : border-box;
    color           : inherit;
    display         : inline-flex;
    font            : inherit;
    min-inline-size : 0;
    vertical-align  : middle;
  }

  [part~="box"] {
    align-items     : center;
    display         : flex;
    flex            : 1 1 auto;
    gap             : var(--input-gap, 0.5em);
    min-inline-size : 0;
  }

  :host([hidden]) { display: none; }

  :host(:state(disabled)) { opacity: 0.5; pointer-events: none; }

  *, *::before, *::after { box-sizing: border-box; }

  [hidden] { display: none !important; }

  button {
    align-items     : center;
    appearance      : none;
    background      : none;
    border          : 0;
    color           : inherit;
    cursor          : pointer;
    display         : inline-flex;
    flex            : none;
    font            : inherit;
    gap             : 0.5em;
    justify-content : center;
    margin          : 0;
    padding         : 0;
  }

  input {
    background      : none;
    border          : 0;
    color           : inherit;
    font            : inherit;
    margin          : 0;
    min-inline-size : 0;
    padding         : 0;
  }

  :focus { outline: none; }

  button:focus-visible { outline: 2px solid var(--color-ink, Highlight); outline-offset: 2px; }

  svg-icon { flex: none; }

  [part~="action"], [part~="icon"] { opacity: 0.65; }
  [part~="action"]:hover           { opacity: 1; }
`;

export class InputValue extends AufbauControl {

  static shadow = { delegatesFocus: true };

  static attr = {
    ...LIST_ATTR,
    actions      : String,
    autocomplete : String,
    icon         : String,
    iconChecked  : String,
    iconsOnly    : Boolean,
    look         : String,
    max          : String,
    maxlength    : Number,
    min          : String,
    minlength    : Number,
    multiple     : Boolean,
    pattern      : String,
    placeholder  : String,
    range        : Boolean,
    readout      : { type: Boolean, default: true },
    searchable   : Boolean,
    src          : String,
    step         : Number,
    type         : String,
    unit         : String,
  };

  static styles () { return [BASE, ...Object.values(LOOKS).map(look => look.styles)]; }

  // the type of a preset, <input-value> reads its `type` attribute instead
  static type = null;

  // :::::: TYPE ::::::::::::::::::::::::::::::::::::::::::::::::

  get typeName  () { return this.constructor.type ?? this.getAttr('type') ?? 'text'; }
  get valueType () { return valueType(this.typeName); }
  get listType  () { return listType(this.typeName); }

  // a bool reads as a checkbox: getFormValues() and friends take `checked`
  get type () { return this.isBool ? 'checkbox' : this.typeName; }

  get isBool () { return this.typeName === 'bool'; }
  get isAxis () { return AXIS_TYPES.includes(this.typeName); }
  get isList () { return Boolean(this.listType) || Boolean(this.getAttr('src')) || this.options.length > 0; }

  /** one value, two (range) or any number (multiple) */
  get count () {
    if (this.isBool) return 'single';
    if (this.getAttr('multiple')) return 'multiple';
    return this.getAttr('range') && !this.isList ? 'range' : 'single';
  }

  /** what decides which looks fit */
  get shape () {
    return {
      axis  : this.isAxis,
      count : this.count,
      kind  : this.isBool ? 'bool' : this.isList ? 'list' : 'free',
      type  : this.typeName,
    };
  }

  // :::::: LOOK ::::::::::::::::::::::::::::::::::::::::::::::::

  /** the look asked for where it fits, else the type's own, else the first that fits */
  get look () {
    const asked = this._lookReflected ? null : this.getAttribute('look');
    return lookFor(this.shape, asked, this.valueType.look, this.listType?.look);
  }

  get lookModule () { return LOOKS[this.look]; }

  // the resolved look goes onto the host where the author gave none, so css can
  // select [look="slider"] in every case. a look the author asked for stays as
  // it is, even when it does not fit and another one is drawn
  reflectAttrs () {
    super.reflectAttrs();

    const own = this.getAttribute('look');
    if (own !== null && !this._lookReflected) return this;

    const look = this.look;
    this._lookReflected = true;
    if (own === look) return this;

    this._reflecting = true;
    try     { this.setAttribute('look', look); }
    finally { this._reflecting = false; }
    return this;
  }

  onAttributeChange (name) {
    if (name === 'look') this._lookReflected = false;
  }

  // the listeners of a look live as long as the look, a switch drops them
  bindLook () {
    const look = this.look;
    if (this._boundLook === look) return;

    this._lookStops?.forEach(stop => stop());
    this._boundLook = look;

    const stops = this._lookStops = [];
    this.lookModule.bind?.(this, (...args) => { const stop = this.on(...args); stops.push(stop); return stop; });
  }

  // :::::: OPTIONS :::::::::::::::::::::::::::::::::::::::::::::

  /** [{ value, label, icon, disabled }]: the option children, then `src`, then the list type */
  get options () {
    return [...readOptions(this), ...(this._remoteOptions ?? []), ...(this._typeOptions ?? [])];
  }

  /** fetches `src` and builds the entries of the list type, each only when its input changed */
  loadOptions () {
    const src = this.getAttr('src') ?? null;
    if (src !== (this._loadedSrc ?? null)) {
      this._loadedSrc    = src;
      this._remoteOptions = null;
      if (src) {
        this.setSkeleton(true);
        importFile(src)
          .then(data => normalizeOptions(data))
          .catch(error => { console.warn(`[${this.localName}] could not load options from "${src}":`, error); return []; })
          .then(options => {
            if (this._loadedSrc !== src) return;
            this._remoteOptions = options;
            this.setSkeleton(false);
            this.update();
          });
      }
    }

    const list = this.listType;
    const key  = list ? `${this.typeName}|${localeOf(this)}|${list.key?.(this) ?? ''}` : '';
    if (key === (this._typeKey ?? '')) return;

    this._typeKey     = key;
    this._typeOptions = null;
    if (!list) return;

    const entries = list.entries(this, localeOf(this));
    if (!entries?.then) { this._typeOptions = entries; return; }

    entries
      .catch(error => { console.warn(`[${this.localName}] could not build the ${this.typeName} list:`, error); return []; })
      .then(options => {
        if (this._typeKey !== key) return;
        this._typeOptions = options;
        this.update();
      });
  }

  // :::::: VALUE :::::::::::::::::::::::::::::::::::::::::::::::

  get separator () { return SEPARATORS[this.count] ?? null; }

  /** the value as a list of strings: [value], [from, to] or [a, b, …] */
  get values () {
    const raw       = this.getAttribute('value') ?? '';
    const separator = this.separator;

    if (!separator) return [raw];
    if (this.count === 'range') {
      const [from = '', to = ''] = raw ? raw.split(separator).map(part => part.trim()) : [];
      return [from, to];
    }
    return raw.split(separator).map(part => part.trim()).filter(Boolean);
  }

  // the value stays a string, as on a native input. lists are joined here
  parseValue (raw) { return raw == null ? '' : String(raw); }

  formatValue (value) {
    if (!isArray(value)) return value == null ? '' : String(value);
    if (this.count === 'range') return value.some(part => part) ? value.map(part => part ?? '').join(this.separator) : '';
    return value.filter(part => part != null && part !== '').join(this.separator ?? ',');
  }

  /** the value in its type: a number, epoch ms, … an array for range and multiple */
  get typedValue () {
    const domain = this.valueType;
    const typed  = this.values.map(raw => raw === '' ? null : domain.parse(raw));
    return this.count === 'single' ? typed[0] : typed;
  }

  /** multiple values submit one FormData entry each, like a native multi select */
  get formValue () {
    if (this.count !== 'multiple') return super.formValue;

    const values = this.values;
    const name   = this.getAttr('name');
    if (!values.length) return null;
    if (!name)          return values.join(this.separator);

    const data = new FormData;
    for (const value of values) data.append(name, value);
    return data;
  }

  get isLocked () { return this.isDisabled || Boolean(this.getAttr('readonly')); }

  /** typed text into the value at `index`. `normalize` when the field is left */
  setAt (index, raw, { normalize = false } = {}) {
    if (this.isLocked) return this;

    const values = this.count === 'single' ? [this.getAttribute('value') ?? ''] : [...this.values];
    values[index] = normalize ? this.normalize(raw) : String(raw ?? '');
    if (normalize && this.count === 'range') this.order(values);

    return this.commit(this.count === 'single' ? values[0] : values);
  }

  normalize (raw) {
    const text = String(raw ?? '').trim();
    return this.valueType.normalize?.(text) ?? text;
  }

  // from never lies behind to
  order (values) {
    const [from, to] = values;
    if (from && to && this.toNumber(from) > this.toNumber(to)) values.reverse();
    return values;
  }

  removeAt (index) {
    if (this.isLocked) return this;
    return this.commit(this.values.filter((value, position) => position !== index));
  }

  add (raw) {
    const value = this.normalize(String(raw ?? '').replaceAll(this.separator ?? ',', ' '));
    if (this.isLocked || !value || this.values.includes(value)) return this;
    return this.commit([...this.values, value]);
  }

  // :::::: AXIS ::::::::::::::::::::::::::::::::::::::::::::::::
  // a type with a numeric axis (number, date, time, color, …) can be stepped and slid

  toNumber   (raw)              { const domain = this.valueType; return domain.toNumber(domain.parse(raw)); }
  fromNumber (number, previous) { const domain = this.valueType; return domain.format(domain.fromNumber(number, previous)); }

  /** [min, max] given by the author, open ends as infinity */
  get limits () {
    const { max, min } = this.getAttr();
    return [min === undefined ? -Infinity : this.toNumber(min), max === undefined ? Infinity : this.toNumber(max)];
  }

  /** [min, max] of a track: the author's, else the type's own */
  get bounds () {
    const [low, up]    = this.valueType.bounds ?? [0, 100];
    const { max, min } = this.getAttr();
    return [min === undefined ? low : this.toNumber(min), max === undefined ? up : this.toNumber(max)];
  }

  get stepSize () { return this.getAttr('step') || this.valueType.step || 1; }

  setNumber (index, number, [min, max] = this.limits) {
    if (this.isLocked) return this;

    const clamped = Math.min(max, Math.max(min, Number(number) || 0));
    if (this.count !== 'range') return this.commit(this.fromNumber(clamped, this.values[0]));

    // a range set by one handle gets its other end too
    const [low, up] = this.bounds;
    const values    = [...this.values];
    values[index] = this.fromNumber(clamped, values[index]);
    values[0]   ||= this.fromNumber(low);
    values[1]   ||= this.fromNumber(up);
    return this.commit(this.order(values));
  }

  stepBy (direction, index = 0) {
    if (this.isLocked) return this;
    const current = this.values[index] ?? '';
    const [min]   = this.limits;
    const from    = current === '' ? (Number.isFinite(min) ? min : 0) : this.toNumber(current);
    return this.setNumber(index, from + direction * this.stepSize);
  }

  // :::::: CHOICE ::::::::::::::::::::::::::::::::::::::::::::::

  get selected () { return new Set(this.values.filter(Boolean)); }

  select (value) {
    if (this.isLocked) return this;

    if (this.count !== 'multiple') this.commit(value);
    else {
      const next = this.selected;
      if (next.has(value)) next.delete(value); else next.add(value);
      this.commit([...next]);
    }

    this.lookModule.selected?.(this);
    return this;
  }

  /** steps through the enabled options, around at both ends */
  cycle (step = 1) {
    const options = this.options.filter(option => !option.disabled);
    if (!options.length) return this;

    const index = options.findIndex(option => option.value === this.value);
    const from  = index < 0 ? (step > 0 ? -1 : 0) : index;
    return this.select(options[(((from + step) % options.length) + options.length) % options.length].value);
  }

  // :::::: BOOL ::::::::::::::::::::::::::::::::::::::::::::::::

  get checked ()     { return this.getAttribute('value') === 'true'; }
  set checked (next) { this.commit(next ? 'true' : '', { notify: false }); }

  toggleChecked () {
    if (this.isLocked) return this;
    return this.commit(this.checked ? '' : 'true');
  }

  // :::::: ACTIONS :::::::::::::::::::::::::::::::::::::::::::::

  get actions () { return this.getAttr('actions') ?? this.valueType.actions ?? ''; }

  actionText   () { return this.getAttribute('value') ?? ''; }
  actionTarget () { return this.isLocked ? null : this.focusTarget; }
  revealTarget () { return this.focusTarget; }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  captureDefaults () {
    // <input-bool checked> is the same as value="true"
    if (this.isBool && this.hasAttribute('checked') && !this.hasAttribute('value')) this.setAttribute('value', 'true');
    return super.captureDefaults();
  }

  get focusTarget () {
    return this.lookModule?.focusTarget?.(this)
        ?? this.root.querySelector('input:not([type="hidden"]), [role="combobox"], [tabindex="0"], button');
  }

  onMount () {
    bindActions(this);
    this.track(observeOptions(this, () => this.update()));

    // the native input event is composed and would leave the shadow root next to
    // the one commit() announces. only the host speaks for the control
    this.on(this.root, 'input',       event => event.stopPropagation());
    this.on(this.root, 'beforeinput', event => event.stopPropagation());

    this.on('input',  'input[data-index]', (event, input) => this.setAt(Number(input.dataset.index), input.value));
    this.on('change', 'input[data-index]', (event, input) => this.setAt(Number(input.dataset.index), input.value, { normalize: true }));
    this.on('input',  'input[data-axis]',  (event, input) => this.setNumber(Number(input.dataset.axis), Number(input.value), this.bounds));

    this.on('click', '[data-step]',   (event, button) => this.stepBy(Number(button.dataset.step), Number(button.dataset.index ?? 0)));
    this.on('click', '[data-remove]', (event, button) => this.removeAt(Number(button.dataset.remove)));
    this.on('click', '[data-toggle]', () => this.toggleChecked());
    this.on('click', '[data-value]',  (event, item) => {
      if (this.root.contains(item) && !isInactive(item)) this.select(item.dataset.value);
    });

    // a preselected <input-option selected> is the default too, form.reset() goes back to it
    if (!this.hasAttribute('value')) {
      const preselected = this.options.filter(option => option.selected).map(option => option.value);
      if (preselected.length) {
        this.commit(this.count === 'multiple' ? preselected : preselected[0], { notify: false });
        this._defaultValue = this.getAttribute('value') ?? '';
      }
    }
  }

  onUnmount () { this._boundLook = null; }

  update () {
    if (this._mounted) this.loadOptions();
    return super.update();
  }

  render () { return html`<div part="box">${this.lookModule.render(this)}</div>`; }

  sync () {
    super.sync();
    this.bindLook();

    if (this.internals) this.internals.role = this.lookModule.role?.(this) ?? null;
    this.lookModule.sync?.(this);
  }
}

export default InputValue;
