import gui from '@aufbau/gui';

import { AufbauElement } from '@aufbau/element';

export class AppConfig extends AufbauElement {

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

  get controls ()         { return this._controls ?? null; }
  set controls (controls) { this._controls = controls; if (this._built) this.build(); }

  get values ()     { return this._values ?? {}; }
  set values (next) { this._values = next; if (!this._built) this.build(); else this.fill(); }

  onConnected () { this.build(); }

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

  fill () {
    for (const [key, value] of Object.entries(this.values)) {
      const control = this.querySelector(`[name="${CSS.escape(key)}"]:not(fieldset)`);
      if (!control) continue;

      if (control.type === 'checkbox') control.checked = Boolean(value);
      else if (String(control.value ?? '') !== String(value ?? '')) control.value = value ?? '';
    }
  }
}

AppConfig.init('app-config');

export default AppConfig;
