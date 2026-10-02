// <app-config>
// the settings of an app as a form, rendered by @aufbau/gui from a spec. it is
// content only, the frame is the app's: a view, an <app-area> (in an
// <app-panel>) or an <aufbau-modal>.
//
//   const config = document.querySelector('app-config');
//   config.spec   = { open: { type: 'enum', values: ['auto', 'single'], label: 'Open with' } };
//   config.values = { open: 'auto' };
//   config.controls = { enum: { look: 'segments' } };   // optional, before the spec
//   config.addEventListener('config', event => save(event.detail.key, event.detail.values));
//
// spec and values are properties. a new spec rebuilds the form, new values
// only reach the controls whose value differs: the form stays, focus and an
// open picker with it. so values can follow the app's state while it is open.
// events: config { key, values }. not `change`: that one already bubbles out of
// every control inside.

import gui from '@aufbau/gui';

import { AufbauElement } from '../core/index.js';


export class AppConfig extends AufbauElement {

  // @aufbau/gui renders <div><label><span>label</span><aufbau-*></label>…</div>:
  // one field per line, the label beside its control while there is room
  static styles () {
    return `app-config {
      display: block;

      > div {
        display        : flex;
        flex-direction : column;
        gap            : var(--config-gap, 0.75rem);
      }

      label {
        align-items : center;
        display     : flex;
        flex-wrap   : wrap;
        gap         : 0.25rem 0.75rem;

        > span       { flex: 0 0 var(--config-label-size, 7rem); font-size: 0.85em; opacity: 0.65; }
        > :not(span) { flex: 1 1 12rem; min-inline-size: 0; }
      }
    }`;
  }

  get spec ()       { return this._spec ?? {}; }
  set spec (spec)   { this._spec = spec; this.build(); }

  // how fields render, per type or key (@aufbau/gui's controls). set before the spec
  get controls ()         { return this._controls ?? null; }
  set controls (controls) { this._controls = controls; if (this._built) this.build(); }

  get values ()     { return this._values ?? {}; }
  set values (next) { this._values = next; if (!this._built) this.build(); else this.fill(); }

  onMount () { this.build(); }

  // the form goes in as nodes of its own, the children are the component's
  build () {
    if (!this.isConnected) return;

    const form = gui.render(this.spec, {
      controls : this.controls,
      values   : { ...this.values },
      onChange : (values, key) => {
        if (key == null) return;
        this._values = { ...this.values, [key]: values[key] };
        this.emit('config', { key, values });
      },
    });

    this.replaceChildren(form);
    this._built = true;
  }

  // the values into the controls that show something else. a toggle holds its
  // value in `checked`, every other control in `value`
  fill () {
    for (const [key, value] of Object.entries(this.values)) {
      const control = this.querySelector(`[name="${CSS.escape(key)}"]:not(fieldset)`);
      if (!control) continue;

      if (control.localName === 'aufbau-toggle') control.toggleAttribute('checked', Boolean(value));
      else if (String(control.value ?? '') !== String(value ?? '')) control.value = value ?? '';
    }
  }
}

AppConfig.init('app-config');

export default AppConfig;
