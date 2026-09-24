// <aufbau-progress>
// the host is the progressbar. ::before is the track, the bar is a background
// layer on it sized by --progress. the only child is the optional text.

import { AufbauElement } from './core/index.js';

const clamp = value => Math.min(100, Math.max(0, value));

export default class AufbauProgress extends AufbauElement {
  static internals = { role: 'progressbar' };

  static attr = {
    max      : 100,
    showText : Boolean,
    target   : String,
    type     : { default: 'standard', values: ['standard', 'scroll'] },
    unit     : '%',
    value    : Number,
  };

  // colours come from --progress-track and --progress-bar, the skin sets them
  static styles = `
    aufbau-progress {
      --progress-size: 0.5em;

      align-items : center;
      display     : flex;
      gap         : var(--aufbau-control-gap, 0.5em);

      &::before {
        background-color  : var(--progress-track, transparent);
        background-image  : linear-gradient(var(--progress-bar, currentColor), var(--progress-bar, currentColor));
        background-repeat : no-repeat;
        background-size   : var(--progress, 0%) 100%;
        block-size        : var(--progress-size);
        content           : '';
        flex              : 1 1 auto;
        transition        : background-size 0.2s ease;
      }

      > span {
        flex                 : none;
        font-size            : 0.75em;
        font-variant-numeric : tabular-nums;
        line-height          : 1;
      }

      /* no value and not driven by scrolling: an unknown amount of work */
      &:not([value], [type="scroll"])::before {
        animation       : aufbau-progress-slide 1.2s ease-in-out infinite;
        background-size : 35% 100%;
      }
    }

    @keyframes aufbau-progress-slide {
      from { background-position: -100% 0; }
      to   { background-position:  200% 0; }
    }
  `;

  onMount () { this.watchScroll(); }

  onAttributeChange (name) {
    if (name === 'target' || name === 'type') this.watchScroll();
  }

  // type="scroll" mirrors the scroll position of `target` (the page by default) into `value`
  watchScroll () {
    this._unwatchScroll?.();
    this._unwatchScroll = null;

    const { target, type } = this.getAttr();
    if (type !== 'scroll') return;

    const scroller = !target || target === 'body' ? window : document.querySelector(target);
    if (!scroller) return;

    const element = scroller === window ? document.documentElement : scroller;
    const measure = () => {
      const total = element.scrollHeight - element.clientHeight;
      const value = total > 0 ? clamp(element.scrollTop / total * 100) : 0;
      this.setAttr({ value: value.toFixed(1) });
    };

    this._unwatchScroll = this.on(scroller, 'scroll', measure, { passive: true });
    measure();
  }

  // structure only, the amount is applied in sync() so a scroll bar restyles instead of rebuilding
  render () {
    return this.getAttr('showText') ? '<span></span>' : '';
  }

  sync () {
    const { max, type, unit, value } = this.getAttr();

    const indeterminate = value === undefined && type !== 'scroll';
    const percentage    = indeterminate ? 0 : clamp((value ?? 0) / max * 100);

    this.style.setProperty('--progress', `${percentage}%`);

    if (this.internals) {
      this.internals.ariaValueMin = '0';
      this.internals.ariaValueMax = String(max);
      this.internals.ariaValueNow = indeterminate ? null : String(value ?? 0);
    }

    const text = this.$(':scope > span');
    if (text) text.textContent = indeterminate ? '' : `${Math.round(percentage)}${unit}`;
  }
}

AufbauProgress.init();
