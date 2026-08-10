// <aufbau-splash>
//
// the initial loading screen. the overlay itself is painted by the critical css
// boot.js injects (see the data-splash block there, or the snippet in the readme);
// this class only decides WHEN it goes away.
//
// it declares no `static styles` on purpose. adoptClassStyles() adopts
// asynchronously and applySkin() fetches a skin over the network, so keying the
// overlay on the upgrade — aufbau-splash:not(:defined) — would drop every rule a
// frame or more before its replacement landed. the critical css uses an
// unconditional selector plus data-state instead, which looks identical before
// and after the upgrade and makes the handover a literal no-op.

import { AufbauElement } from './core/index.js';
import { ready, sleep }  from '@aufbau/js';

// removal is idempotent, so the backstop only has to be generously longer than
// the dismiss animation, not exact
const REMOVE_AFTER = 1000;
const REVEAL       = 'aufbau-splash-reveal';

export default class AufbauSplash extends AufbauElement {
  static attr = {
    minimum : 400,
    timeout : 8000,
  };

  // render() stays at the base default of null, so the authored markup — logo,
  // wording, whatever — is never touched

  onMount () {
    if (this.getAttribute('is')) {
      console.warn('[aufbau-splash] customized built-ins are not supported (safari has none), use <aufbau-splash>');
      return this.remove();
    }

    /*
      position: fixed resolves against the nearest ancestor carrying transform,
      filter, backdrop-filter, perspective, contain or will-change on one of
      those — a splash nested inside the app shell would be clipped by any of
      them. body is the only parent that cannot do that.
    */
    if (this.parentElement !== document.body) document.body.append(this);

    document.documentElement.setAttribute('aria-busy', 'true');

    /*
      "was this actually seen?" — the reveal animation carries a delay, so a boot
      that finishes inside it never starts the animation and the splash can be
      skipped outright rather than faded out of a state it never reached.

      by the time this class exists the reveal has usually started already — that
      IS what a splash is for — so listening for animationstart alone would miss
      it every time it mattered. ask the running animation instead, and only fall
      back to the event when it has not begun yet.
    */
    const age = this.revealAge();

    if (age !== null) this._revealedAt = performance.now() - age;
    else this.on('animationstart', (event) => {
      if (event.animationName === REVEAL) this._revealedAt = performance.now();
    });

    // a page restored from the bfcache brings back whatever overlay was in flight
    this.on(window, 'pageshow', (event) => { if (event.persisted) this.finish('done'); });

    this.settle();
  }

  onUnmount () {
    document.documentElement.removeAttribute('aria-busy');
  }

  /** ms the reveal has spent past its delay, or null if it has not started yet */
  revealAge () {
    const reveal = this.getAnimations().find(animation => animation.animationName === REVEAL);
    if (!reveal) return null;

    const delay   = reveal.effect?.getTiming?.().delay ?? 0;
    const elapsed = Number(reveal.currentTime ?? 0) - delay;

    return elapsed > 0 ? elapsed : null;
  }

  async settle () {
    const { minimum, timeout } = this.getAttr();

    const report = await ready({ timeout });

    if (report.timedOut) {
      // loud on purpose. a silent splash turns a visibly broken page into one
      // that merely feels slow, which is a far worse thing to ship.
      console.error('[aufbau-splash] gave up waiting. gates:', report.gates);
      this.emit('aufbau-splash-timeout', report);
    }

    // hold a splash that actually appeared, so it does not strobe
    const shown = this._revealedAt ? performance.now() - this._revealedAt : 0;
    if (this._revealedAt && shown < minimum) await sleep(minimum - shown);

    this.finish(this._revealedAt ? 'done' : 'skipped');
  }

  finish (state) {
    if (this._finished) return this;
    this._finished = true;

    document.documentElement.removeAttribute('aria-busy');
    this.setAttribute('data-state', state);
    this.emit('aufbau-splash-done', { state });

    // never revealed, so there is nothing to fade out of
    if (state === 'skipped') { this.remove(); return this; }

    // animation events do not fire for an element that is not being rendered — a
    // backgrounded tab, say — so the timer is the half that has to be reliable
    this.on('animationend', () => this.remove());
    setTimeout(() => this.remove(), REMOVE_AFTER);

    return this;
  }
}

AufbauSplash.init();
