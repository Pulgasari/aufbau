// <input-pattern>
// a background pattern of @aufbau/patterns, as a string: the pattern's id,
// then what is switched on: an opacity, a pattern and a background color.
//
//   'dots'                      the pattern alone
//   'dots 8%'                   with `opacity`
//   'dots 8% #ffffff #202020'   with `opacity` and `colors`
//   ''                          no pattern
//
//   <input-pattern name="background" value="dots 8%" opacity></input-pattern>
//   <input-pattern name="tiles" patterns="dots grid waves" colors></input-pattern>
//
// the swatches paint each pattern as a mask over the text color, so the picker
// follows the theme. without `colors` the value is meant to be painted the same
// way where it is used: patternStyle() turns it into the custom properties for
// that, the css below them is the page's.
//
//   patterns   space separated ids, every pattern when absent
//   opacity    a slider for the opacity, 0 to 100%
//   colors     two color inputs, the pattern's and the background's
//   required   no swatch for no pattern

import '@aufbau/elements/AufbauInput.js';
import '@aufbau/elements/AufbauSlider.js';

import { attrs, html }     from '@aufbau/elements/core/html.js';
import { list, use }       from '@aufbau/patterns';
import { AufbauComponent } from '../core/AufbauComponent.js';
import { listOf }          from '../core/OptionsComponent.js';
import { define, tagOf }   from '../core/names.js';

// :::::: VALUE :::::::::::::::::::::::::::::::::::::::::::::::::

const PERCENT = /^(\d+(?:\.\d+)?)%$/;

/** the parts of a value: { id, opacity (0..1 or null), fg, bg } */
export function parsePattern (value = '') {
  const tokens = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  const id     = tokens.shift() ?? '';
  const result = { bg: null, fg: null, id: id === 'none' ? '' : id, opacity: null };

  for (const token of tokens) {
    const percent = token.match(PERCENT);
    if (percent)          result.opacity = Math.min(1, Number(percent[1]) / 100);
    else if (!result.fg)  result.fg = token;
    else if (!result.bg)  result.bg = token;
  }

  return result;
}

/** a value from its parts, the inverse of parsePattern() */
export function formatPattern ({ bg, fg, id, opacity } = {}) {
  if (!id) return '';
  const percent = opacity == null ? null : `${Math.round(opacity * 100)}%`;
  // the colors are read by position, so a background needs the pattern color before it
  const colors  = bg ? [fg ?? '#000000', bg] : [fg];
  return [id, percent, ...colors].filter(Boolean).join(' ');
}

/**
 * the custom properties a value paints with, null for no pattern:
 * --pattern-image (the tile as url(), in its colors, black on transparent
 * without) and --pattern-opacity. `name` replaces the "pattern" in both, for
 * more than one on a page. painted as a mask over a color, the pattern takes
 * the color of its place:
 *
 *   .box::before { background: currentColor; mask: var(--pattern-image); opacity: var(--pattern-opacity); }
 */
export async function patternStyle (value, { name = 'pattern', opacity = 1 } = {}) {
  const { bg, fg, id, opacity: own } = parsePattern(value);
  if (!id) return null;

  const options = {};
  if (fg) options.fg = fg;
  if (bg) options.bg = bg;

  try {
    return { [`--${name}-image`]: await use(id, options).image(), [`--${name}-opacity`]: String(own ?? opacity) };
  }
  catch { return null; }
}

// :::::: ELEMENT :::::::::::::::::::::::::::::::::::::::::::::::

// the swatch of no pattern is data-pattern="none", an empty attribute would not render
const idOf = button => button.dataset.pattern === 'none' ? '' : button.dataset.pattern;

export class InputPattern extends AufbauComponent {

  static attr = {
    colors   : Boolean,
    opacity  : Boolean,
    patterns : String,
  };

  static control = ':scope > aufbau-input[data-carrier]';

  static styles () {
    return `${tagOf('input-pattern')} {
      display        : flex;
      flex-direction : column;
      gap            : var(--aufbau-control-gap, 0.5em);

      > aufbau-input[data-carrier] { display: none; }

      > [role="radiogroup"] {
        display               : grid;
        gap                   : 0.375em;
        grid-template-columns : repeat(auto-fill, minmax(var(--pattern-swatch-size, 2.75em), 1fr));
      }

      [data-pattern] {
        aspect-ratio  : 1;
        background    : none;
        border        : var(--border, 1px solid color-mix(in oklab, currentColor 25%, transparent));
        border-radius : var(--radius-control, 0.375em);
        color         : inherit;
        cursor        : pointer;
        overflow      : hidden;
        padding       : 0;
        position      : relative;

        > span {
          background-color : currentColor;
          inset            : 0;
          mask-image       : var(--swatch);
          opacity          : 0.7;
          position         : absolute;
        }

        /* no pattern: one diagonal stroke */
        &[data-pattern="none"] > span {
          background : linear-gradient(to top right, transparent calc(50% - 1px), currentColor 0 calc(50% + 1px), transparent 0);
          mask-image : none;
          opacity    : 0.4;
        }

        &[aria-checked="true"] { outline: 2px solid var(--color-ink, currentColor); outline-offset: 1px; }
        &:focus-visible        { outline: 2px solid var(--color-focus, currentColor); outline-offset: 1px; }
      }

      > .colors { display: flex; gap: var(--aufbau-control-gap, 0.5em); }
    }`;
  }

