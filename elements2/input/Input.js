// @aufbau/elements2/input/Input.js
// the base of every input-* element. it answers four questions and draws one look:
//
//   what      the type: fixed by the tag (input-number) or `type` (input-value)   ./types/
//   how many  one value, two with `range`, any number with `multiple`             ./values.js
//   from      free, or options: children, `src`, a list type                      ./options.js
//   how       `look`, drawn into the shadow root                                  ./looks/
//
// the element is the one form control: FormData, validity, reset and persist
// come from AufbauControl. a look renders, updates its markup and calls the
// methods below (setPart, step, select, toggle, …), nothing else.

// the looks draw icons inside the shadow root, where no autoloader looks
import '../svg/icon.js';

import { isArray } from '@pulgasari/is';

import { AufbauControl }            from '../core/AufbauControl.js';
import { html }                     from '../core/html.js';
import { LOOKS, lookFor, sheetOf }  from './looks/index.js';
import { OptionSource }             from './options.js';
import { TYPE_ATTRIBUTES, typeOf }  from './types/index.js';
import { joinValue, splitValue }    from './values.js';

// the frame of every look is the part `box`, never the host: page css such as a
// reset with * { padding: 0 } beats every :host rule
const STYLES = `
  :host {
    box-sizing      : border-box;
    color           : inherit;
    display         : inline-flex;
    font            : inherit;
    min-inline-size : 0;
    vertical-align  : middle;
  }

  :host([hidden])           { display: none; }
  :host(:state(disabled))   { opacity: 0.5; pointer-events: none; }

  *, *::before, *::after    { box-sizing: border-box; }
  [hidden]                  { display: none !important; }
  :focus                    { outline: none; }
  :focus-visible            { outline: 2px solid var(--color-ink, Highlight); outline-offset: 2px; }
  input:focus-visible       { outline: none; }
  svg-icon                  { flex: none; }

  [part~="box"] {
    align-items     : center;
    display         : flex;
    flex            : 1 1 auto;
    gap             : var(--input-gap, 0.5em);
    min-inline-size : 0;
  }

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
`;

export class Input extends AufbauControl {

  static shadow = { delegatesFocus: true };

