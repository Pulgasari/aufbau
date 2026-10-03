// <output-value>

// :::::: IMPORTS

import { AufbauSourceElement, getConfig } from '@aufbau/element';
import { TYPES, typeOf }                  from './input/types/index.js';
import { actionButtons, bindActions }     from '../lib/actions.js';
import { attrs, html }                    from '../lib/html.js';

// :::::: CONSTANTS

const TYPE_NAMES = Object.keys(TYPES).filter(name => !TYPES[name].list); // the types of the inputs, the lists aside
const TIME_TYPES = new Set(['date', 'datetime', 'time']); // types that are an instant rather than a string, so they render as <time>
const NUMERIC    = /^-?\d+$/;
const STYLES     = ['short', 'medium', 'long', 'full']; // Intl's four date/time presets. anything else falls through to the machine form
const CLOCK      = { short: 'short', medium: 'medium', long: 'medium', full: 'medium' };

const INTL_OPTIONS = {
  date     : (style) => ({ dateStyle: style }),
  datetime : (style) => ({ dateStyle: style, timeStyle: CLOCK[style] }),
  time     : (style) => ({ timeStyle: CLOCK[style] }),
};

// :::::: TIME

const pad = (value, length = 2) => String(value).padStart(length, '0');

const isoDate  = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const isoTime  = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const isoStamp = (date) => `${isoDate(date)}T${isoTime(date)}`;

const instantOf = (type, value) => type === 'time'
  ? new Date(1970, 0, 1, 0, 0, 0, value)
  : new Date(value);

// :::::: FORMAT

function machineText (type, value) {
  if (value == null)       return '';
  if (type === 'date')     return isoDate (new Date(value));
  if (type === 'datetime') return isoStamp(new Date(value));
  if (type === 'time')     return isoTime (instantOf('time', value));
  return typeOf(type).format(value);
}

function displayText (type, value, format, locale) {
  if (value == null) return '';

  return (INTL_OPTIONS[type] && STYLES.includes(format))
       ? new Intl.DateTimeFormat(locale, INTL_OPTIONS[type](format)).format(instantOf(type, value))
       : (type === 'number' && format === 'locale')
       ? new Intl.NumberFormat(locale).format(value)
       : machineText(type, value);
}

// :::::: MAIN

export default class OutputValue extends AufbauSourceElement {
  static attr = {
    format : String,
    locale : String,
    type   : { type: String, default: 'text', values: TYPE_NAMES },
    value  : String, // the value. absent, the children are it (see get value)
    copy   : Boolean,
    icon   : String,
  };

  static output = 'span';

  static styles = `
    output-value {
      display: inline;

      &:state(empty) { display: none; }

      > span {
        align-items : baseline;
        display     : inline-flex;
        gap         : var(--value-gap, 0.25rem);
      }

      &:is([type="date"], [type="datetime"], [type="number"], [type="time"], [type="year"]) > span > :is(span, time) {
        font-variant-numeric: tabular-nums;
      }

      > span > svg-icon { align-self: center; }

      > span > button {
        align-self  : center;
        background  : none;
        border      : 0;
        color       : inherit;
        cursor      : pointer;
        display     : inline-flex;
        font        : inherit;
        line-height : 0;
        margin      : 0;
        padding     : 0;
      }
    }
  `;

  // :::::: VALUE

  parseValue (raw) {
    const type = this.getAttr('type');
    const text = String(raw ?? '').trim();
    if (TIME_TYPES.has(type) && NUMERIC.test(text)) return Number(text);
    if (type === 'duration') return text;
    return typeOf(type).parse(raw);
  }

  formatValue (value) { return machineText(this.getAttr('type'), value); }

  get value () {
    const raw = this.getAttribute('value') ?? this.sourceText.trim();
    return raw === '' ? null : this.parseValue(raw);
  }

  set value (next) {
    this.setAttr({ value: next == null || next === '' ? false : this.formatValue(this.parseValue(next)) });
  }

  // what is shown
  get text () {
    const { type } = this.getAttr();
    try   { return displayText(type, this.value, this.formatName(), this.getAttr('locale') || undefined); }
    catch { return machineText(type, this.value); }
  }

  get machine () { return this.formatValue(this.value); }

  // :::::: CONFIG

  // the attribute, else the config of the type (output-value-date-format), else the config output-value-format
  formatName () {
    const type = this.getAttr('type');
    return this.getAttribute('format') ?? getConfig(`${this.localName}-${type}-format`) ?? this.getAttr('format') ?? '';
  }

  // the icon to show before the value, '' for none
  iconName () {
    if (!this.hasAttr('icon')) return '';
    return this.getAttr('icon') || typeOf(this.getAttr('type')).icon || '';
  }

  // :::::: LIFECYCLE

  onConnected () {
    bindActions(this);
  }

  sync () { this.states.toggle('empty', !this.text); }

  actionText   () { return this.text; }
  actionTarget () { return null; }

  // :::::: RENDER

  render () {
    const { copy, type } = this.getAttr();
    const text = this.text;
    if (!text) return html``;

    const icon = this.iconName();

    const body = TIME_TYPES.has(type)
      ? html`<time ${attrs({ datetime: this.machine })}>${text}</time>`
      : html`<span>${text}</span>`;

    return html`
      ${icon && html`<svg-icon icon="${icon}"></svg-icon>`}
      ${body}
      ${copy && actionButtons(['copy'])}
    `;
  }
}

OutputValue.init();
