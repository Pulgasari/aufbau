// <app-config>
// the settings of an app as a form, rendered by @aufbau/gui from a spec. it is
// content only, the frame is the app's: a view, an <app-area> (in an
// <app-panel>) or an <aufbau-modal>.
//
//   const config = document.querySelector('app-config');
//   config.spec   = { open: { type: 'enum', values: ['auto', 'single'], label: 'Open with' } };
//   config.values = { open: 'auto' };
//   config.addEventListener('config', event => save(event.detail.key, event.detail.values));
//
// spec and values are properties, setting either rebuilds the form. the form is
// built from the values of that moment, later changes come from the user.
// events: config { key, values }. not `change`: that one already bubbles out of
// every control inside.

import gui from '@aufbau/gui';

import { AufbauElement } from '@aufbau/elements/core/index.js';

import { define, tagOf } from '../core/names.js';

export class AppConfig extends AufbauElement {

  // @aufbau/gui renders <div><label><span>label</span><aufbau-*></label>…</div>:
  // one field per line, the label beside its control while there is room
  static styles () {
    return `${tagOf('app-config')} {
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

  get values ()     { return this._values ?? {}; }
  set values (next) { this._values = next; this.build(); }

  onMount () { this.build(); }

  // the form goes in as nodes of its own, the children are the component's
  build () {
    if (!this.isConnected) return;

    const form = gui.render(this.spec, {
      values   : { ...this.values },
      onChange : (values, key) => {
        if (key == null) return;
        this._values = { ...this.values, [key]: values[key] };
        this.emit('config', { key, values });
      },
    });

    this.replaceChildren(form);
  }
}

define('app-config', AppConfig);

export default AppConfig;