  static attr = {
    ...TYPE_ATTRIBUTES,
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

  static styles = STYLES;

  // the type of a preset. <input-value> reads its `type` attribute instead
  static type = null;

  constructor () {
    super();
    this.source = new OptionSource(this, () => this.update());
  }

  // :::::: WHAT ::::::::::::::::::::::::::::::::::::::::::::::::

  get typeName  () { return this.constructor.type ?? this.getAttr('type') ?? 'text'; }
  get valueType () { return typeOf(this.typeName); }

  // a bool reads as a checkbox: getFormValues() and friends take `checked`
  get type () { return this.typeName === 'bool' ? 'checkbox' : this.typeName; }

  // :::::: HOW MANY ::::::::::::::::::::::::::::::::::::::::::::

  /** 'single', 'range' or 'multiple'. a list knows no range, a bool is always single */
  get count () {
    if (this.typeName === 'bool') return 'single';
    if (this.getAttr('multiple')) return 'multiple';
    return this.getAttr('range') && !this.isList ? 'range' : 'single';
  }

  // :::::: FROM ::::::::::::::::::::::::::::::::::::::::::::::::

  get options () { return this.source.all; }
  get isList  () { return Boolean(this.valueType.list || this.getAttr('src') || this.options.length); }

  // :::::: HOW :::::::::::::::::::::::::::::::::::::::::::::::::

  /** what decides which looks fit, see ./looks/index.js */
  get shape () {
    const type = this.valueType;
    return {
      axis      : Boolean(type.axis),
      count     : this.count,
      kind      : this.typeName === 'bool' ? 'bool' : this.isList ? 'list' : 'free',
      steppable : Boolean(type.axis) && type.steppable !== false,
      type      : this.typeName,
    };
  }

  // the look the author asked for. the element writes its own choice onto the
  // host so css can select [look="…"] in every case; that one is no request
  get askedLook () { return this._ownLook ? null : this.getAttribute('look'); }

  /** the asked look where it fits, else the type's, else the first that fits */
  get look       () { return lookFor(this.shape, this.askedLook, this.valueType.look); }
  get lookModule () { return LOOKS[this.look]; }

  reflectAttrs () {
    super.reflectAttrs();
    if (this.getAttribute('look') !== null && !this._ownLook) return this;

    const look = this.look;
    this._ownLook = true;
    if (this.getAttribute('look') === look) return this;

    this._reflecting = true;
    try     { this.setAttribute('look', look); }
    finally { this._reflecting = false; }
    return this;
  }

  onAttributeChange (name) {
    if (name === 'look') this._ownLook = false;
  }

  /** the stylesheet of the drawn look, the only one adopted */
  adoptLook () {
    const sheet = sheetOf(this.look);
    const root  = this.shadowRoot;
    if (root.adoptedStyleSheets.includes(sheet)) return;
    root.adoptedStyleSheets = [...root.adoptedStyleSheets.filter(other => !other.isLookSheet), sheet];
  }

  /**
   * listeners that live as long as `key` stays the same: those of the look
   * until it changes, those of the type until it changes
   */
  bindWhile (slot, key, setup) {
    const bound = this._bound ??= {};
    if (bound[slot]?.key === key) return;

    bound[slot]?.stops.forEach(stop => stop());
    const stops = [];
    bound[slot] = { key, stops };
    setup?.((...args) => { const stop = this.on(...args); stops.push(stop); return stop; });
  }

  // :::::: VALUE :::::::::::::::::::::::::::::::::::::::::::::::

  /** the value as its parts: [value], [from, to] or [a, b, …] */
  get values () { return splitValue(this.getAttribute('value'), this.count); }

  // the value stays a string, an array of parts is joined
  parseValue  (raw)   { return raw == null ? '' : String(raw); }
  formatValue (value) { return isArray(value) ? joinValue(value, this.count) : value == null ? '' : String(value); }

  /** the value in its type: a number, epoch ms, … an array for range and multiple */
  get typedValue () {
    const type  = this.valueType;
    const typed = this.values.map(raw => raw === '' ? null : type.parse(raw));
    return this.count === 'single' ? typed[0] : typed;
  }

  /** multiple values submit one FormData entry each, like a native multi select */
  get formValue () {
    if (this.count !== 'multiple') return super.formValue;

    const name   = this.getAttr('name');
    const values = this.values;
    if (!values.length) return null;
    if (!name)          return this.value;

    const data = new FormData;
    for (const value of values) data.append(name, value);
    return data;
  }

  get isLocked () { return this.isDisabled || Boolean(this.getAttr('readonly')); }

  /** the whole value at once, a string or its parts */
  setValue (value) { return this.isLocked ? this : this.commit(value); }

  /** text typed into one part. `final` when the field is left: normalized, a range put in order */
  setPart (index, text, { final = false } = {}) {
    const parts = this.values;
    parts[index] = final ? this.normalize(text) : String(text ?? '');
    return this.setValue(final && this.count === 'range' ? this.order(parts) : parts);
  }

  normalize (text) {
    const trimmed = String(text ?? '').trim();
    return this.valueType.normalize?.(trimmed) ?? trimmed;
  }

  /** from never lies behind to */
  order (parts) {
    const [from, to] = parts;
    return from && to && this.toNumber(from) > this.toNumber(to) ? [to, from] : parts;
  }

  add (text) {
    const value = this.normalize(String(text ?? '').replaceAll(',', ' '));
    return value && !this.values.includes(value) ? this.setValue([...this.values, value]) : this;
  }

  removeAt (index) { return this.setValue(this.values.filter((value, position) => position !== index)); }

  // :::::: AXIS ::::::::::::::::::::::::::::::::::::::::::::::::
  // a type with an axis (number, date, time, color, …) can be stepped and slid

  toNumber   (raw)              { const type = this.valueType; return type.axis.toNumber(type.parse(raw)); }
  fromNumber (number, previous) { const type = this.valueType; return type.format(type.axis.fromNumber(number, previous)); }

  /** [min, max] the author gave, open ends are infinite */
  get limits () {
    const { max, min } = this.getAttr();
    return [min === undefined ? -Infinity : this.toNumber(min), max === undefined ? Infinity : this.toNumber(max)];
  }

  /** [min, max] of a track: the author's, else the type's own */
  get bounds () {
    const [low, up]    = this.valueType.axis?.bounds ?? [0, 100];
    const { max, min } = this.getAttr();
    return [min === undefined ? low : this.toNumber(min), max === undefined ? up : this.toNumber(max)];
  }

  get stepSize () { return this.getAttr('step') || this.valueType.axis?.step || 1; }

  /** a position on the axis into one part. `track` keeps it within the bounds of a track */
  setNumber (index, number, { track = false } = {}) {
    const [min, max] = track ? this.bounds : this.limits;
    const parts      = this.values;
    parts[index] = this.fromNumber(Math.min(max, Math.max(min, Number(number) || 0)), parts[index]);

    // a range set by one end gets the other one too
    if (this.count === 'range') {
      parts[0] ||= this.fromNumber(this.bounds[0]);
      parts[1] ||= this.fromNumber(this.bounds[1]);
    }

    return this.setValue(this.count === 'range' ? this.order(parts) : parts);
  }

  step (direction, index = 0) {
    const current = this.values[index] ?? '';
    const [min]   = this.limits;
    const from    = current === '' ? (Number.isFinite(min) ? min : 0) : this.toNumber(current);
    return this.setNumber(index, from + direction * this.stepSize);
  }

  // :::::: CHOICE ::::::::::::::::::::::::::::::::::::::::::::::

  get selected () { return new Set(this.values.filter(Boolean)); }

  /** picks an option. with `multiple` it is added or taken away */
  select (value) {
    if (this.count !== 'multiple') return this.setValue(value);

    const next = this.selected;
    if (next.has(value)) next.delete(value); else next.add(value);
    return this.setValue([...next]);
  }

  /** the next enabled option, around at both ends */
  cycle (direction = 1) {
    const options = this.options.filter(option => !option.disabled);
    if (!options.length) return this;

    const index = options.findIndex(option => option.value === this.value);
    const from  = index < 0 ? (direction > 0 ? -1 : 0) : index;
    return this.select(options[(((from + direction) % options.length) + options.length) % options.length].value);
  }

  // :::::: BOOL ::::::::::::::::::::::::::::::::::::::::::::::::

  get checked ()     { return this.getAttribute('value') === 'true'; }
  set checked (next) { this.commit(next ? 'true' : '', { notify: false }); }

  toggle () { return this.setValue(this.checked ? '' : 'true'); }

  // :::::: FOR THE LOOKS :::::::::::::::::::::::::::::::::::::::

  get actions     () { return this.getAttr('actions')     ?? this.valueType.actions     ?? ''; }
  get placeholder () { return this.getAttr('placeholder') ?? this.valueType.placeholder ?? ''; }

  get iconName () {
    const icon = this.getAttr('icon');
    return icon === 'false' ? null : icon || this.valueType.icon || null;
  }

  // the contract of the copy, paste, clear and reveal buttons (../core/actions.js)
  actionText   () { return this.value; }
  actionTarget () { return this.isLocked ? null : this.focusTarget; }
  revealTarget () { return this.focusTarget; }

  get focusTarget () { return this.lookModule?.focus?.(this) ?? this.root.querySelector('input, button'); }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  captureDefaults () {
    // <input-bool checked> is the same as value="true"
    if (this.typeName === 'bool' && this.hasAttribute('checked') && !this.hasAttribute('value')) this.setAttribute('value', 'true');
    return super.captureDefaults();
  }

  onMount () {
    // the native input event is composed and would leave the shadow root next to
    // the one commit() announces. only the host speaks for the control
    this.on(this.root, 'input',       event => event.stopPropagation());
    this.on(this.root, 'beforeinput', event => event.stopPropagation());

    // option children added, removed or changed. the host's own attributes are no option
    const observer = new MutationObserver(records => { if (records.some(record => record.target !== this)) this.update(); });
    observer.observe(this, { attributes: true, childList: true, subtree: true, attributeFilter: ['value', 'label', 'icon', 'disabled', 'selected'] });
    this.track(() => observer.disconnect());

    // a preselected <input-option selected> is the default too, form.reset() goes back to it
    if (!this.hasAttribute('value')) {
      const preselected = this.options.filter(option => option.selected).map(option => option.value);
      if (preselected.length) {
        this.commit(this.count === 'multiple' ? preselected : preselected[0], { notify: false });
        this._defaultValue = this.getAttribute('value') ?? '';
      }
    }
  }

  // a disconnect released every listener, the next connect binds them anew
  onUnmount () { this._bound = null; }

  update () {
    if (this._mounted) this.source.refresh();
    return super.update();
  }

  render () { return html`<div part="box">${this.lookModule.render(this)}</div>`; }

  sync () {
    super.sync();

    const look = this.lookModule;
    this.adoptLook();
    this.bindWhile('look', this.look,     on => look.events?.(this, on));
    this.bindWhile('type', this.typeName, on => this.valueType.setup?.(this, on));

    if (this.internals) this.internals.role = look.role?.(this) ?? null;
    look.update?.(this);
  }
}

export default Input;
