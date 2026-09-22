// <aufbau-value>

/*
<aufbau-value type="date">1776556800000</aufbau-value>
<aufbau-value type="date" format="medium" value="2026-04-20"></aufbau-value>
<aufbau-value type="time" icon>14:30</aufbau-value>
<aufbau-value type="url" icon copy>https://example.com</aufbau-value>
*/

// :::::: IMPORTS

import { AufbauElement, TYPE_NAMES, valueType } from './core/index.js';
import { attrs, html } from './core/html.js';
import { configKeys }  from './core/AufbauConfig.js';

// :::::: CONSTANTS

const TAG           = 'aufbau-value';
const COPY_FEEDBACK = 2000;
const TIME_TYPES    = new Set(['date', 'datetime', 'time']); // types that are an instant rather than a string, so they render as <time>       
const NUMERIC       = /^-?\d+$/;
const STYLES        = ['short', 'medium', 'long', 'full']; // Intl's four date/time presets. anything else falls through to the machine form     
const CLOCK         = { short: 'short', medium: 'medium', long: 'medium', full: 'medium' };

const INTL_OPTIONS = {
  date     : (style) => ({ dateStyle: style }),
  datetime : (style) => ({ dateStyle: style, timeStyle: CLOCK[style] }),
  time     : (style) => ({ timeStyle: CLOCK[style] }),
};

// :::::: TIME

const pad = (value, length = 2) => String(value).padStart(length, '0');

// local wall clock rather than toISOString(): an hour past midnight in UTC+2 is
// still yesterday in utc, and the date someone reads has to be the date they are
// living in. this is why the machine forms are here and not taken from
// valueTypes.js, whose formats belong to <input>, which speaks utc for `date`.
const isoDate  = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const isoTime  = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const isoStamp = (date) => `${isoDate(date)}T${isoTime(date)}`;

// `time` is milliseconds since midnight, not an epoch — it only becomes a Date
// by hanging it on some local day, and only Intl ever needs it as one
const instantOf = (type, value) => type === 'time'
  ? new Date(1970, 0, 1, 0, 0, 0, value)
  : new Date(value);

// :::::: FORMAT

/** the value as the matching control would carry it — what `datetime` and copy want */
function machineText (type, value) {
  if (value == null)       return '';
  if (type === 'date')     return isoDate (new Date(value));
  if (type === 'datetime') return isoStamp(new Date(value));
  if (type === 'time')     return isoTime (instantOf('time', value));
  return valueType(type).format(value);
}

/** the value as it is shown: `format` names a notation, the machine form is the default */
function displayText (type, value, format, locale) {
  if (value == null) return '';

  return (INTL_OPTIONS[type] && STYLES.includes(format))
       ? new Intl.DateTimeFormat(locale, INTL_OPTIONS[type](format)).format(instantOf(type, value))
       : (type === 'number' && format === 'locale')
       ? new Intl.NumberFormat(locale).format(value)
       : machineText(type, value);
}

// :::::: MAIN

export default class AufbauValue extends AufbauElement {
  static attr = {
    format : String,
    locale : { type: String, config: true },
    type   : { type: String, default: 'text', values: TYPE_NAMES },
    value  : String, // the value. absent, the authored text content becomes it (see onMount)
    copy   : Boolean,
    icon   : String,
  };

  // the watchlist is otherwise built from the schema, which cannot know the
  // per-type format keys — without them a setConfig() at runtime would change
  // what this element reads without repainting it
  static observedConfig = [
    ...TYPE_NAMES.flatMap(type => configKeys(TAG, `${type}-format`)),
    ...configKeys(TAG, 'format'),
    ...configKeys(TAG, 'locale'),
  ];