  get ids () {
    const known = list().map(pattern => pattern.id);
    return listOf(this.getAttr('patterns'), known).filter(id => known.includes(id));
  }

  get parts () { return parsePattern(this.value); }

  render () {
    const { colors, opacity, required } = this.getAttr();
    const parts  = parsePattern(this.initialValue);
    const names  = Object.fromEntries(list().map(pattern => [pattern.id, pattern.name]));
    const swatch = (id, label) => html`<button type="button" role="radio" ${attrs({ 'aria-label': label, 'data-pattern': id, title: label })}><span></span></button>`;

    return html`
      <div role="radiogroup">
        ${!required && swatch('none', 'none')}
        ${this.ids.map(id => swatch(id, names[id] ?? id))}
      </div>
      ${opacity && html`<aufbau-slider data-opacity type="number" min="0" max="100" step="1" ${attrs({ value: Math.round((parts.opacity ?? 0.1) * 100) })}></aufbau-slider>`}
      ${colors && html`
        <div class="colors">
          <aufbau-input data-fg type="color" look="swatch" ${attrs({ value: parts.fg ?? '#000000' })}></aufbau-input>
          <aufbau-input data-bg type="color" look="swatch" ${attrs({ value: parts.bg ?? '#ffffff' })}></aufbau-input>
        </div>`}
      <aufbau-input type="text" data-carrier ${attrs({ value: this.initialValue })}></aufbau-input>
    `;
  }

  bind () {
    const helpers = this.querySelectorAll('aufbau-slider[data-opacity], aufbau-input[data-fg], aufbau-input[data-bg]');
    for (const helper of helpers) this.mute(helper);

    this.on('click', '[data-pattern]', (event, button) => this.pick(idOf(button)));
    this.on('keydown', '[data-pattern]', (event, button) => this.step(event, button));

    for (const helper of helpers) this.on(helper, 'change', () => this.pick(this.parts.id || this.ids[0] || ''));

    this.paintSwatches();
  }

  // a value set from outside shows at once: the swatch and the opacity follow
  get value ()      { return super.value; }
  set value (value) { super.value = value; this.update(); }

  sync () {
    super.sync();
    const { id, opacity } = this.parts;
    const slider = this.querySelector('aufbau-slider[data-opacity]');
    if (slider && opacity != null && !slider.contains(document.activeElement)) slider.value = Math.round(opacity * 100);

    const buttons = [...this.querySelectorAll('[data-pattern]')];
    const current = buttons.find(button => idOf(button) === id) ?? buttons[0];
    for (const button of buttons) {
      button.setAttribute('aria-checked', String(button === current && idOf(button) === id));
      button.tabIndex = button === current ? 0 : -1;
    }
  }

  /** commits a pattern with the helpers' current opacity and colors */
  pick (id) {
    const { colors, opacity } = this.getAttr();
    const slider = this.querySelector('aufbau-slider[data-opacity]');
    const fg     = this.querySelector('aufbau-input[data-fg]');
    const bg     = this.querySelector('aufbau-input[data-bg]');

    this.control?.commit(formatPattern({
      bg      : colors  ? bg?.value || null : null,
      fg      : colors  ? fg?.value || null : null,
      id,
      opacity : opacity ? Number(slider?.value ?? 10) / 100 : null,
    }));
    this.update();
  }

  // arrows move through the swatches like a radio group
  step (event, button) {
    const keys = { ArrowDown: 1, ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();

    const buttons = [...this.querySelectorAll('[data-pattern]')];
    const next    = buttons[(buttons.indexOf(button) + keys[event.key] + buttons.length) % buttons.length];
    next.focus();
    this.pick(idOf(next));
  }

  // the tiles are rendered by @aufbau/patterns, one by one as they arrive
  paintSwatches () {
    for (const span of this.querySelectorAll('[data-pattern] > span')) {
      const id = idOf(span.parentElement);
      if (!id || span.style.getPropertyValue('--swatch')) continue;
      use(id).image().then(image => span.style.setProperty('--swatch', image)).catch(() => {});
    }
  }
}

define('input-pattern', InputPattern);

export default InputPattern;
