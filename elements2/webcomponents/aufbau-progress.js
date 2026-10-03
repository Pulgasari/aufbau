import { AufbauElement } from '@aufbau/element';

const clamp = value => Math.min(100, Math.max(0, value));

export default class AufbauProgress extends AufbauElement {
  static internals = { role: 'progressbar' };

  static reflect = ['type'];

  static attr = {
    max      : 100,
    showText : Boolean,
    target   : String,
    type     : { default: 'standard', values: ['standard', 'scroll'] },
    unit     : '%',
    value    : Number,
  };

  static styles = `
    aufbau-progress {
      --progress-size: 0.5em;

      align-items : center;
      display     : flex;
      gap         : var(--control-gap, 0.5em);

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

  onConnected () { this.watchScroll(); }

  onAttributeChanged (name) {
    if (name === 'target' || name === 'type') this.watchScroll();
  }

  watchScroll () {
    this._scrollWatch?.abort();
    this._scrollWatch = null;

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

    this._scrollWatch = new AbortController;
    this.$(scroller).until(this._scrollWatch.signal).on('scroll', measure, { passive: true });
    measure();
  }

  render () {
    return this.getAttr('showText') ? '<span></span>' : '';
  }

  sync () {
    const { max, type, unit, value } = this.getAttr();

    const indeterminate = value === undefined && type !== 'scroll';
    const percentage    = indeterminate ? 0 : clamp((value ?? 0) / max * 100);

    this.setVar('--progress', `${percentage}%`);

    if (this.internals) {
      this.internals.ariaValueMin = '0';
      this.internals.ariaValueMax = String(max);
      this.internals.ariaValueNow = indeterminate ? null : String(value ?? 0);
    }

    this.$(':scope > span').text(indeterminate ? '' : `${Math.round(percentage)}${unit}`);
  }
}

AufbauProgress.init();