  static styles = `
    aufbau-value {
      align-items : baseline;
      display     : inline-flex;
      gap         : var(--value-gap, 0.25rem);

      &:not([value]) { display: none; }

      &[type="date"], 
      &[type="datetime"],
      &[type="number"],
      &[type="time"],
      &[type="year"] {
        .value-text { font-variant-numeric: tabular-nums; }
      }
    }

    aufbau-value > .value-icon { align-self: center; }
    
    aufbau-value > .value-copy {
      align-self : center;
      background : none;
      color      : inherit;
      cursor     : pointer;
      display    : inline-flex;
      font       : inherit;

      border      : 0;
      line-height : 0;
      margin      : 0;
      padding     : 0;
    }
  `;

  // :::::: VALUE

  parseValue (raw) {
    const type = this.getAttr('type');
    const text = String(raw ?? '').trim();
    if (TIME_TYPES.has(type) && NUMERIC.test(text)) return Number(text);
    return valueType(type).parse(raw);
  }

  formatValue (value) { return machineText(this.getAttr('type'), value); }

  /** the parsed value, in whatever shape its type stores (an epoch for `date`, ms since midnight for `time`) */
  get value () {
    const raw = this.getAttribute('value');
    return raw == null || raw === '' ? null : this.parseValue(raw);
  }

  set value (next) {
    this.setAttr({ value: next == null || next === '' ? false : this.formatValue(this.parseValue(next)) });
  }

  /** what is shown */
  get text () {
    const { type } = this.getAttr();
    try   { return displayText(type, this.value, this.formatName(), this.getAttr('locale') || undefined); }
    catch { return machineText(type, this.value); }   // a bad locale must not take the page with it
  }

  /** the value as a string, the same one the matching control would carry */
  get machine () { return this.formatValue(this.value); }

  // :::::: CONFIG

  /**
   * the format to use: the attribute first, then a config key for this type
   * (`value-date-format`), then one for all of them (`value-format`).
   */
  formatName () {
    const type = this.getAttr('type');
    return this.getConfig('format', '', [
      ...configKeys(this.tag, `${type}-format`),
      ...configKeys(this.tag, 'format'),
    ]);
  }

  /** the icon to show before the value, '' for none */
  iconName () {
    if (!this.hasAttr('icon')) return '';
    return this.getAttr('icon') || valueType(this.getAttr('type')).icon || '';
  }

  // :::::: LIFECYCLE

  onMount () {
    // the authored text content is the value: <aufbau-value type="date">1745…</aufbau-value>.
    // it is cleared before the attribute is set, because setAttr renders
    // synchronously and the clear would wipe that markup right back out
    const inline = this.textContent.trim();
    if (inline && !this.hasAttribute('value')) {
      this.textContent = '';
      this.setAttr({ value: inline });
    }

    this.invalidate();

    this.on('click', '.value-copy', (event, button) => this.copy(button));
  }

  onUnmount () { clearTimeout(this._copyTimer); }

  // :::::: RENDER

  render () {
    const { copy, type } = this.getAttr();
    const text = this.text;
    if (!text) return html``;

    const icon = this.iconName();

    // <time> is what an instant is in html, and `datetime` carries the machine
    // form whatever notation the page is reading
    const body = TIME_TYPES.has(type)
      ? html`<time class="value-text" ${attrs({ datetime: this.machine })}>${text}</time>`
      : html`<span class="value-text">${text}</span>`;

    return html`
      ${icon && html`<aufbau-icon class="value-icon" icon="${icon}"></aufbau-icon>`}
      ${body}
      ${copy && html`
        <button type="button" class="value-copy" title="copy">
          <aufbau-icon icon="lucide:copy"></aufbau-icon>
        </button>`}
    `;
  }

  // :::::: CLIPBOARD

  /** what is on screen is what is copied; the value behind it is `el.machine` */
  async copy (button) {
    const text = this.text;

    try {
      await navigator.clipboard.writeText(text);

      const icon = button?.querySelector('aufbau-icon');
      icon?.setAttribute('icon', 'lucide:check');
      clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(() => icon?.setAttribute('icon', 'lucide:copy'), COPY_FEEDBACK);

      this.emit('aufbau-value-copy', { value: text });
    }
    catch (error) { console.warn('[aufbau-value] clipboard copy failed:', error); }

    return this;
  }
}

AufbauValue.init();
