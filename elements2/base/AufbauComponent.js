import { AufbauElement } from './index.js';
import setAttr           from '@domina/methods/setAttr.js';

const FORWARD = ['disabled', 'label', 'name', 'persist', 'readonly', 'required'];

export class AufbauComponent extends AufbauElement {

  static attr = {
    disabled : Boolean,
    label    : String,
    name     : String,
    persist  : String,
    readonly : Boolean,
    required : Boolean,
    value    : String,
  };

  // selector of the inner element that holds the value
  static control = null;

  static forward = [];

  get control () { return this.constructor.control ? this.querySelector(this.constructor.control) : null; }

  get value () { return this.control?.value ?? this.getAttribute('value') ?? ''; }

  set value (value) {
    if (this.control) this.control.value = value;
    else this.setAttribute('value', value ?? '');
  }

  get initialValue () { return this._initialValue ??= this.getAttribute('value') ?? ''; }

  bind () {}

  onMount  () { if (this._markup !== undefined) this.bind(); }
  onRender () { this.bind(); }

  onAttributeChange (name, oldValue, newValue) {
    if (name === 'value' && this.control) this.control.value = newValue ?? '';
  }

  sync () {
    const control = this.control;
    if (!control) return;

    const values = this.getAttr();
    const names  = [...FORWARD, ...this.constructor.forward];
    setAttr(control, Object.fromEntries(names.map(name => [name, values[name] ?? false])));
  }

  mute (element, types = ['change', 'input']) {
    for (const type of types) this.on(element, type, event => event.stopPropagation());
  }
}

export default AufbauComponent;
